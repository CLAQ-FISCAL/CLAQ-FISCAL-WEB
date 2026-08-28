import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});

export interface PDFGenerationInput {
  simulationId: string;
  clientName: string;
  clientNuit: string;
  totalTaxAmount: number;
  currency: string;
  responsibleName: string;
  calculationBreakdown: Record<string, any>;
}

export class PDFGeneratorService {
  private static readonly S3_BUCKET = process.env.DOCUMENT_BUCKET || 'claq-fiscal-documents';

  public static async generateAndUploadSignedCertificate(input: PDFGenerationInput): Promise<{ pdfUrl: string; digitalSealHash: string }> {
    const rawPayload = `${input.simulationId}|${input.clientNuit}|${input.totalTaxAmount}|${input.currency}`;
    const digitalSealHash = crypto.createHmac('sha256', process.env.DIGITAL_SEAL_SECRET || 'CLAQ_HMAC_2026').update(rawPayload).digest('hex');

    const s3Key = `certificates/${new Date().getFullYear()}/${input.simulationId}_signed.pdf`;

    const metadata = {
      simulationId: input.simulationId,
      clientName: input.clientName,
      totalTaxAmount: input.totalTaxAmount.toString(),
      currency: input.currency,
      responsibleName: input.responsibleName,
      digitalSealHash,
      generatedAt: new Date().toISOString(),
    };

    await s3.send(new PutObjectCommand({
      Bucket: this.S3_BUCKET,
      Key: s3Key,
      ContentType: 'application/json',
      Body: JSON.stringify({ metadata, breakdown: input.calculationBreakdown }),
      Metadata: Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, v.toString()])),
    }));

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: this.S3_BUCKET, Key: s3Key }),
      { expiresIn: 3600 }
    );

    console.log(`[AWS S3 / PDF Service] Uploaded certificate to s3://${this.S3_BUCKET}/${s3Key}`);
    return {
      pdfUrl: presignedUrl,
      digitalSealHash
    };
  }
}

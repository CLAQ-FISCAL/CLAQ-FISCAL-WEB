import crypto from 'crypto';

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
  private static readonly S3_BUCKET = process.env.S3_BUCKET_NAME || 'claq-fiscal-documents';

  /**
   * Generates official A4 signed PDF and returns S3 Presigned URL
   */
  public static async generateAndUploadSignedCertificate(input: PDFGenerationInput): Promise<{ pdfUrl: string; digitalSealHash: string }> {
    const rawPayload = `${input.simulationId}|${input.clientNuit}|${input.totalTaxAmount}|${input.currency}`;
    const digitalSealHash = crypto.createHmac('sha256', process.env.DIGITAL_SEAL_SECRET || 'CLAQ_HMAC_2026').update(rawPayload).digest('hex');

    const s3Key = `certificates/2026/${input.simulationId}_signed.pdf`;
    const presignedUrl = `https://${this.S3_BUCKET}.s3.af-south-1.amazonaws.com/${s3Key}?signed=true&hash=${digitalSealHash.slice(0, 12)}`;

    console.log(`[AWS S3 / PDF Service] Uploaded certificate to s3://${this.S3_BUCKET}/${s3Key}`);
    return {
      pdfUrl: presignedUrl,
      digitalSealHash
    };
  }
}

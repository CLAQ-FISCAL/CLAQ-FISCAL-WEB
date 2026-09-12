import React from 'react';
import {
  X,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../context/AppStateContext';
import { formatMZN, formatDate } from '../../utils/formatters';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';

export const PDFPreviewModal: React.FC = () => {
  const { t } = useTranslation();
  const { isPDFModalOpen, setIsPDFModalOpen, pdfSimulationData, user, addToast } = useAppState();

  if (!isPDFModalOpen || !pdfSimulationData) return null;

  const data = pdfSimulationData;

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Brand
      doc.setFillColor(11, 19, 43);
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('CLAQ FISCAL ALERT', 20, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(245, 158, 11);
      doc.text(t('pdf:officialReport'), 20, 25);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(t('pdf:headerLawLine'), 110, 25);

      // Simulation Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(t('pdf:simulationTitle', { title: data.simulatorTitle.toUpperCase() }), 20, 44);

      // Metadata Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 50, 170, 32, 3, 3, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(t('pdf:simulationData'), 26, 57);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(t('pdf:clientCompany', { client: data.clientName }), 26, 64);
      doc.text(t('pdf:nuit', { nuit: data.nuit || '400889900' }), 26, 70);
      doc.text(t('pdf:providerCountry', { country: data.providerCountry || t('pdf:unitedStates') }), 26, 76);

doc.text(t('pdf:calculationDate', { date: formatDate(data.date) }), 110, 64);
      doc.text(t('pdf:technicalResponsible', { name: data.responsibleName || user?.name || t('pdf:taxAdministrator') }), 110, 70);
      doc.text(t('pdf:originalCurrency', { amount: data.originalAmount.toLocaleString('pt-MZ'), currency: data.currency }), 110, 76);

      // Calculation Breakdown Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(t('pdf:breakdownTitle'), 20, 92);

      let startY = 98;
      const rows = [
        [t('pdf:rowMznOfficial'), formatMZN(data.mznAmount)],
        [t('pdf:rowIncidenceBase'), formatMZN(data.taxBase)],
        [t('pdf:rowIVAPayOfficial'), formatMZN(data.ivaAmount)],
        [t('pdf:rowIRPCWithheldOfficial'), formatMZN(data.irpcAmount)]
      ];

      doc.setFontSize(9.5);
      rows.forEach((r, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.rect(20, startY, 170, 9, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(20, startY + 9, 190, startY + 9);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(r[0], 26, startY + 6.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(r[1], 184, startY + 6.5, { align: 'right' });

        startY += 9;
      });

      // Total Highlight Box
      startY += 4;
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(20, startY, 170, 14, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(t('pdf:totalImposts'), 26, startY + 9);
      doc.text(formatMZN(data.totalTax), 184, startY + 9, { align: 'right' });

      // Legal trace & notes
      startY += 24;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(t('pdf:legalFramework'), 20, startY);

      startY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(t('pdf:legalIVA'), 20, startY);
      startY += 5;
      doc.text(t('pdf:legalIRPC'), 20, startY);
      startY += 5;
      doc.text(t('pdf:legalCircular'), 20, startY);

      // Digital Seal & Signature
      startY += 20;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, startY, 80, 30, 2, 2, 'D');
      doc.roundedRect(110, startY, 80, 30, 2, 2, 'D');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(t('pdf:digitalSignature'), 25, startY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Hash: SHA256-CLAQ-' + data.id.toUpperCase(), 25, startY + 14);
      doc.text(t('pdf:issuedOn', { date: new Date().toLocaleDateString('pt-MZ') }), 25, startY + 20);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(t('pdf:entityStamp'), 115, startY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('CLAQ Consultores, Lda.', 115, startY + 14);
      doc.text('NUIT: 400889900 • Maputo', 115, startY + 20);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(t('pdf:footerMotto'), 105, 285, { align: 'center' });

      // Save file
      doc.save(`CLAQ_${t('pdf:fileNameSimulation')}_${data.simulatorTitle.replace(/\s+/g, '_')}_${data.clientName.replace(/\s+/g, '_')}.pdf`);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });

      addToast('success', t('pdf:toastTitle'), t('pdf:toastMessage'));
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsPDFModalOpen(false)}>
      <div
        className="modal-card"
        style={{ maxWidth: '820px', width: '95%', maxHeight: '94vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
              {t('pdf:modalTitle')}
            </h3>
            <span className="badge badge-green" style={{ fontSize: '11px' }}>
              {t('pdf:badgeCertified')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
              title={t('common:print')}
            >
              <Printer size={15} />
              <span>{t('common:print')}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="btn btn-primary-blue btn-sm"
              title={t('pdf:downloadPdfTitle')}
            >
              <Download size={15} />
              <span>{t('pdf:downloadPdf')}</span>
            </button>
            <button
              onClick={() => setIsPDFModalOpen(false)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Canvas */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#64748B',
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            className="pdf-document-paper"
            style={{
              backgroundColor: '#FFFFFF',
              width: '100%',
              maxWidth: '680px',
              minHeight: '860px',
              padding: '40px',
              borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #0F172A',
                  paddingBottom: '16px',
                  marginBottom: '20px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>
                      C
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em', color: '#0F172A' }}>
                      CLAQ
                    </span>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', letterSpacing: '0.12em', display: 'block', marginTop: '2px' }}>
                    {t('pdf:bannerTagline')}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    {t('pdf:documentTitle')}
                  </h4>
                  <p style={{ fontSize: '11px', color: '#64748B' }}>
                    {data.simulatorTitle}
                  </p>
                  <p style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                    Doc ID: CLAQ-MZ-{data.id.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Client & Simulation Info */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '12.5px',
                  marginBottom: '24px'
                }}
              >
                <div>
                  <p style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>{t('pdf:clientSectionTitle')}</p>
                  <p style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{data.clientName}</p>
                  <p style={{ color: '#475569' }}>NUIT: {data.nuit || '400998822'}</p>
                  <p style={{ color: '#475569' }}>{t('pdf:origin', { origin: data.providerCountry || t('pdf:unitedStates') })}</p>
                </div>
                <div>
<p style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>{t('pdf:sessionSectionTitle')}</p>
                  <p style={{ fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{t('pdf:sessionDate', { date: formatDate(data.date) })}</p>
                  <p style={{ color: '#475569' }}>{t('pdf:responsible', { name: data.responsibleName || user?.name || t('pdf:taxAdministrator') })}</p>
                  <p style={{ color: '#475569' }}>{t('pdf:exchangeRate', { rate: data.exchangeRate.toFixed(2) })}</p>
                </div>
              </div>

              {/* Calculation Summary Table */}
              <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                {t('pdf:summaryTitle')}
              </h5>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginBottom: '20px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>{t('pdf:rowInvoiceValue')}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {data.originalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {data.currency}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>{t('pdf:rowMznValue')}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {formatMZN(data.mznAmount)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>{t('pdf:rowCounterValue')}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {formatMZN(data.taxBase)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>{t('pdf:rowIVAPay')}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#2563EB' }}>
                      {formatMZN(data.ivaAmount)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>{t('pdf:rowIRPCWithheld')}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#2563EB' }}>
                      {formatMZN(data.irpcAmount)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#EFF6FF', borderTop: '2px solid #2563EB' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 800, color: '#1E40AF' }}>
                      {t('pdf:totalTaxes')}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, color: '#1E40AF', fontSize: '14px' }}>
                      {formatMZN(data.totalTax)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Legal Notes */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '6px', fontSize: '11px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
                <p><b>{t('pdf:legalBasisTitle')}</b> {t('pdf:legalBasisBody')}</p>
                <p style={{ marginTop: '4px' }}>{t('pdf:legalBasisGenerated')}</p>
              </div>
            </div>

            {/* Footer & Digital Stamp */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#64748B' }}>
              <div>
                <p style={{ fontWeight: 700, color: '#0F172A' }}>CLAQ Consultores, Lda.</p>
                <p>{t('pdf:digitalSignature')}</p>
                <p style={{ fontSize: '9.5px', color: '#94A3B8' }}>www.claq.co.mz</p>
              </div>

              <div
                style={{
                  border: '1.5px dashed #CBD5E1',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  backgroundColor: '#FAFAFA'
                }}
              >
                <ShieldCheck size={18} color="#10B981" style={{ margin: '0 auto 2px auto' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#065F46' }}>
                  {t('pdf:stampLabel')}
                </span>
                <p style={{ fontSize: '9px', color: '#94A3B8' }}>{t('pdf:stampCompliant')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

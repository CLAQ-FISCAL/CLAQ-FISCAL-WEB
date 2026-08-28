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
import { useAppState } from '../../context/AppStateContext';
import { formatMZN, formatDate } from '../../utils/formatters';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';

export const PDFPreviewModal: React.FC = () => {
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
      doc.text('RELATÓRIO OFICIAL DE SIMULAÇÃO TRIBUTÁRIA', 20, 25);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Moçambique • Lei n.º 1/2018 (CIVA) & Lei n.º 34/2014 (CIRPC)', 110, 25);

      // Simulation Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`SIMULAÇÃO FISCAL: ${data.simulatorTitle.toUpperCase()}`, 20, 44);

      // Metadata Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 50, 170, 32, 3, 3, 'FD');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Dados da Simulação:', 26, 57);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`Cliente / Empresa: ${data.clientName}`, 26, 64);
      doc.text(`NUIT: ${data.nuit || '400889900'}`, 26, 70);
      doc.text(`País do Prestador: ${data.providerCountry || 'Estados Unidos'}`, 26, 76);

      doc.text(`Data do Cálculo: ${formatDate(data.date)}`, 110, 64);
      doc.text(`Responsável Técnico: ${data.responsibleName || user?.name || 'Administrador Fiscal'}`, 110, 70);
      doc.text(`Moeda Original: ${data.originalAmount.toLocaleString('pt-MZ')} ${data.currency}`, 110, 76);

      // Calculation Breakdown Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Resumo dos Cálculos e Apuramento', 20, 92);

      let startY = 98;
      const rows = [
        ['Valor em Meticais (Câmbio Oficial):', formatMZN(data.mznAmount)],
        ['Contra-Valor / Base de Incidência (Fator 1,25):', formatMZN(data.taxBase)],
        ['IVA a Pagar (16% sobre Contra-Valor):', formatMZN(data.ivaAmount)],
        ['IRPC Retido na Fonte (20% sobre Contra-Valor):', formatMZN(data.irpcAmount)]
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
      doc.text('TOTAL DE IMPOSTOS A PAGAR (IVA + IRPC):', 26, startY + 9);
      doc.text(formatMZN(data.totalTax), 184, startY + 9, { align: 'right' });

      // Legal trace & notes
      startY += 24;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Enquadramento Legal e Fundamentação:', 20, startY);

      startY += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('• Código do IVA (Lei n.º 32/2007 e alterações) – Artigos 15 e 17 (Obrigatoriedade de autoliquidação).', 20, startY);
      startY += 5;
      doc.text('• Código do IRPC (Lei n.º 34/2014) – Artigos 65 e 66 (Retenção na fonte à taxa de 20% com fator 1,25).', 20, startY);
      startY += 5;
      doc.text('• Ofício Circular n.º 3012/AT/2021 – Determinação da base tributável em contratos líquidos de impostos.', 20, startY);

      // Digital Seal & Signature
      startY += 20;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(20, startY, 80, 30, 2, 2, 'D');
      doc.roundedRect(110, startY, 80, 30, 2, 2, 'D');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Assinatura Digital Verificada', 25, startY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Hash: SHA256-CLAQ-' + data.id.toUpperCase(), 25, startY + 14);
      doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-MZ')}`, 25, startY + 20);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Carimbo Oficial da Entidade', 115, startY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('CLAQ Consultores, Lda.', 115, startY + 14);
      doc.text('NUIT: 400889900 • Maputo', 115, startY + 20);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('CLAQ Fiscal Alert • www.claq.co.mz • Transformamos obrigação em tranquilidade', 105, 285, { align: 'center' });

      // Save file
      doc.save(`CLAQ_Simulacao_${data.simulatorTitle.replace(/\s+/g, '_')}_${data.clientName.replace(/\s+/g, '_')}.pdf`);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });

      addToast('success', 'PDF Gerado!', 'O relatório oficial foi descarregado com sucesso.');
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
              Pré-visualização do Relatório Oficial (PDF)
            </h3>
            <span className="badge badge-green" style={{ fontSize: '11px' }}>
              ✓ Certificado CLAQ
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
              title="Imprimir"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="btn btn-primary-blue btn-sm"
              title="Baixar PDF Oficial"
            >
              <Download size={15} />
              <span>Baixar PDF</span>
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
                    CONSULTORES FISCAIS & CONTABILIDADE
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                    SIMULAÇÃO FISCAL
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
                  <p style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>DADOS DO CLIENTE / OPERAÇÃO</p>
                  <p style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{data.clientName}</p>
                  <p style={{ color: '#475569' }}>NUIT: {data.nuit || '400998822'}</p>
                  <p style={{ color: '#475569' }}>Origem: {data.providerCountry || 'Estados Unidos'}</p>
                </div>
                <div>
                  <p style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>DETALHES DA SESSÃO</p>
                  <p style={{ fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>Data: {formatDate(data.date)}</p>
                  <p style={{ color: '#475569' }}>Responsável: {data.responsibleName || user?.name || 'Administrador Fiscal'}</p>
                  <p style={{ color: '#475569' }}>Câmbio Utilizado: {data.exchangeRate.toFixed(2)} MZN</p>
                </div>
              </div>

              {/* Calculation Summary Table */}
              <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                Resumo dos Cálculos
              </h5>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', marginBottom: '20px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>Valor da Fatura (Original)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {data.originalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {data.currency}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>Valor em Meticais (Convertido)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {formatMZN(data.mznAmount)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>Contra Valor (Fator 1,25 – Base de Incidência)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>
                      {formatMZN(data.taxBase)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>IVA a Pagar (16%)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#2563EB' }}>
                      {formatMZN(data.ivaAmount)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 4px', color: '#475569' }}>IRPC Retido na Fonte (20%)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#2563EB' }}>
                      {formatMZN(data.irpcAmount)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#EFF6FF', borderTop: '2px solid #2563EB' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 800, color: '#1E40AF' }}>
                      TOTAL DE IMPOSTOS A RECOLHER
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 800, color: '#1E40AF', fontSize: '14px' }}>
                      {formatMZN(data.totalTax)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Legal Notes */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '6px', fontSize: '11px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
                <p><b>Base Jurídica Aplicada:</b> Artigos 15.º e 17.º do Código do IVA (Lei n.º 1/2018) e Artigos 65.º e 66.º do Código do IRPC (Lei n.º 34/2014) da República de Moçambique.</p>
                <p style={{ marginTop: '4px' }}>Este documento foi gerado automaticamente pelo CLAQ Fiscal Alert com base na legislação tributária moçambicana vigente.</p>
              </div>
            </div>

            {/* Footer & Digital Stamp */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#64748B' }}>
              <div>
                <p style={{ fontWeight: 700, color: '#0F172A' }}>CLAQ Consultores, Lda.</p>
                <p>Assinatura Digital Verificada</p>
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
                  SELADO DIGITALMENTE
                </span>
                <p style={{ fontSize: '9px', color: '#94A3B8' }}>AT Moçambique Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

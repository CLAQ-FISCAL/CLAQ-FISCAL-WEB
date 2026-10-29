import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Eye,
  FileText,
  Copy,
  ExternalLink,
  X,
  Filter,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { OFFICIAL_TAX_LEGISLATION } from '../data/officialTaxLegislation';
import { LegalDoc } from '../types';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';

export const BibliotecaLegal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { addToast } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);

  const docs = OFFICIAL_TAX_LEGISLATION(i18n.resolvedLanguage || i18n.language);
  const selectedDocHasPdf = Boolean(selectedDoc?.pdfUrl && decodeURIComponent(selectedDoc.pdfUrl).toLowerCase().includes('.pdf'));

  const categoryCounts = {
    todos: docs.length,
    lei: docs.filter(d => d.type === 'lei').length,
    decreto: docs.filter(d => d.type === 'decreto').length,
    regulamento: docs.filter(d => d.type === 'regulamento').length,
    diploma: docs.filter(d => d.type === 'diploma').length,
    outro: docs.filter(d => d.type === 'outro').length
  };

  const typeLabels: Record<LegalDoc['type'], string> = {
    lei: t('biblioteca:typeLei'),
    decreto: t('biblioteca:typeDecreto'),
    regulamento: t('biblioteca:typeRegulamento'),
    diploma: t('biblioteca:typeDiploma'),
    outro: t('biblioteca:typeOutro')
  };

  const filteredDocs = docs.filter(doc => {
    if (selectedType !== 'todos' && doc.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.number.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyCitation = (doc: LegalDoc) => {
    const gazette = doc.officialGazette || 'I Série';
    const citation = t('biblioteca:citationTemplate', { title: doc.title, number: doc.number, gazette });
    navigator.clipboard.writeText(citation);
    addToast('success', t('biblioteca:toastCitationTitle'), t('biblioteca:toastCitationMessage'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
          {t('biblioteca:title')}
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
          {t('biblioteca:subtitle')}
        </p>
      </div>

      {/* Search Bar & Dropdowns */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', flex: '1 1 340px' }}>
          <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '38px', fontSize: '13.5px' }}
            placeholder={t('biblioteca:searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="form-control" style={{ width: '160px', padding: '8px 12px', fontSize: '13px' }}>
            <option>{t('biblioteca:typeAll')}</option>
            <option>{t('biblioteca:categoryLei')}</option>
            <option>{t('biblioteca:categoryDecreto')}</option>
            <option>{t('biblioteca:categoryRegulamento')}</option>
          </select>

          <select className="form-control" style={{ width: '150px', padding: '8px 12px', fontSize: '13px' }}>
            <option>{t('biblioteca:sortRecent')}</option>
            <option>{t('biblioteca:sortViewed')}</option>
            <option>{t('biblioteca:sortAlpha')}</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'todos', label: t('biblioteca:categoryAll'), count: categoryCounts.todos },
          { id: 'lei', label: t('biblioteca:categoryLei'), count: categoryCounts.lei },
          { id: 'decreto', label: t('biblioteca:categoryDecreto'), count: categoryCounts.decreto },
          { id: 'regulamento', label: t('biblioteca:categoryRegulamento'), count: categoryCounts.regulamento },
          { id: 'diploma', label: t('biblioteca:categoryDiploma'), count: categoryCounts.diploma },
          { id: 'outro', label: t('biblioteca:categoryOutro'), count: categoryCounts.outro }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedType(cat.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: `1.5px solid ${selectedType === cat.id ? 'var(--blue-600)' : 'var(--slate-200)'}`,
              backgroundColor: selectedType === cat.id ? 'var(--blue-50)' : '#FFFFFF',
              color: selectedType === cat.id ? 'var(--blue-600)' : 'var(--slate-700)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{cat.label}</span>
            <span style={{ fontSize: '11px', opacity: 0.75 }}>({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Document List Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="card card-hover"
            style={{
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: doc.type === 'lei' ? 'var(--red-50)' : doc.type === 'decreto' ? 'var(--blue-50)' : 'var(--emerald-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <FileText size={20} color={doc.type === 'lei' ? 'var(--red-600)' : doc.type === 'decreto' ? 'var(--blue-600)' : 'var(--emerald-600)'} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {doc.title}
                  </h4>
                  <span
                    className={`badge ${
                      doc.type === 'lei' ? 'badge-red' : doc.type === 'decreto' ? 'badge-blue' : 'badge-green'
                    }`}
                    style={{ fontSize: '10.5px' }}
                  >
                    {typeLabels[doc.type]}
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
                  {doc.number} • {doc.summary}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--slate-400)', whiteSpace: 'nowrap' }}>
                {doc.date}
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleCopyCitation(doc);
                  }}
                  className="btn btn-ghost btn-sm"
                  title={t('biblioteca:copyCitationTitle')}
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedDoc(doc);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <Eye size={15} />
                  <span>{t('biblioteca:viewDiploma')}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Official Document Reader Drawer / Modal */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-card" style={{ maxWidth: '720px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} color="var(--blue-600)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                    {selectedDoc.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                    {selectedDoc.number} • {selectedDoc.officialGazette || t('biblioteca:gazetteFallback')}
                  </span>
                </div>
              </div>

              <button onClick={() => setSelectedDoc(null)} className="btn btn-ghost" style={{ padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                  {t('biblioteca:summaryTitle')}
                </h4>
                <p style={{ fontSize: '13.5px', color: 'var(--slate-800)', marginTop: '4px', lineHeight: 1.6 }}>
                  {selectedDoc.summary}
                </p>
              </div>

              {selectedDoc.keyArticles && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    {t('biblioteca:articlesTitle')}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDoc.keyArticles.map((art, idx) => (
                      <div key={idx} style={{ padding: '14px 16px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: '3px solid var(--blue-600)' }}>
                        <h5 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--slate-900)' }}>
                          {art.number} – {art.title}
                        </h5>
                        <p style={{ fontSize: '12.5px', color: 'var(--slate-700)', marginTop: '6px', lineHeight: 1.5 }}>
                          {art.fullText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--slate-50)' }}>
              <button
                onClick={() => handleCopyCitation(selectedDoc)}
                className="btn btn-secondary btn-sm"
              >
                <Copy size={15} />
                <span>{t('biblioteca:copyOfficialCitation')}</span>
              </button>

              <button
                onClick={() => {
                  if (!selectedDoc.pdfUrl) return;
                  window.open(selectedDoc.pdfUrl, '_blank', 'noopener,noreferrer');
                }}
                className="btn btn-primary-blue btn-sm"
                disabled={!selectedDoc.pdfUrl}
              >
                <ExternalLink size={15} />
                <span>{t(selectedDocHasPdf ? 'biblioteca:downloadOfficialPdf' : 'biblioteca:openOfficialSource')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

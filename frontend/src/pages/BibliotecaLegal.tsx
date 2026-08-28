import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Eye,
  FileText,
  Copy,
  ExternalLink,
  X,
  Filter,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { STATUTORY_LEGISLATION } from '../data/statutoryLegislation';
import { LegalDoc } from '../types';
import { useAppState } from '../context/AppStateContext';

export const BibliotecaLegal: React.FC = () => {
  const { addToast } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);

  const categoryCounts = {
    todos: STATUTORY_LEGISLATION.length,
    lei: STATUTORY_LEGISLATION.filter(d => d.type === 'lei').length,
    decreto: STATUTORY_LEGISLATION.filter(d => d.type === 'decreto').length,
    regulamento: STATUTORY_LEGISLATION.filter(d => d.type === 'regulamento').length,
    diploma: STATUTORY_LEGISLATION.filter(d => d.type === 'diploma').length,
    outro: STATUTORY_LEGISLATION.filter(d => d.type === 'outro').length
  };

  const filteredDocs = STATUTORY_LEGISLATION.filter(doc => {
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
    const citation = `${doc.title}, ${doc.number}, publicado no Boletim da República de Moçambique (${doc.officialGazette || 'I Série'}).`;
    navigator.clipboard.writeText(citation);
    addToast('success', 'Citação Copiada', 'Referência jurídica copiada para a área de transferência.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
          Biblioteca Legal
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
          Consulte leis, decretos, regulamentos e documentos oficiais tributários de Moçambique.
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
            placeholder="Pesquisar por palavra-chave, assunto ou número do diploma..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="form-control" style={{ width: '160px', padding: '8px 12px', fontSize: '13px' }}>
            <option>Todos os tipos</option>
            <option>Leis</option>
            <option>Decretos</option>
            <option>Regulamentos</option>
          </select>

          <select className="form-control" style={{ width: '150px', padding: '8px 12px', fontSize: '13px' }}>
            <option>Mais recentes</option>
            <option>Mais consultados</option>
            <option>Ordem alfabética</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'todos', label: 'Todos', count: categoryCounts.todos },
          { id: 'lei', label: 'Leis', count: categoryCounts.lei },
          { id: 'decreto', label: 'Decretos', count: categoryCounts.decreto },
          { id: 'regulamento', label: 'Regulamentos', count: categoryCounts.regulamento },
          { id: 'diploma', label: 'Diplomas Ministeriais', count: categoryCounts.diploma },
          { id: 'outro', label: 'Outros', count: categoryCounts.outro }
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
                    {doc.type.toUpperCase()}
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
                  title="Copiar Citação"
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
                  <span>Ver Diploma</span>
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
                    {selectedDoc.number} • {selectedDoc.officialGazette || 'Boletim da República de Moçambique'}
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
                  Sumário & Objecto do Diploma
                </h4>
                <p style={{ fontSize: '13.5px', color: 'var(--slate-800)', marginTop: '4px', lineHeight: 1.6 }}>
                  {selectedDoc.summary}
                </p>
              </div>

              {selectedDoc.keyArticles && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Artigos Chave para Consulta Rápida
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
                <span>Copiar Citação Oficial</span>
              </button>

              <button
                onClick={() => {
                  addToast('success', 'Download Iniciado', `Descarregando texto integral do ${selectedDoc.number}.`);
                }}
                className="btn btn-primary-blue btn-sm"
              >
                <Download size={15} />
                <span>Baixar Diploma (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

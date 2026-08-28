import React, { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { simulatorCatalog } from '../../components/simulators/simulatorCatalog';

interface SimuladoresHubProps {
  onNavigate: (path: string) => void;
}

export const SimuladoresHub: React.FC<SimuladoresHubProps> = ({ onNavigate }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([
    'non-resident',
    'iva-ops',
    'salario',
  ]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const fiscalSimulators = simulatorCatalog.filter((s) => s.category === 'Fiscal');
  const laborSimulators = simulatorCatalog.filter(
    (s) => s.category === 'Laboral (RH)'
  );

  const applyFilters = (sims: typeof simulatorCatalog) => {
    return sims
      .filter((s) => !favoritesOnly || favorites.includes(s.id))
      .filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const renderCard = (sim: (typeof simulatorCatalog)[0]) => {
    const Icon = sim.icon;
    const isFav = favorites.includes(sim.id);
    return (
      <div
        key={sim.id}
        onClick={() => onNavigate(`/simuladores/${sim.slug}`)}
        className="card card-hover"
        style={{ padding: '20px', cursor: 'pointer', position: 'relative' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: sim.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} color={sim.color} />
          </div>
          <button
            onClick={(e) => toggleFavorite(sim.id, e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <Star
              size={18}
              fill={isFav ? '#F59E0B' : 'none'}
              color={isFav ? '#F59E0B' : 'var(--slate-300)'}
            />
          </button>
        </div>
        <h4
          style={{
            fontSize: '14.5px',
            fontWeight: 700,
            color: 'var(--slate-900)',
          }}
        >
          {sim.title}
        </h4>
        <p
          style={{
            fontSize: '12.5px',
            color: 'var(--slate-500)',
            marginTop: '4px',
            lineHeight: 1.4,
          }}
        >
          {sim.desc}
        </p>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--slate-900)',
            }}
          >
            Centro de Simuladores
          </h1>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--slate-500)',
              marginTop: '2px',
            }}
          >
            Escolha um simulador e obtenha cálculos automáticos com base na
            legislação moçambicana.
          </p>
        </div>

        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className="btn btn-secondary"
          style={{
            color: favoritesOnly ? 'var(--gold-600)' : 'var(--slate-700)',
            borderColor: favoritesOnly ? 'var(--gold-500)' : 'var(--slate-200)',
          }}
        >
          <Star
            size={16}
            fill={favoritesOnly ? '#F59E0B' : 'none'}
            color="#F59E0B"
          />
          <span>Meus Favoritos ({favorites.length})</span>
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Todos', 'Fiscal', 'Laboral (RH)', 'Contabilidade', 'Legal', 'Financeiro'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor:
                    categoryFilter === cat ? 'var(--blue-600)' : 'transparent',
                  color:
                    categoryFilter === cat ? '#FFFFFF' : 'var(--slate-600)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            )
          )}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            color="var(--slate-400)"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '36px', fontSize: '13px' }}
            placeholder="Pesquisar simulador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Simuladores Fiscais */}
        {(categoryFilter === 'Todos' || categoryFilter === 'Fiscal') && (
          <div>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--slate-800)',
                marginBottom: '14px',
                letterSpacing: '0.02em',
              }}
            >
              Simuladores Fiscais
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {applyFilters(fiscalSimulators).map(renderCard)}
            </div>
          </div>
        )}

        {/* Simuladores Laborais */}
        {(categoryFilter === 'Todos' || categoryFilter === 'Laboral (RH)') && (
          <div>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--slate-800)',
                marginBottom: '14px',
                letterSpacing: '0.02em',
              }}
            >
              Simuladores Laborais (RH)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {applyFilters(laborSimulators).map(renderCard)}
            </div>
          </div>
        )}

        {/* Empty state para categorias sem simuladores */}
        {['Contabilidade', 'Legal', 'Financeiro'].includes(categoryFilter) && (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>
              Nenhum simulador disponível nesta categoria
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
              Os simuladores da categoria «{categoryFilter}» serão adicionados em breve.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

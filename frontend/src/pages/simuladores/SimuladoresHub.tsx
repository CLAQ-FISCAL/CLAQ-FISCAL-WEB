import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Star } from 'lucide-react';
import { simulatorCatalog } from '../../components/simulators/simulatorCatalog';

interface SimuladoresHubProps {
  onNavigate: (path: string) => void;
}

const CATEGORY_TABS: { code: string; key: string }[] = [
  { code: 'Todos', key: 'categoryTodos' },
  { code: 'Fiscal', key: 'categoryFiscal' },
  { code: 'Laboral (RH)', key: 'categoryLaboral' },
  { code: 'Contabilidade', key: 'categoryContabilidade' },
  { code: 'Legal', key: 'categoryLegal' },
  { code: 'Financeiro', key: 'categoryFinanceiro' },
];

export const SimuladoresHub: React.FC<SimuladoresHubProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const catalog = simulatorCatalog(t);
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

  const fiscalSimulators = catalog.filter((s) => s.category === 'Fiscal');
  const laborSimulators = catalog.filter(
    (s) => s.category === 'Laboral (RH)'
  );

  const applyFilters = (sims: typeof catalog) => {
    return sims
      .filter((s) => !favoritesOnly || favorites.includes(s.id))
      .filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const renderCard = (sim: (typeof catalog)[0]) => {
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
            {t('simuladores:catalogCenterTitle')}
          </h1>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--slate-500)',
              marginTop: '2px',
            }}
          >
            {t('simuladores:catalogIntro')}
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
          <span>{t('simuladores:myFavorites', { count: favorites.length })}</span>
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
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.code}
              onClick={() => setCategoryFilter(cat.code)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor:
                  categoryFilter === cat.code ? 'var(--blue-600)' : 'transparent',
                color:
                  categoryFilter === cat.code ? '#FFFFFF' : 'var(--slate-600)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t(`simuladores:${cat.key}`)}
            </button>
          ))}
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
            placeholder={t('simuladores:searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Catalog Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Fiscal simulators */}
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
              {t('simuladores:catalogFiscalGroup')}
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

        {/* Employment simulators */}
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
              {t('simuladores:catalogLaboralGroup')}
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
              {t('simuladores:hubEmptyTitle')}
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
              {t('simuladores:hubEmptyMsg', { category: categoryFilter })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
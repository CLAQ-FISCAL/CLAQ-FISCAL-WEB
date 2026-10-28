import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  History,
  Loader2,
  Play,
  RefreshCw,
  UploadCloud
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';
import { useCompanies, useUploadBatch, useUploads, useStageUpload, useDecideUploadRows, useApplyUpload } from '../hooks/useUploads';
import { formatDate, formatMZN } from '../utils/formatters';
import type {
  ApplyResult,
  MatchStateName,
  RowDecisionName,
  StagedRowView,
  UploadBatchSummary
} from '../types';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const MATCH_STATE_ORDER: MatchStateName[] = [
  'MATCHED',
  'AMOUNT_MISMATCH',
  'UNMATCHED',
  'NOT_APPLICABLE',
  'DUPLICATE',
  'INVALID'
];

const ALLOWED_DECISIONS: Record<MatchStateName, RowDecisionName[]> = {
  MATCHED: [],
  AMOUNT_MISMATCH: ['TRUST_RULE', 'TRUST_UPLOAD', 'EXCLUDE', 'REJECT'],
  UNMATCHED: ['CREATE_TEMPLATE', 'EXCLUDE', 'REJECT'],
  NOT_APPLICABLE: [],
  DUPLICATE: [],
  INVALID: []
};

const MATCH_STATE_BADGE: Record<MatchStateName, string> = {
  MATCHED: 'badge-green',
  AMOUNT_MISMATCH: 'badge-amber',
  UNMATCHED: 'badge-blue',
  NOT_APPLICABLE: 'badge-slate',
  DUPLICATE: 'badge-purple',
  INVALID: 'badge-red'
};

const BATCH_STATUS_BADGE: Record<string, string> = {
  RECONCILED: 'badge-amber',
  DECIDED: 'badge-blue',
  APPLIED: 'badge-green'
};

const errMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

const fmtAmount = (value: string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '—' : formatMZN(Number(value));

export const DataUpload: React.FC = () => {
  const { t } = useTranslation();
  const { addToast, isAuthenticated, activeTenantId } = useAppState();

  const companiesQuery = useCompanies(isAuthenticated && !!activeTenantId, activeTenantId);
  const uploadsQuery = useUploads();

  const [companyId, setCompanyId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const batchQuery = useUploadBatch(selectedBatchId);
  const batch = batchQuery.data ?? null;

  const stageMutation = useStageUpload();
  const decideMutation = useDecideUploadRows(selectedBatchId);
  const applyMutation = useApplyUpload(selectedBatchId);

  const companies = companiesQuery.data ?? [];
  const uploads = uploadsQuery.data ?? [];

  const pendingCount = batch?.exceptionCount ?? 0;
  const isApplied = batch?.status === 'APPLIED';

  const bulkStates = useMemo(() => {
    if (!batch) return [] as { state: MatchStateName; count: number; decisions: RowDecisionName[] }[];
    return MATCH_STATE_ORDER.filter(
      (state) => ALLOWED_DECISIONS[state].length > 0 && (batch.counts[state] ?? 0) > 0
    ).map((state) => ({ state, count: batch.counts[state] ?? 0, decisions: ALLOWED_DECISIONS[state] }));
  }, [batch]);

  const clearSelection = () => {
    setSelectedBatchId(null);
    setApplyResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setErrorMsg(null);
    if (picked && picked.size > MAX_UPLOAD_BYTES) setErrorMsg(t('uploads:fileTooLarge'));
  };

  const handleAnalyze = async () => {
    setApplyResult(null);
    if (!companyId) {
      setErrorMsg(t('uploads:companyPlaceholder'));
      return;
    }
    if (!file) {
      setErrorMsg(t('uploads:noFileSelected'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMsg(t('uploads:fileTooLarge'));
      return;
    }
    try {
      const content = await file.text();
      const view = await stageMutation.mutateAsync({ companyId, fileName: file.name, content });
      setSelectedBatchId(view.id);
      if (view.duplicate) {
        addToast('info', t('uploads:toastStagedTitle'), t('uploads:duplicateWarning'));
      } else {
        addToast('success', t('uploads:toastStagedTitle'), t('uploads:toastStagedMsg', { count: view.rowCount, exceptions: view.exceptionCount }));
      }
    } catch (e) {
      addToast('error', t('uploads:toastErrorTitle'), errMessage(e, t('uploads:toastErrorMsg')));
    }
  };

  const handleDecide = async (decision: RowDecisionName, scope: { rowNumbers?: number[]; matchStates?: MatchStateName[] }) => {
    if (!selectedBatchId) return;
    try {
      const res = await decideMutation.mutateAsync({ decision, ...scope });
      addToast('success', t('uploads:toastDecidedTitle'), t('uploads:toastDecidedMsg', { updated: res.updated }));
    } catch (e) {
      addToast('error', t('uploads:toastErrorTitle'), errMessage(e, t('uploads:toastErrorMsg')));
    }
  };

  const handleApply = async () => {
    if (!selectedBatchId) return;
    try {
      const res = await applyMutation.mutateAsync();
      setApplyResult(res);
      addToast('success', t('uploads:toastAppliedTitle'), t('uploads:toastAppliedMsg', { updated: res.obligationsUpdated, created: res.obligationsCreated }));
    } catch (e) {
      addToast('error', t('uploads:toastErrorTitle'), errMessage(e, t('uploads:toastErrorMsg')));
    }
  };

  const renderStatusBadge = (status: string) => (
    <span className={`badge ${BATCH_STATUS_BADGE[status] ?? 'badge-slate'}`}>{t(`uploads:status${status}`, status)}</span>
  );

  const renderDecisionButtons = (row: StagedRowView) => {
    const allowed = ALLOWED_DECISIONS[row.matchState];
    if (allowed.length === 0) return <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>—</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {allowed.map((decision) => (
          <button
            key={decision}
            onClick={() => handleDecide(decision, { rowNumbers: [row.rowNumber] })}
            disabled={decideMutation.isPending}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11.5px', padding: '4px 8px', border: '1px solid var(--slate-200)' }}
          >
            {t(`uploads:decision${decision}`)}
          </button>
        ))}
      </div>
    );
  };

  const renderSummaryChips = () => {
    if (!batch) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {MATCH_STATE_ORDER.filter((state) => (batch.counts[state] ?? 0) > 0).map((state) => (
          <span key={state} className={`badge ${MATCH_STATE_BADGE[state]}`}>
            {t(`uploads:matchState${state}`)}: {batch.counts[state]}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('uploads:pageTitle')}</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>{t('uploads:pageSubtitle')}</p>
        </div>
        {selectedBatchId && (
          <button onClick={clearSelection} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <RefreshCw size={15} />
            <span>{t('uploads:newUploadCta')}</span>
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UploadCloud size={18} color="var(--blue-600)" />
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--slate-800)' }}>{t('uploads:uploadCardTitle')}</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>{t('uploads:uploadCardDesc')}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr) auto', gap: '14px', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">{t('uploads:companyLabel')}</label>
            <select className="form-control" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">{t('uploads:companyPlaceholder')}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('uploads:fileLabel')}</label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="form-control"
              style={{ padding: '7px 12px', fontSize: '13px' }}
              onChange={handleFileChange}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={stageMutation.isPending}
            className="btn btn-primary-blue"
            style={{ fontSize: '13px', height: '40px' }}
          >
            {stageMutation.isPending ? <Loader2 size={16} className="claq-spin" /> : <Play size={16} />}
            <span>{stageMutation.isPending ? t('uploads:analyzing') : t('uploads:analyzeCta')}</span>
          </button>
        </div>

        {file && file.size > MAX_UPLOAD_BYTES && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red-500)', fontSize: '12.5px' }}>
            <AlertTriangle size={15} />
            <span>{t('uploads:fileTooLarge')}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-600)', fontSize: '12.5px' }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {companiesQuery.isSuccess && companies.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', backgroundColor: 'var(--slate-50)', borderRadius: '10px' }}>
            <Building2 size={16} color="var(--slate-400)" />
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-700)' }}>{t('uploads:noCompanies')}</span>
              <span style={{ fontSize: '12.5px', color: 'var(--slate-500)', display: 'block' }}>{t('uploads:noCompaniesHint')}</span>
            </div>
          </div>
        )}
      </div>

      {batch && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={18} color="var(--slate-600)" />
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--slate-800)' }}>{batch.fileName}</h3>
                <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>{formatDate(batch.createdAt.slice(0, 10))}</span>
              </div>
            </div>
            {renderStatusBadge(batch.status)}
          </div>

          {batch.duplicate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-600)', fontSize: '12.5px' }}>
              <AlertCircle size={15} />
              <span>{t('uploads:summaryDuplicate')}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--slate-50)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', fontWeight: 600 }}>{t('uploads:summaryRows')}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>{batch.rowCount}</div>
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--slate-50)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', fontWeight: 600 }}>{t('uploads:summaryValid')}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--emerald-600)' }}>{batch.validCount}</div>
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--slate-50)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--slate-500)', fontWeight: 600 }}>{t('uploads:summaryExceptions')}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: pendingCount > 0 ? 'var(--gold-600)' : 'var(--slate-900)' }}>{batch.exceptionCount}</div>
            </div>
          </div>

          {renderSummaryChips()}
        </div>
      )}

      {batch && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--slate-800)' }}>{t('uploads:reviewTitle')}</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>{t('uploads:reviewDesc')}</p>
            </div>
            {pendingCount > 0 && (
              <span className="badge badge-amber">{t('uploads:pendingCount', { count: pendingCount })}</span>
            )}
          </div>

          {batch.exceptions.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: 'var(--emerald-50)', borderRadius: '10px' }}>
              <CheckCircle2 size={18} color="var(--emerald-600)" />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  {isApplied ? t('uploads:statusAPPLIED') : t('uploads:noExceptions')}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--slate-500)', display: 'block' }}>
                  {isApplied ? t('uploads:applyAlreadyApplied') : t('uploads:noExceptionsDesc')}
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('uploads:colTitle')}</th>
                      <th>{t('uploads:colDueDate')}</th>
                      <th>{t('uploads:colAmount')}</th>
                      <th>{t('uploads:colExpected')}</th>
                      <th>{t('uploads:colMatchState')}</th>
                      <th>{t('uploads:colDecision')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.exceptions.map((row) => (
                      <tr key={row.id}>
                        <td style={{ color: 'var(--slate-400)', fontWeight: 600 }}>{row.rowNumber}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{row.title || '—'}</span>
                          {row.claimedStatus && (
                            <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--slate-400)' }}>
                              {t('uploads:colClaimedStatus')}: {row.claimedStatus}
                            </span>
                          )}
                          {row.errors.length > 0 && (
                            <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--red-500)' }}>
                              {row.errors.map((err) => err.message).join('; ')}
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--slate-700)' }}>{row.dueAt ? formatDate(row.dueAt.slice(0, 10)) : '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{fmtAmount(row.amount)}</td>
                        <td style={{ color: 'var(--slate-600)' }}>{fmtAmount(row.expectedAmount)}</td>
                        <td>
                          <span className={`badge ${MATCH_STATE_BADGE[row.matchState]}`}>
                            {t(`uploads:matchState${row.matchState}`)}
                          </span>
                        </td>
                        <td>{renderDecisionButtons(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bulkStates.length > 0 && (
                <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--slate-700)' }}>{t('uploads:bulkTitle')}</span>
                    <span style={{ fontSize: '12px', color: 'var(--slate-500)', display: 'block' }}>{t('uploads:bulkHint')}</span>
                  </div>
                  {bulkStates.map(({ state, count, decisions }) => (
                    <div key={state} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span className={`badge ${MATCH_STATE_BADGE[state]}`} style={{ minWidth: '150px', justifyContent: 'center' }}>
                        {t(`uploads:matchState${state}`)}: {count}
                      </span>
                      {decisions.map((decision) => (
                        <button
                          key={decision}
                          onClick={() => handleDecide(decision, { matchStates: [state] })}
                          disabled={decideMutation.isPending}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11.5px' }}
                        >
                          {t(`uploads:decision${decision}`)}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--slate-100)', paddingTop: '14px' }}>
            {!isApplied && pendingCount > 0 && (
              <span style={{ fontSize: '12.5px', color: 'var(--slate-500)' }}>{t('uploads:applyBlocked')}</span>
            )}
            <button
              onClick={handleApply}
              disabled={applyMutation.isPending || isApplied || pendingCount > 0}
              className="btn btn-primary-gold"
              style={{ fontSize: '13px', opacity: isApplied || pendingCount > 0 ? 0.55 : 1 }}
            >
              {applyMutation.isPending ? <Loader2 size={16} className="claq-spin" /> : <CheckCircle2 size={16} />}
              <span>{applyMutation.isPending ? t('uploads:applying') : t('uploads:applyCta')}</span>
            </button>
          </div>

          {applyResult && (
            <div style={{ backgroundColor: 'var(--slate-50)', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--slate-800)', display: 'block', marginBottom: '8px' }}>
                {t('uploads:resultTitle')}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', fontSize: '12.5px', color: 'var(--slate-600)' }}>
                <span>{t('uploads:resultUpdated')}: <strong>{applyResult.obligationsUpdated}</strong></span>
                <span>{t('uploads:resultCreated')}: <strong>{applyResult.obligationsCreated}</strong></span>
                <span>{t('uploads:resultTemplates')}: <strong>{applyResult.templatesCreated}</strong></span>
                <span>{t('uploads:resultSkipped')}: <strong>{applyResult.skipped}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={18} color="var(--slate-600)" />
          <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--slate-800)' }}>{t('uploads:historyTitle')}</h3>
        </div>

        {uploads.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <FileSpreadsheet size={34} color="var(--slate-300)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-700)' }}>{t('uploads:historyEmpty')}</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '4px' }}>{t('uploads:historyEmptyDesc')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('uploads:colFileName')}</th>
                  <th>{t('uploads:colRows')}</th>
                  <th>{t('uploads:colValid')}</th>
                  <th>{t('uploads:colExceptions')}</th>
                  <th style={{ textAlign: 'right' }}>{t('uploads:colCreated')}</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((item: UploadBatchSummary) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedBatchId(item.id);
                      setApplyResult(null);
                    }}
                    style={{ cursor: 'pointer', backgroundColor: item.id === selectedBatchId ? 'var(--slate-50)' : undefined }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{item.fileName}</td>
                    <td>{item.rowCount}</td>
                    <td style={{ color: 'var(--emerald-600)', fontWeight: 600 }}>{item.validCount}</td>
                    <td style={{ color: item.exceptionCount > 0 ? 'var(--gold-600)' : 'var(--slate-500)', fontWeight: 600 }}>{item.exceptionCount}</td>
                    <td style={{ textAlign: 'right', color: 'var(--slate-500)' }}>{formatDate(item.createdAt.slice(0, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

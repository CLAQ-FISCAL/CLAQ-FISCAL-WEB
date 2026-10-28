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
  Plus,
  RefreshCw,
  UploadCloud
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAppState } from '../context/AppStateContext';
import { useCompanies, useUploadBatch, useUploads, useStageUpload, useDecideUploadRows, useApplyUpload } from '../hooks/useUploads';
import { QUERY_KEYS } from '../hooks/useFiscalQueries';
import { ApiClient } from '../api/client';
import { formatDate, formatMZN } from '../utils/formatters';
import type {
  ApplyResult,
  BackendCompany,
  MatchStateName,
  RowDecisionName,
  StagedRowView,
  UploadBatchSummary
} from '../types';
import './DataUpload.css';

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
  const { addToast, isAuthenticated, isAuthReady, activeTenantId } = useAppState();
  const queryClient = useQueryClient();

  const companiesQuery = useCompanies(isAuthenticated && isAuthReady && !!activeTenantId, activeTenantId);
  const uploadsQuery = useUploads();

  const [companyId, setCompanyId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyNuit, setNewCompanyNuit] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const batchQuery = useUploadBatch(selectedBatchId);
  const batch = batchQuery.data ?? null;

  const stageMutation = useStageUpload();
  const decideMutation = useDecideUploadRows(selectedBatchId);
  const applyMutation = useApplyUpload(selectedBatchId);

  const companies = companiesQuery.data ?? [];
  const uploads = uploadsQuery.data ?? [];

  // `exceptionCount` is the historical total; `exceptions` only contains rows still awaiting a decision.
  const pendingCount = batch?.exceptions.length ?? 0;
  const isApplied = batch?.status === 'APPLIED';

  const bulkStates = useMemo(() => {
    if (!batch) return [] as { state: MatchStateName; count: number; decisions: RowDecisionName[] }[];
    const pendingByState = batch.exceptions.reduce<Partial<Record<MatchStateName, number>>>((acc, row) => {
      acc[row.matchState] = (acc[row.matchState] ?? 0) + 1;
      return acc;
    }, {});
    return MATCH_STATE_ORDER.filter(
      (state) => ALLOWED_DECISIONS[state].length > 0 && (pendingByState[state] ?? 0) > 0
    ).map((state) => ({ state, count: pendingByState[state] ?? 0, decisions: ALLOWED_DECISIONS[state] }));
  }, [batch]);

  const steps = [
    { label: t('uploads:stepCompany'), done: Boolean(companyId), active: !companyId },
    { label: t('uploads:stepFile'), done: Boolean(companyId && file), active: Boolean(companyId && !file) },
    { label: t('uploads:stepReview'), done: Boolean(batch), active: Boolean(batch) }
  ];

  const resetUploadForm = () => {
    setSelectedBatchId(null);
    setApplyResult(null);
    setFile(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const clearFile = () => {
    setFile(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setErrorMsg(null);
    if (picked && picked.size > MAX_UPLOAD_BYTES) setErrorMsg(t('uploads:fileTooLarge'));
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      setErrorMsg(t('uploads:companyNameRequired'));
      return;
    }
    if (newCompanyNuit.trim() && !/^\d{9}$/.test(newCompanyNuit.trim())) {
      setErrorMsg(t('uploads:companyNuitInvalid'));
      return;
    }
    setCreatingCompany(true);
    setErrorMsg(null);
    try {
      const created = await ApiClient.post<BackendCompany>('/companies', {
        legalName: newCompanyName.trim(),
        ...(newCompanyNuit.trim() ? { nuit: newCompanyNuit.trim() } : {})
      });
      queryClient.setQueryData<BackendCompany[]>(QUERY_KEYS.COMPANIES, (previous) =>
        [...(previous ?? []), created].sort((a, b) => a.legalName.localeCompare(b.legalName))
      );
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPANIES });
      setCompanyId(created.id);
      setNewCompanyName('');
      setNewCompanyNuit('');
      addToast('success', t('uploads:toastCompanyCreatedTitle'), t('uploads:toastCompanyCreatedMsg', { name: created.legalName }));
    } catch (err) {
      const message = errMessage(err, t('uploads:toastErrorMsg'));
      setErrorMsg(message);
      addToast('error', t('uploads:toastErrorTitle'), message);
    } finally {
      setCreatingCompany(false);
    }
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
      await queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.UPLOADS, selectedBatchId] });
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
      await queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.UPLOADS, selectedBatchId] });
      addToast('success', t('uploads:toastAppliedTitle'), t('uploads:toastAppliedMsg', { updated: res.obligationsUpdated, created: res.obligationsCreated }));
    } catch (e) {
      addToast('error', t('uploads:toastErrorTitle'), errMessage(e, t('uploads:toastErrorMsg')));
    }
  };

  const openBatch = (id: string) => {
    setSelectedBatchId(id);
    setApplyResult(null);
    setErrorMsg(null);
  };

  const renderStatusBadge = (status: string) => (
    <span className={`badge ${BATCH_STATUS_BADGE[status] ?? 'badge-slate'}`}>{t(`uploads:status${status}`, status)}</span>
  );

  const renderDecisionButtons = (row: StagedRowView) => {
    const allowed = ALLOWED_DECISIONS[row.matchState];
    if (allowed.length === 0) return <span className="upload-muted">—</span>;
    return (
      <div className="upload-decision-group">
        {allowed.map((decision) => (
          <button
            key={decision}
            onClick={() => handleDecide(decision, { rowNumbers: [row.rowNumber] })}
            disabled={decideMutation.isPending}
            className="btn btn-ghost btn-sm upload-decision-btn"
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
      <div className="upload-chips">
        {MATCH_STATE_ORDER.filter((state) => (batch.counts[state] ?? 0) > 0).map((state) => (
          <span key={state} className={`badge ${MATCH_STATE_BADGE[state]}`}>
            {t(`uploads:matchState${state}`)}: {batch.counts[state]}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="upload-page">
      <header className="upload-page-header">
        <div>
          <h1 className="upload-page-title">{t('uploads:pageTitle')}</h1>
          <p className="upload-page-subtitle">{t('uploads:pageSubtitle')}</p>
        </div>
        {selectedBatchId && (
          <button onClick={resetUploadForm} className="btn btn-secondary upload-secondary-cta">
            <RefreshCw size={15} />
            <span>{t('uploads:newUploadCta')}</span>
          </button>
        )}
      </header>

      <div className="upload-steps" aria-label={t('uploads:workflowLabel')}>
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`upload-step${step.done ? ' is-complete' : ''}${step.active ? ' is-active' : ''}`}
          >
            <span className="upload-step-number">{index + 1}</span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      <section className="card upload-card">
        <div className="upload-card-head">
          <div className="upload-card-icon">
            <UploadCloud size={20} />
          </div>
          <div>
            <h2 className="upload-card-title">{t('uploads:uploadCardTitle')}</h2>
            <p className="upload-card-desc">{t('uploads:uploadCardDesc')}</p>
          </div>
        </div>

        <div className="upload-form-grid">
          <div className="form-group upload-form-group">
            <label className="form-label upload-label" htmlFor="upload-company">{t('uploads:companyLabel')}</label>
            <select
              id="upload-company"
              className="form-control"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={companiesQuery.isLoading}
            >
              <option value="">
                {companiesQuery.isLoading ? t('uploads:loadingCompanies') : t('uploads:companyPlaceholder')}
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.legalName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group upload-form-group">
            <label className="form-label upload-label" htmlFor="upload-file">{t('uploads:fileLabel')}</label>
            <input
              ref={inputRef}
              id="upload-file"
              type="file"
              accept=".csv,text/csv"
              className="upload-file-input"
              onChange={handleFileChange}
            />
            <label htmlFor="upload-file" className="upload-dropzone">
              <FileSpreadsheet size={17} color="var(--slate-500)" />
              <span className="upload-dropzone-label">
                {file ? file.name : t('uploads:chooseFile')}
              </span>
              <span className="upload-dropzone-hint">{t('uploads:maxFileSize')}</span>
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={stageMutation.isPending || !companyId || !file || (!!file && file.size > MAX_UPLOAD_BYTES)}
            className="btn btn-primary-blue upload-analyze-btn"
          >
            {stageMutation.isPending ? <Loader2 size={16} className="claq-spin" /> : <Play size={16} />}
            <span>{stageMutation.isPending ? t('uploads:analyzing') : t('uploads:analyzeCta')}</span>
          </button>
        </div>

        {companiesQuery.isError && (
          <div className="upload-alert is-error" role="alert">
            <AlertCircle size={15} />
            <span>{t('uploads:companiesLoadError')}</span>
            <button
              type="button"
              onClick={() => companiesQuery.refetch()}
              disabled={companiesQuery.isFetching}
              className="btn btn-secondary btn-sm upload-alert-action"
            >
              {companiesQuery.isFetching ? <Loader2 size={13} className="claq-spin" /> : <RefreshCw size={13} />}
              <span>{t('uploads:retry')}</span>
            </button>
          </div>
        )}

        {file && (
          <div className={`upload-file-pill${file.size > MAX_UPLOAD_BYTES ? ' is-invalid' : ''}`}>
            <FileSpreadsheet size={16} />
            <span className="upload-file-name">{file.name}</span>
            <span className="upload-file-size">{(file.size / 1024).toFixed(1)} KB</span>
            <button type="button" onClick={clearFile} className="btn btn-ghost btn-sm upload-clear-file">
              {t('uploads:clearFile')}
            </button>
          </div>
        )}

        {file && file.size > MAX_UPLOAD_BYTES && (
          <div className="upload-alert is-error">
            <AlertTriangle size={15} />
            <span>{t('uploads:fileTooLarge')}</span>
          </div>
        )}

        {errorMsg && (
          <div className="upload-alert is-warning">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {companiesQuery.isSuccess && companies.length === 0 && (
          <div className="upload-empty">
            <div className="upload-empty-head">
              <div className="upload-empty-icon">
                <Building2 size={18} />
              </div>
              <div>
                <h3>{t('uploads:noCompanies')}</h3>
                <p>{t('uploads:noCompaniesHint')}</p>
              </div>
            </div>
            <form onSubmit={handleCreateCompany} className="upload-company-form">
              <input
                className="form-control"
                aria-label={t('uploads:companyNameLabel')}
                placeholder={t('uploads:companyNamePlaceholder')}
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                required
              />
              <input
                className="form-control"
                aria-label={t('uploads:companyNuitLabel')}
                placeholder={t('uploads:companyNuitPlaceholder')}
                value={newCompanyNuit}
                onChange={(e) => setNewCompanyNuit(e.target.value)}
                maxLength={9}
                inputMode="numeric"
              />
              <button type="submit" className="btn btn-primary-blue btn-sm" disabled={creatingCompany}>
                {creatingCompany ? <Loader2 size={14} className="claq-spin" /> : <Plus size={14} />}
                <span>{creatingCompany ? t('uploads:creatingCompany') : t('uploads:createCompanyCta')}</span>
              </button>
            </form>
          </div>
        )}
      </section>

      {selectedBatchId && !batch && batchQuery.isLoading && (
        <section className="card upload-card">
          <div className="upload-empty-state">
            <Loader2 size={28} className="claq-spin" color="var(--slate-300)" />
            <p>{t('uploads:loadingBatch')}</p>
          </div>
        </section>
      )}

      {selectedBatchId && !batch && batchQuery.isError && (
        <section className="card upload-card">
          <div className="upload-alert is-error" role="alert">
            <AlertCircle size={15} />
            <span>{t('uploads:batchLoadError')}</span>
            <button
              type="button"
              onClick={() => batchQuery.refetch()}
              disabled={batchQuery.isFetching}
              className="btn btn-secondary btn-sm upload-alert-action"
            >
              {batchQuery.isFetching ? <Loader2 size={13} className="claq-spin" /> : <RefreshCw size={13} />}
              <span>{t('uploads:retry')}</span>
            </button>
          </div>
        </section>
      )}

      {batch && (
        <section className="card upload-card">
          <div className="upload-section-head">
            <div className="upload-card-head">
              <div className="upload-card-icon is-slate">
                <FileSpreadsheet size={19} />
              </div>
              <div>
                <h3 className="upload-card-title">{batch.fileName}</h3>
                <p className="upload-card-desc">{formatDate(batch.createdAt.slice(0, 10))}</p>
              </div>
            </div>
            {renderStatusBadge(batch.status)}
          </div>

          {batch.duplicate && (
            <div className="upload-alert is-warning">
              <AlertCircle size={15} />
              <span>{t('uploads:summaryDuplicate')}</span>
            </div>
          )}

          <div className="upload-stats">
            <div className="upload-stat">
              <div className="upload-stat-icon is-blue">
                <FileSpreadsheet size={17} />
              </div>
              <div>
                <span className="upload-stat-label">{t('uploads:summaryRows')}</span>
                <strong className="upload-stat-value">{batch.rowCount}</strong>
              </div>
            </div>
            <div className="upload-stat">
              <div className="upload-stat-icon is-green">
                <CheckCircle2 size={17} />
              </div>
              <div>
                <span className="upload-stat-label">{t('uploads:summaryValid')}</span>
                <strong className="upload-stat-value is-green">{batch.validCount}</strong>
              </div>
            </div>
            <div className="upload-stat">
              <div className="upload-stat-icon is-amber">
                <AlertTriangle size={17} />
              </div>
              <div>
                <span className="upload-stat-label">{t('uploads:summaryExceptions')}</span>
                <strong className={`upload-stat-value${pendingCount > 0 ? ' is-amber' : ''}`}>{batch.exceptionCount}</strong>
              </div>
            </div>
          </div>

          {renderSummaryChips()}
        </section>
      )}

      {batch && (
        <section className="card upload-card">
          <div className="upload-section-head">
            <div>
              <h3 className="upload-card-title">{t('uploads:reviewTitle')}</h3>
              <p className="upload-card-desc">{t('uploads:reviewDesc')}</p>
            </div>
            {pendingCount > 0 && (
              <span className="badge badge-amber">{t('uploads:pendingCount', { count: pendingCount })}</span>
            )}
          </div>

          {batch.exceptions.length === 0 ? (
            <div className="upload-success-panel">
              <div className="upload-success-icon">
                <CheckCircle2 size={19} />
              </div>
              <div>
                <strong>
                  {isApplied
                    ? t('uploads:statusAPPLIED')
                    : batch.exceptionCount > 0
                      ? t('uploads:allResolved')
                      : t('uploads:noExceptions')}
                </strong>
                <p>
                  {isApplied
                    ? t('uploads:applyAlreadyApplied')
                    : batch.exceptionCount > 0
                      ? t('uploads:allResolvedDesc')
                      : t('uploads:noExceptionsDesc')}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive upload-table-wrap">
                <table className="data-table upload-table">
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
                        <td className="upload-row-number">{row.rowNumber}</td>
                        <td>
                          <span className="upload-row-title">{row.title || '—'}</span>
                          {row.errors.length > 0 && (
                            <span className="upload-row-error">{row.errors.map((err) => err.message).join('; ')}</span>
                          )}
                        </td>
                        <td>{row.dueAt ? formatDate(row.dueAt.slice(0, 10)) : '—'}</td>
                        <td className="upload-row-amount">{fmtAmount(row.amount)}</td>
                        <td className="upload-row-expected">{fmtAmount(row.expectedAmount)}</td>
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
                <div className="upload-bulk">
                  <div>
                    <strong className="upload-bulk-title">{t('uploads:bulkTitle')}</strong>
                    <p className="upload-bulk-hint">{t('uploads:bulkHint')}</p>
                  </div>
                  {bulkStates.map(({ state, count, decisions }) => (
                    <div key={state} className="upload-bulk-row">
                      <span className={`badge ${MATCH_STATE_BADGE[state]} upload-bulk-badge`}>
                        {t(`uploads:matchState${state}`)}: {count}
                      </span>
                      {decisions.map((decision) => (
                        <button
                          key={decision}
                          onClick={() => handleDecide(decision, { matchStates: [state] })}
                          disabled={decideMutation.isPending}
                          className="btn btn-secondary btn-sm"
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

          <div className="upload-apply-bar">
            {!isApplied && pendingCount > 0 && (
              <span className="upload-apply-blocked">{t('uploads:applyBlocked')}</span>
            )}
            <button
              onClick={handleApply}
              disabled={applyMutation.isPending || isApplied || pendingCount > 0}
              className="btn btn-primary-gold upload-apply-btn"
            >
              {applyMutation.isPending ? <Loader2 size={16} className="claq-spin" /> : <CheckCircle2 size={16} />}
              <span>{applyMutation.isPending ? t('uploads:applying') : t('uploads:applyCta')}</span>
            </button>
          </div>

          {applyResult && (
            <div className="upload-result">
              <strong className="upload-result-title">{t('uploads:resultTitle')}</strong>
              <div className="upload-result-grid">
                <span>{t('uploads:resultUpdated')}: <strong>{applyResult.obligationsUpdated}</strong></span>
                <span>{t('uploads:resultCreated')}: <strong>{applyResult.obligationsCreated}</strong></span>
                <span>{t('uploads:resultTemplates')}: <strong>{applyResult.templatesCreated}</strong></span>
                <span>{t('uploads:resultSkipped')}: <strong>{applyResult.skipped}</strong></span>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="card upload-card">
        <div className="upload-section-head">
          <div className="upload-card-head">
            <div className="upload-card-icon is-slate">
              <History size={19} />
            </div>
            <div>
              <h3 className="upload-card-title">{t('uploads:historyTitle')}</h3>
              {uploads.length > 0 && (
                <p className="upload-card-desc">{t('uploads:historyCount', { count: uploads.length })}</p>
              )}
            </div>
          </div>
        </div>

        {uploadsQuery.isLoading ? (
          <div className="upload-empty-state">
            <Loader2 size={28} className="claq-spin" color="var(--slate-300)" />
            <p>{t('uploads:loadingUploads')}</p>
          </div>
        ) : uploadsQuery.isError ? (
          <div className="upload-empty-state">
            <AlertCircle size={34} color="var(--red-500)" />
            <h4>{t('uploads:uploadsLoadError')}</h4>
            <button
              type="button"
              onClick={() => uploadsQuery.refetch()}
              disabled={uploadsQuery.isFetching}
              className="btn btn-secondary btn-sm"
            >
              {uploadsQuery.isFetching ? <Loader2 size={13} className="claq-spin" /> : <RefreshCw size={13} />}
              <span>{t('uploads:retry')}</span>
            </button>
          </div>
        ) : uploads.length === 0 ? (
          <div className="upload-empty-state">
            <FileSpreadsheet size={34} color="var(--slate-300)" />
            <h4>{t('uploads:historyEmpty')}</h4>
            <p>{t('uploads:historyEmptyDesc')}</p>
          </div>
        ) : (
          <div className="table-responsive upload-table-wrap">
            <table className="data-table upload-table">
              <thead>
                <tr>
                  <th>{t('uploads:colFileName')}</th>
                  <th>{t('uploads:colRows')}</th>
                  <th>{t('uploads:colValid')}</th>
                  <th>{t('uploads:colExceptions')}</th>
                  <th>{t('uploads:colStatus')}</th>
                  <th className="upload-align-right">{t('uploads:colCreated')}</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((item: UploadBatchSummary) => (
                  <tr
                    key={item.id}
                    onClick={() => openBatch(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openBatch(item.id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={item.fileName}
                    className={`upload-history-row${item.id === selectedBatchId ? ' is-selected' : ''}`}
                  >
                    <td className="upload-row-title">{item.fileName}</td>
                    <td>{item.rowCount}</td>
                    <td className="upload-row-valid">{item.validCount}</td>
                    <td className={item.exceptionCount > 0 ? 'upload-row-warning' : ''}>{item.exceptionCount}</td>
                    <td>{renderStatusBadge(item.status)}</td>
                    <td className="upload-align-right upload-row-date">{formatDate(item.createdAt.slice(0, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

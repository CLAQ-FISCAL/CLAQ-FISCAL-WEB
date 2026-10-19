import { useCallback } from 'react';
import { useAppState } from '../context/AppStateContext';
import type { SimulationReport } from '../types';

/**
 * Opens the generic print/PDF preview for any simulator after a calculation.
 * Falls back to the authenticated user's name as the technical responsible.
 */
export function useSimulatorPrint() {
  const { openPDFPreview, user } = useAppState();

  return useCallback(
    (report: SimulationReport) => {
      openPDFPreview({
        ...report,
        responsibleName: report.responsibleName || user?.name || undefined,
      });
    },
    [openPDFPreview, user]
  );
}

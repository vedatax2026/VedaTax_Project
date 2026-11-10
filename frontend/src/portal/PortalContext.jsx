import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { portal } from '../api/client';

const PortalContext = createContext(null);
const FILING_KEY = 'vedatax.filing';

export const STAGE_LABELS = {
  Registered: 'Registered',
  DocumentsUploaded: 'Documents Uploaded',
  PreparationPending: 'Preparation Pending',
  ReviewCompleted: 'Review Completed',
  InvoicePaid: 'Invoice Paid',
  Completed: 'Completed',
};

export const COUNTRY_SHORT = { us: 'US', ca: 'Canada', in: 'India' };

export const filingLabel = (f) => (f ? `${COUNTRY_SHORT[f.countryCode]} · ${f.yearLabel}` : '');

function storedFilingId() {
  try { return Number(localStorage.getItem(FILING_KEY)) || null; } catch { return null; }
}

/** The client's filings (one per country + tax year) and which one the portal is showing. */
export function PortalProvider({ children }) {
  const [filings, setFilings] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selectedId, setSelectedId] = useState(storedFilingId);
  const [newFilingOpen, setNewFilingOpen] = useState(false);

  const reload = useCallback(() => portal.filings()
    .then((list) => { setFilings(list); setStatus('ready'); return list; })
    .catch((e) => { setStatus('error'); throw e; }), []);

  useEffect(() => { reload().catch(() => {}); }, [reload]);

  const select = useCallback((id) => {
    setSelectedId(id);
    try { localStorage.setItem(FILING_KEY, String(id)); } catch { /* ignore */ }
  }, []);

  // Fall back to the most recent filing when nothing (or a stale id) is selected.
  const filing = filings.find((f) => f.id === selectedId) || filings[0] || null;

  const createFiling = useCallback(async (countryCode, taxYear) => {
    const created = await portal.createFiling(countryCode, taxYear);
    await reload();
    select(created.id);
    return created;
  }, [reload, select]);

  const value = useMemo(() => ({
    filings, filing, status, select, reload, createFiling,
    newFilingOpen, openNewFiling: () => setNewFilingOpen(true), closeNewFiling: () => setNewFilingOpen(false),
  }), [filings, filing, status, select, reload, createFiling, newFilingOpen]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export const usePortal = () => useContext(PortalContext);

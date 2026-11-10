import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

const SiteContext = createContext(null);
const COUNTRY_KEY = 'vedatax.country';
export const COUNTRY_CODES = ['us', 'ca', 'in'];

function storedCountry() {
  try {
    const c = localStorage.getItem(COUNTRY_KEY);
    return COUNTRY_CODES.includes(c) ? c : 'us';
  } catch {
    return 'us';
  }
}

/**
 * Holds the Services menu (US / Canada / India Taxation), the selected country
 * (like the reference site's ?country= selector) and the consultation pop-up state.
 */
export function SiteProvider({ children }) {
  const [params, setParams] = useSearchParams();
  const qp = params.get('country');
  const [country, setCountryState] = useState(COUNTRY_CODES.includes(qp) ? qp : storedCountry());
  const [menu, setMenu] = useState([]);
  const [menuStatus, setMenuStatus] = useState('loading');
  const [enquiry, setEnquiry] = useState({ open: false, country: null, service: null });

  useEffect(() => {
    if (COUNTRY_CODES.includes(qp) && qp !== country) setCountryState(qp);
  }, [qp]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { localStorage.setItem(COUNTRY_KEY, country); } catch { /* ignore */ }
  }, [country]);

  const loadMenu = useCallback(() => {
    setMenuStatus('loading');
    api.menu()
      .then((m) => { setMenu(m); setMenuStatus('ready'); })
      .catch(() => setMenuStatus('error'));
  }, []);

  useEffect(loadMenu, [loadMenu]);

  const setCountry = useCallback((code) => {
    setCountryState(code);
    const next = new URLSearchParams(params);
    next.set('country', code);
    setParams(next, { replace: true });
  }, [params, setParams]);

  const openEnquiry = useCallback((opts = {}) => {
    setEnquiry({ open: true, country: opts.country || null, service: opts.service || null });
  }, []);
  const closeEnquiry = useCallback(() => setEnquiry((e) => ({ ...e, open: false })), []);

  const value = useMemo(() => ({
    country, setCountry, menu, menuStatus, reloadMenu: loadMenu,
    enquiry, openEnquiry, closeEnquiry,
    countryInfo: (code) => menu.find((c) => c.code === code),
  }), [country, setCountry, menu, menuStatus, loadMenu, enquiry, openEnquiry, closeEnquiry]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

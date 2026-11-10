import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite, COUNTRY_CODES } from '../context/SiteContext';

const DISMISS_KEY = 'vedatax.assistantDismissed';

/** Bottom-right "A question before you file?" pop-up with a launcher button. */
export default function AssistantPopup() {
  const { openEnquiry, country: selected, countryInfo } = useSite();
  // On /services/:country/... pages, follow the page's country rather than the header selector.
  const routeCountry = useLocation().pathname.match(/^\/services\/([a-z]{2})(\/|$)/)?.[1];
  const country = COUNTRY_CODES.includes(routeCountry) ? routeCountry : selected;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
    if (dismissed) return undefined;
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const info = countryInfo(country);

  return (
    <div className="assistant">
      {open && (
        <div className="assistant__card" role="dialog" aria-label="VedaTax assistant">
          <button type="button" className="assistant__close" aria-label="Dismiss" onClick={dismiss}>×</button>
          <p className="eyebrow">VedaTax assistant</p>
          <h3>A question before you file?</h3>
          <p className="muted">{info ? `${info.menuTitle} — ` : ''}start with a short conversation with our team.</p>
          <button type="button" className="btn btn--navy btn--block" onClick={() => { dismiss(); openEnquiry({ country }); }}>
            Start a conversation
          </button>
        </div>
      )}
      <button type="button" className="assistant__launcher" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Chat with VedaTax
      </button>
    </div>
  );
}

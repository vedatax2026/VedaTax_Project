import { usePortal } from './PortalContext';
import StartFilingForm from './StartFilingForm';

/** Renders children(filing) once a filing is selected; otherwise a "start your first filing" card. */
export function RequireFiling({ children }) {
  const { filing, status } = usePortal();
  if (status === 'loading') return <p className="muted">Loading…</p>;
  if (status === 'error') return <p className="form__error">We couldn't load your filings. Please refresh the page.</p>;
  if (!filing) {
    return (
      <div className="p-card start-first">
        <h1 className="p-title">Welcome to your VedaTax portal</h1>
        <p className="muted">Start by telling us which return you'd like us to prepare. You can add more countries or tax years later from the selector at the top.</p>
        <StartFilingForm />
      </div>
    );
  }
  return children(filing);
}

export function PageHead({ title, children }) {
  return (
    <div className="p-head">
      <h1 className="p-title">{title}</h1>
      {children && <div className="p-head__actions">{children}</div>}
    </div>
  );
}

export const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatLongDate = (iso) => {
  // Date-only strings ("2026-04-15") must not shift with the time zone.
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const LOCALES = { USD: 'en-US', CAD: 'en-CA', INR: 'en-IN' };
export const formatMoney = (amount, currency) =>
  new Intl.NumberFormat(LOCALES[currency] || 'en-US', {
    style: 'currency', currency, minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2,
  }).format(amount);

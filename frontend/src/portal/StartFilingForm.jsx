import { useEffect, useState } from 'react';
import { portal } from '../api/client';
import { usePortal } from './PortalContext';

const LABELS = { us: 'US Taxation', ca: 'Canada Taxation', in: 'India Taxation' };

function useFilingOptions() {
  const { filings } = usePortal();
  const [options, setOptions] = useState(null);
  useEffect(() => { portal.filingOptions().then(setOptions).catch(() => setOptions([])); }, [filings.length]);
  return options;
}

/** Country cards + tax-year select. Used in the pop-up and on the empty-portal screen. */
export default function StartFilingForm({ onDone }) {
  const { createFiling, filings } = usePortal();
  const options = useFilingOptions();
  const [country, setCountry] = useState('us');
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const years = options?.find((o) => o.code === country)?.years || [];

  useEffect(() => {
    const firstFree = years.find((y) => !y.exists) || years[0];
    setYear(firstFree ? String(firstFree.taxYear) : '');
  }, [country, options]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosen = years.find((y) => String(y.taxYear) === year);
  const existing = chosen?.exists && filings.find((f) => f.countryCode === country && String(f.taxYear) === year);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createFiling(country, Number(year));
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!options) return <p className="muted">Loading…</p>;

  return (
    <form className="form start-filing" onSubmit={submit}>
      <div className="start-filing__countries" role="radiogroup" aria-label="Country">
        {options.map((o) => (
          <button
            key={o.code}
            type="button"
            role="radio"
            aria-checked={country === o.code}
            className={`start-filing__country ${country === o.code ? 'is-active' : ''}`}
            onClick={() => setCountry(o.code)}
          >
            <span className={`flag flag--${o.code}`}>{o.code.toUpperCase()}</span>
            {LABELS[o.code]}
          </button>
        ))}
      </div>
      <label>Tax year
        <select value={year} onChange={(e) => setYear(e.target.value)} required>
          {years.map((y) => (
            <option key={y.taxYear} value={y.taxYear}>{y.label}{y.exists ? ' (already started)' : ''}</option>
          ))}
        </select>
      </label>
      {error && <p className="form__error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--navy" disabled={busy || !year}>
        {busy ? 'Starting…' : existing ? 'Open this filing' : 'Start filing'}
      </button>
    </form>
  );
}

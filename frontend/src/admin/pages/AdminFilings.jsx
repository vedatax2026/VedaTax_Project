import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../api/client';
import useFetch from '../../api/useFetch';
import { STAGE_LABELS, COUNTRY_SHORT } from '../../portal/PortalContext';
import { PageHead, formatDate } from '../../portal/shared';
import { IconSearch } from '../../portal/icons';

const INVOICE_BADGE = { Paid: 'badge badge--green', Unpaid: 'badge badge--amber' };

export const STAGE_BADGE = {
  Registered: 'badge',
  DocumentsUploaded: 'badge badge--blue',
  PreparationPending: 'badge badge--amber',
  ReviewCompleted: 'badge badge--blue',
  InvoicePaid: 'badge badge--green',
  Completed: 'badge badge--green',
};

export default function AdminFilings() {
  const { data, loading, error } = useFetch(() => admin.filings(), []);
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter((f) =>
      (!country || f.countryCode === country)
      && (!status || f.status === status)
      && (!term || f.clientName.toLowerCase().includes(term) || f.clientEmail.includes(term)
        || (f.consultantName || '').toLowerCase().includes(term)));
  }, [data, q, country, status]);

  const counts = useMemo(() => {
    const c = {};
    (data || []).forEach((f) => { c[f.status] = (c[f.status] || 0) + 1; });
    return c;
  }, [data]);

  return (
    <>
      <div className="admin-kpis">
        {Object.keys(STAGE_LABELS).map((s) => (
          <button key={s} type="button" className={`admin-kpi ${status === s ? 'is-active' : ''}`}
            onClick={() => setStatus((cur) => (cur === s ? '' : s))} aria-pressed={status === s}>
            <span className="admin-kpi__value">{counts[s] || 0}</span>
            <span className="admin-kpi__label">{STAGE_LABELS[s]}</span>
          </button>
        ))}
      </div>

      <section className="p-card">
        <PageHead title="Client filings">
          <span className="muted">{rows.length} of {data?.length ?? 0}</span>
        </PageHead>

        <div className="admin-filters">
          <label className="search">
            <IconSearch size={16} />
            <span className="sr-only">Search</span>
            <input type="search" placeholder="Search client, email or consultant…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
            <option value="">All countries</option>
            <option value="us">US</option>
            <option value="ca">Canada</option>
            <option value="in">India</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading && !data && <p className="muted">Loading…</p>}
        {error && <p className="form__error">{error.message}</p>}
        {data && rows.length === 0 && <p className="empty">{data.length === 0 ? 'No client filings yet.' : 'No filings match these filters.'}</p>}

        {rows.length > 0 && (
          <div className="p-table-wrap">
            <table className="p-table admin-table">
              <thead>
                <tr><th>Client</th><th>Return</th><th>Status</th><th>Docs</th><th>Invoice</th><th>Consultant</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td data-label="Client">
                      <Link to={`/admin/filings/${f.id}`} className="admin-client">
                        <strong>{f.clientName}</strong><small>{f.clientEmail}</small>
                      </Link>
                    </td>
                    <td data-label="Return"><span className={`flag flag--sm flag--${f.countryCode}`}>{f.countryCode.toUpperCase()}</span> {COUNTRY_SHORT[f.countryCode]} · {f.yearLabel}</td>
                    <td data-label="Status"><span className={STAGE_BADGE[f.status]}>{STAGE_LABELS[f.status]}</span></td>
                    <td data-label="Docs">{f.documentCount}</td>
                    <td data-label="Invoice">{f.invoiceStatus ? <span className={INVOICE_BADGE[f.invoiceStatus]}>{f.invoiceStatus}</span> : <span className="muted">—</span>}</td>
                    <td data-label="Consultant">{f.consultantName || <span className="muted">Unassigned</span>}</td>
                    <td data-label="Updated">{formatDate(f.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { admin } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { PageHead, formatDate } from '../../portal/shared';
import { IconSearch } from '../../portal/icons';

const STATUSES = ['New', 'Contacted', 'Converted', 'Closed'];
const BADGE = { New: 'badge badge--amber', Contacted: 'badge badge--blue', Converted: 'badge badge--green', Closed: 'badge' };

/** Requests from the website's free-consultation pop-up. */
export default function AdminEnquiries() {
  const { menu } = useSite();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { admin.enquiries().then(setList).catch((e) => setError(e.message)); }, []);

  const serviceTitle = (code, slug) =>
    menu.find((c) => c.code === code)?.services.find((s) => s.slug === slug)?.title || (slug ? slug : 'General enquiry');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (list || []).filter((e) => (!status || e.status === status)
      && (!term || e.fullName.toLowerCase().includes(term) || e.email.includes(term) || (e.phone || '').includes(term)
        || (e.message || '').toLowerCase().includes(term)));
  }, [list, q, status]);

  const changeStatus = async (e, next) => {
    setSavingId(e.id);
    setError('');
    try {
      const updated = await admin.setEnquiryStatus(e.id, next);
      setList((l) => l.map((x) => (x.id === e.id ? updated : x)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const newCount = (list || []).filter((e) => e.status === 'New').length;

  return (
    <section className="p-card">
      <PageHead title="Consultation requests">
        {list && <span className="badge badge--amber">{newCount} new</span>}
      </PageHead>

      <div className="admin-filters">
        <label className="search">
          <IconSearch size={16} />
          <span className="sr-only">Search</span>
          <input type="search" placeholder="Search name, email, phone or message…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p className="form__error" role="alert">{error}</p>}
      {!list && !error && <p className="muted">Loading…</p>}
      {list && rows.length === 0 && <p className="empty">{list.length === 0 ? 'No consultation requests yet.' : 'No requests match these filters.'}</p>}

      {rows.length > 0 && (
        <div className="p-table-wrap">
          <table className="p-table admin-table">
            <thead><tr><th>Received</th><th>Contact</th><th>Service</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td data-label="Received">{formatDate(e.createdAt)}</td>
                  <td data-label="Contact">
                    <span className="admin-client">
                      <strong>{e.fullName}</strong>
                      <a href={`mailto:${e.email}`}>{e.email}</a>
                      {e.phone && <a href={`tel:${e.phone.replace(/\s/g, '')}`}>{e.phone}</a>}
                    </span>
                  </td>
                  <td data-label="Service"><span className={`flag flag--sm flag--${e.countryCode}`}>{e.countryCode.toUpperCase()}</span> {serviceTitle(e.countryCode, e.serviceSlug)}</td>
                  <td data-label="Message" className="admin-message">{e.message || <span className="muted">—</span>}</td>
                  <td data-label="Status">
                    <select className={`admin-status ${BADGE[e.status]}`} value={e.status} disabled={savingId === e.id}
                      onChange={(ev) => changeStatus(e, ev.target.value)} aria-label={`Status for ${e.fullName}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

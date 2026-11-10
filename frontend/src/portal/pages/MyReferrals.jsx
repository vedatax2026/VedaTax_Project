import { useState } from 'react';
import { Link } from 'react-router-dom';
import { portal } from '../../api/client';
import useFetch from '../../api/useFetch';
import { PageHead, formatDate, formatMoney } from '../shared';
import { IconGift, IconSearch } from '../icons';

const BADGE = { Invited: 'badge', Registered: 'badge badge--blue', Paid: 'badge badge--green' };

export default function MyReferrals() {
  const { data, loading, error } = useFetch(() => portal.referrals(), []);
  const [q, setQ] = useState('');

  const term = q.trim().toLowerCase();
  const rows = (data || []).filter((r) => !term
    || r.name.toLowerCase().includes(term) || r.email.includes(term) || (r.phone || '').includes(term) || r.status.toLowerCase().includes(term));

  return (
    <section className="p-card">
      <PageHead title="My Referrals">
        <Link to="/portal/refer" className="btn btn--navy btn--sm"><IconGift size={16} /> Refer &amp; Earn</Link>
      </PageHead>

      <div className="table-tools">
        <label className="search">
          <IconSearch size={16} />
          <span className="sr-only">Search referrals</span>
          <input type="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {loading && !data && <p className="muted">Loading…</p>}
      {error && <p className="form__error">{error.message}</p>}
      {data && rows.length === 0 && (
        <p className="empty">{data.length === 0 ? <>No referrals yet. <Link to="/portal/refer">Refer a friend</Link> to start earning.</> : 'No referrals match your search.'}</p>
      )}

      {rows.length > 0 && (
        <div className="p-table-wrap">
          <table className="p-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Referred on</th><th>Status</th><th className="right">Bonus</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Name"><strong>{r.name}</strong></td>
                  <td data-label="Email">{r.email}</td>
                  <td data-label="Phone">{r.phone || '—'}</td>
                  <td data-label="Referred on">{formatDate(r.createdAt)}</td>
                  <td data-label="Status"><span className={BADGE[r.status]}>{r.status}</span></td>
                  <td data-label="Bonus" className="right">{r.bonus ? formatMoney(r.bonus.amount, r.bonus.currency) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

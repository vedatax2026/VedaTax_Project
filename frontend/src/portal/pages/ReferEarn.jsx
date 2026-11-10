import { useState } from 'react';
import { Link } from 'react-router-dom';
import { portal } from '../../api/client';
import { PageHead } from '../shared';
import { IconPlus, IconTrash, IconUsers, IconCheck } from '../icons';

const blank = () => ({ key: crypto.randomUUID?.() || String(Math.random()), name: '', email: '', phone: '' });

export default function ReferEarn() {
  const [rows, setRows] = useState([blank()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const update = (key, field) => (e) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: e.target.value } : r)));
  const add = () => setRows((rs) => (rs.length >= 20 ? rs : [...rs, blank()]));
  const remove = (key) => setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.key !== key)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await portal.addReferrals(rows.map(({ name, email, phone }) => ({
        name: name.trim(), email: email.trim(), phone: phone.trim() || null,
      })));
      setResult(res);
      if (res.added > 0) setRows([blank()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="p-card">
        <PageHead title="Refer & Earn">
          <Link to="/portal/referrals" className="btn btn--outline-green btn--sm"><IconUsers size={16} /> My referrals</Link>
        </PageHead>

        <div className="refer-hero">
          <div>
            <h2>Share VedaTax and save on your next return</h2>
            <p>Refer friends and family who need help with US, Canada or India taxes. When they pay for their first filing, you earn a bonus that's taken off your own invoice.</p>
          </div>
          <ul className="refer-hero__amounts">
            <li><strong>$25</strong><span>per US referral</span></li>
            <li><strong>C$25</strong><span>per Canada referral</span></li>
            <li><strong>₹1,000</strong><span>per India referral</span></li>
          </ul>
        </div>

        <form className="form refer-form" onSubmit={submit}>
          {rows.map((r, i) => (
            <div className="refer-row" key={r.key}>
              <label>Referral name
                <input required minLength={2} value={r.name} onChange={update(r.key, 'name')} placeholder="Enter referral name" />
              </label>
              <label>Referral email
                <input required type="email" value={r.email} onChange={update(r.key, 'email')} placeholder="Enter referral email" />
              </label>
              <label>Referral phone
                <input type="tel" value={r.phone} onChange={update(r.key, 'phone')} placeholder="Enter referral phone" />
              </label>
              <button type="button" className="icon-btn icon-btn--danger refer-row__remove" aria-label={`Remove referral ${i + 1}`}
                onClick={() => remove(r.key)} disabled={rows.length === 1}>
                <IconTrash size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--soft btn--sm" onClick={add} disabled={rows.length >= 20}>
            <IconPlus size={16} /> Add another
          </button>

          {error && <p className="form__error" role="alert">{error}</p>}
          {result && (
            <div className="p-success" role="status">
              <IconCheck size={18} />
              <div>
                {result.added > 0
                  ? <p><strong>{result.added} referral{result.added === 1 ? '' : 's'} added.</strong> We'll reach out to them. Track progress under <Link to="/portal/referrals">My Referrals</Link>.</p>
                  : <p><strong>No new referrals were added.</strong></p>}
                {result.skipped.length > 0 && <p className="muted">Skipped: {result.skipped.join(', ')}</p>}
              </div>
            </div>
          )}

          <div>
            <button type="submit" className="btn btn--navy" disabled={busy}>{busy ? 'Submitting…' : 'Submit referrals'}</button>
          </div>
        </form>
      </section>

      <section className="p-card">
        <h2 className="p-card__title">How it works</h2>
        <ol className="how-steps">
          <li><strong>Refer</strong><span>Add your friends' details above.</span></li>
          <li><strong>They sign up</strong><span>Their status changes to Registered when they create a VedaTax account with that email.</span></li>
          <li><strong>You earn</strong><span>Once they pay for a filing, the bonus is credited and taken off your next invoice.</span></li>
        </ol>
      </section>
    </>
  );
}

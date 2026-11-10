import { useEffect, useState } from 'react';
import { portal } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHead } from '../shared';
import { IconCheck } from '../icons';

export default function Profile() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    portal.profile()
      .then((p) => { setEmail(p.email); setForm({ fullName: p.fullName, phone: p.phone || '', alternatePhone: p.alternatePhone || '' }); })
      .catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => { setSaved(false); setForm((f) => ({ ...f, [k]: e.target.value })); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const p = await portal.updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || null,
      });
      updateUser({ fullName: p.fullName, phone: p.phone });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p-card">
      <PageHead title="Profile details" />
      {!form && !error && <p className="muted">Loading…</p>}
      {form && (
        <form className="form profile-form" onSubmit={submit}>
          <div className="form__grid">
            <label>Full name *
              <input required minLength={2} value={form.fullName} onChange={set('fullName')} autoComplete="name" />
            </label>
            <label>Email
              <input value={email} disabled title="Contact support to change your sign-in email" />
            </label>
            <label>Phone *
              <input required type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </label>
            <label>Alternative phone
              <input type="tel" value={form.alternatePhone} onChange={set('alternatePhone')} />
            </label>
          </div>
          {saved && <p className="success-line" role="status"><IconCheck size={16} /> Profile updated.</p>}
          <button type="submit" className="btn btn--navy" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>
      )}
      {error && <p className="form__error" role="alert">{error}</p>}
    </section>
  );
}

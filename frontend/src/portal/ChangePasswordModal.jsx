import { useState } from 'react';
import Modal from '../components/Modal';
import { api } from '../api/client';

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' };

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const close = () => { setForm(EMPTY); setError(''); setDone(false); onClose(); };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setError('The new passwords do not match.'); return; }
    setBusy(true);
    setError('');
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} labelledBy="pw-title" width={460}>
      <h2 id="pw-title">Change password</h2>
      {done ? (
        <>
          <p className="muted">Your password has been changed. Use the new one the next time you sign in.</p>
          <button type="button" className="btn btn--navy" onClick={close}>Done</button>
        </>
      ) : (
        <form className="form" onSubmit={submit}>
          <label>Current password
            <input type="password" required autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} />
          </label>
          <label>New password
            <input type="password" required minLength={8} autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} />
          </label>
          <label>Confirm new password
            <input type="password" required minLength={8} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          </label>
          <p className="fine" style={{ textAlign: 'left', marginTop: 0 }}>At least 8 characters.</p>
          {error && <p className="form__error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn btn--navy" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
            <button type="button" className="btn btn--outline" onClick={close}>Cancel</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register({ ...form, phone: form.phone || null });
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth">
      <form className="auth__card form" onSubmit={submit}>
        <img src="/vedatax-mark.jpeg" alt="" className="auth__mark" />
        <h1>Create your account</h1>
        <label>Full name<input required minLength={2} value={form.fullName} onChange={update('fullName')} autoComplete="name" /></label>
        <label>Email<input type="email" required value={form.email} onChange={update('email')} autoComplete="email" /></label>
        <label>Phone<input type="tel" value={form.phone} onChange={update('phone')} autoComplete="tel" /></label>
        <label>Password<input type="password" required minLength={8} value={form.password} onChange={update('password')} autoComplete="new-password" /></label>
        {error && <p className="form__error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--navy btn--block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="fine">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </section>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      const home = u.role === 'Admin' ? '/admin' : '/portal';
      const from = location.state?.from;
      // Don't send staff into the client portal (or clients into the staff area) via a stale "from".
      const fromOk = from && !(u.role === 'Admin' ? from.startsWith('/portal') : from.startsWith('/admin'));
      navigate(fromOk ? from : home, { replace: true });
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
        <h1>Client login</h1>
        <p className="muted">Sign in to track your enquiries and filings.</p>
        <label>Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="form__error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--navy btn--block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="fine">New to VedaTax? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../portal/ChangePasswordModal';
import { IconDocuments, IconMail, IconUser, IconChevron, IconMenu } from '../portal/icons';
import '../portal/portal.css';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Client filings', icon: IconDocuments, end: false, match: (p) => p === '/admin' || p.startsWith('/admin/filings') },
  { to: '/admin/enquiries', label: 'Consultation requests', icon: IconMail },
];

/** Staff area: same shell as the client portal, different navigation. Role "Admin" only. */
export default function AdminLayout() {
  const { user, ready, logout } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => { setNavOpen(false); setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  if (!ready) return <div className="portal-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'Admin') return <Navigate to="/portal" replace />;

  return (
    <div className={`portal admin ${navOpen ? 'nav-open' : ''}`}>
      <aside className="portal-side" aria-label="Staff area">
        <div className="portal-side__brand"><Logo light /></div>
        <p className="admin-side__label">Staff area</p>
        <nav className="portal-nav">
          {NAV.map(({ to, label, icon: Icon, match }) => (
            <NavLink key={to} to={to} end={!match}
              className={({ isActive }) => `portal-nav__link ${(match ? match(location.pathname) : isActive) ? 'active' : ''}`}>
              <Icon /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="portal-side__back">← Back to website</Link>
      </aside>
      <button type="button" className="portal-scrim" aria-label="Close menu" onClick={() => setNavOpen(false)} tabIndex={-1} />

      <div className="portal-main">
        <header className="portal-top">
          <button type="button" className="portal-top__burger" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <IconMenu size={22} />
          </button>
          <span className="admin-top__badge">VedaTax staff</span>
          <div className="user-menu" ref={menuRef}>
            <button type="button" className="user-menu__btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span className="user-menu__avatar"><IconUser size={16} /></span>
              <span className="user-menu__name">{user.fullName.split(' ')[0]}</span>
              <IconChevron size={16} />
            </button>
            {menuOpen && (
              <div className="user-menu__panel" role="menu">
                <div className="user-menu__head"><strong>{user.fullName}</strong><small>{user.email}</small></div>
                <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setPwOpen(true); }}>Change password</button>
                <Link role="menuitem" to="/">VedaTax website</Link>
                <button role="menuitem" type="button" className="danger" onClick={logout}>Sign out</button>
              </div>
            )}
          </div>
        </header>
        <main className="portal-content"><Outlet /></main>
      </div>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

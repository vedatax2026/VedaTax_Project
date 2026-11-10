import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { PortalProvider, usePortal, COUNTRY_SHORT } from './PortalContext';
import NewFilingModal from './NewFilingModal';
import ChangePasswordModal from './ChangePasswordModal';
import {
  IconDashboard, IconOrganizer, IconDocuments, IconInvoice, IconGift, IconUsers, IconUser, IconChevron,
  IconMenu, IconPhone, IconMail,
} from './icons';
import './portal.css';

const NAV = [
  { to: '/portal', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/portal/tax-organizer', label: 'Tax Organizer', icon: IconOrganizer },
  { to: '/portal/documents', label: 'Documents', icon: IconDocuments },
  { to: '/portal/invoice', label: 'Invoice', icon: IconInvoice },
  { to: '/portal/refer', label: 'Refer & Earn', icon: IconGift },
  { to: '/portal/referrals', label: 'My Referrals', icon: IconUsers },
];

export default function PortalLayout() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="portal-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role === 'Admin') return <Navigate to="/admin" replace />;
  return (
    <PortalProvider>
      <PortalShell />
    </PortalProvider>
  );
}

function PortalShell() {
  const { user, logout } = useAuth();
  const { filings, filing, select, openNewFiling, newFilingOpen, closeNewFiling } = usePortal();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => { setNavOpen(false); setMenuOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const groups = ['us', 'ca', 'in']
    .map((code) => ({ code, items: filings.filter((f) => f.countryCode === code) }))
    .filter((g) => g.items.length);

  const onFilingChange = (e) => {
    if (e.target.value === 'new') { openNewFiling(); return; }
    select(Number(e.target.value));
  };

  const consultant = filing?.consultant;

  return (
    <div className={`portal ${navOpen ? 'nav-open' : ''}`}>
      <aside className="portal-side" aria-label="Client portal">
        <div className="portal-side__brand"><Logo light /></div>
        <nav className="portal-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="portal-nav__link">
              <Icon /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {consultant && (
          <div className="consultant">
            <p className="consultant__title">Your personal consultant</p>
            <p className="consultant__name">{consultant.name}</p>
            {consultant.phone && <a href={`tel:${consultant.phone.replace(/\s/g, '')}`}><IconPhone size={14} /> {consultant.phone}</a>}
            {consultant.email && <a href={`mailto:${consultant.email}`}><IconMail size={14} /> {consultant.email}</a>}
          </div>
        )}
        <Link to="/" className="portal-side__back">← Back to website</Link>
      </aside>
      <button type="button" className="portal-scrim" aria-label="Close menu" onClick={() => setNavOpen(false)} tabIndex={-1} />

      <div className="portal-main">
        <header className="portal-top">
          <button type="button" className="portal-top__burger" aria-label="Open menu" onClick={() => setNavOpen(true)}>
            <IconMenu size={22} />
          </button>

          {filings.length > 0 && (
            <label className="filing-select">
              <span className="sr-only">Tax year</span>
              <select value={filing?.id ?? ''} onChange={onFilingChange}>
                {groups.map((g) => (
                  <optgroup key={g.code} label={`${COUNTRY_SHORT[g.code]} Taxation`}>
                    {g.items.map((f) => <option key={f.id} value={f.id}>{COUNTRY_SHORT[f.countryCode]} · {f.yearLabel}</option>)}
                  </optgroup>
                ))}
                <option value="new">+ Start another filing…</option>
              </select>
            </label>
          )}

          <div className="user-menu" ref={menuRef}>
            <button type="button" className="user-menu__btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span className="user-menu__avatar"><IconUser size={16} /></span>
              <span className="user-menu__name">{user.fullName.split(' ')[0]}</span>
              <IconChevron size={16} />
            </button>
            {menuOpen && (
              <div className="user-menu__panel" role="menu">
                <div className="user-menu__head">
                  <strong>{user.fullName}</strong>
                  <small>{user.email}</small>
                </div>
                <Link role="menuitem" to="/portal/profile">Profile details</Link>
                <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setPwOpen(true); }}>Change password</button>
                <Link role="menuitem" to="/">VedaTax website</Link>
                <button role="menuitem" type="button" className="danger" onClick={logout}>Sign out</button>
              </div>
            )}
          </div>
        </header>

        <main className="portal-content">
          <Outlet />
        </main>
      </div>

      <NewFilingModal open={newFilingOpen} onClose={closeNewFiling} />
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

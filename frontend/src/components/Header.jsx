import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo';
import ServicesMegaMenu from './ServicesMegaMenu';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';

const COUNTRY_LABELS = { us: 'United States', ca: 'Canada', in: 'India' };

export default function Header() {
  const { country, setCountry, menu, menuStatus } = useSite();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCountry, setMobileCountry] = useState(null);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const closeTimer = useRef();
  const servicesRef = useRef();

  // Close menus whenever the route changes.
  useEffect(() => {
    setServicesOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Escape / outside click closes the dropdown.
  useEffect(() => {
    if (!servicesOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setServicesOpen(false);
    const onClick = (e) => servicesRef.current && !servicesRef.current.contains(e.target) && setServicesOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [servicesOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const hoverOpenedAt = useRef(0);
  const openNow = () => {
    clearTimeout(closeTimer.current);
    if (!servicesOpen) hoverOpenedAt.current = Date.now();
    setServicesOpen(true);
  };
  // A click right after hover-open shouldn't immediately close it (touch devices still toggle normally).
  const toggleServices = () => {
    if (servicesOpen && Date.now() - hoverOpenedAt.current < 500) return;
    setServicesOpen((o) => !o);
  };
  const closeSoon = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setServicesOpen(false), 180); };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Logo />

        <nav className="nav" aria-label="Primary">
          <div
            className={`nav__item nav__item--services ${servicesOpen ? 'is-open' : ''}`}
            ref={servicesRef}
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            <button
              type="button"
              className="nav__link"
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              onClick={toggleServices}
            >
              Services <span className="caret" aria-hidden="true">▾</span>
            </button>
            {servicesOpen && <ServicesMegaMenu onNavigate={() => setServicesOpen(false)} />}
          </div>
          <NavLink to="/pricing" className="nav__link">Pricing</NavLink>
          <NavLink to="/about" className="nav__link">About</NavLink>
          <NavLink to="/contact" className="nav__link">Contact</NavLink>
        </nav>

        <div className="header-actions">
          <label className="country-select">
            <span className="sr-only">Country</span>
            <img src={`/flag-${country}.svg`} alt="" width="24" height="16" />
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>
          {user ? (
            <>
              <Link to={user.role === 'Admin' ? '/admin' : '/portal'} className="btn btn--outline btn--sm">{user.role === 'Admin' ? 'Staff area' : 'My account'}</Link>
              <button type="button" className="nav__link nav__link--plain" onClick={logout}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className="btn btn--navy btn--sm">Login</Link>
          )}
        </div>

        <button
          type="button"
          className={`burger ${mobileOpen ? 'is-open' : ''}`}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer with nested accordions: Services → Country → sub-services */}
      <div className={`mobile-nav ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <button
          type="button"
          className="mobile-nav__row"
          aria-expanded={mobileServicesOpen}
          onClick={() => setMobileServicesOpen((o) => !o)}
        >
          Services <span aria-hidden="true">{mobileServicesOpen ? '−' : '+'}</span>
        </button>
        {mobileServicesOpen && (
          <div className="mobile-nav__group">
            {menuStatus !== 'ready' && <p className="muted">Loading services…</p>}
            {menu.map((c) => (
              <div key={c.code}>
                <button
                  type="button"
                  className="mobile-nav__row mobile-nav__row--sub"
                  aria-expanded={mobileCountry === c.code}
                  onClick={() => setMobileCountry((m) => (m === c.code ? null : c.code))}
                >
                  <span className="mobile-nav__country-label"><img className="country-flag" src={`/flag-${c.code}.svg`} alt="" width="34" height="24" /> {c.menuTitle}</span>
                  <span aria-hidden="true">{mobileCountry === c.code ? '−' : '+'}</span>
                </button>
                {mobileCountry === c.code && (
                  <ul className="mobile-nav__list">
                    <li><Link to={`/services/${c.code}`}>All {c.menuTitle} services</Link></li>
                    {c.services.map((s) => (
                      <li key={s.slug}><Link to={`/services/${c.code}/${s.slug}`}>{s.title}</Link></li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        <Link className="mobile-nav__row" to="/pricing">Pricing</Link>
        <Link className="mobile-nav__row" to="/about">About</Link>
        <Link className="mobile-nav__row" to="/contact">Contact</Link>
        {user
          ? <Link className="mobile-nav__row" to={user.role === 'Admin' ? '/admin' : '/portal'}>{user.role === 'Admin' ? 'Staff area' : 'My account'}</Link>
          : <Link className="mobile-nav__row" to="/login">Login</Link>}
        <label className="mobile-nav__country">
          Country
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}

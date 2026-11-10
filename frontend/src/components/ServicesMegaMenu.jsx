import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

/**
 * Desktop Services dropdown.
 * Left column: the three services (US / Canada / India Taxation).
 * Right panel: the submenu for whichever country is hovered or focused.
 */
export default function ServicesMegaMenu({ onNavigate }) {
  const { menu, menuStatus, reloadMenu, country, openEnquiry } = useSite();
  const [active, setActive] = useState(country);

  useEffect(() => { setActive(country); }, [country]);

  if (menuStatus === 'loading') return <div className="mega mega--status">Loading services…</div>;
  if (menuStatus === 'error' || menu.length === 0) {
    return (
      <div className="mega mega--status">
        Services are unavailable right now.{' '}
        <button type="button" className="link-btn" onClick={reloadMenu}>Try again</button>
      </div>
    );
  }

  const current = menu.find((c) => c.code === active) || menu[0];

  return (
    <div className="mega" role="menu" aria-label="Services">
      <ul className="mega__countries">
        {menu.map((c) => (
          <li key={c.code}>
            <Link
              to={`/services/${c.code}`}
              role="menuitem"
              className={`mega__country ${c.code === current.code ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(c.code)}
              onFocus={() => setActive(c.code)}
              onClick={onNavigate}
              aria-haspopup="true"
              aria-expanded={c.code === current.code}
            >
              <span className={`flag flag--${c.code}`}>{c.code.toUpperCase()}</span>
              <span>
                <strong>{c.menuTitle}</strong>
                <small>{c.tagline}</small>
              </span>
              <span className="mega__chev" aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mega__panel" key={current.code}>
        <div className="mega__panel-head">
          <p className="eyebrow">Services / {current.name}</p>
          <Link to={`/services/${current.code}`} className="mega__all" onClick={onNavigate}>
            All {current.menuTitle} services →
          </Link>
        </div>
        <ul className="mega__services">
          {current.services.map((s) => (
            <li key={s.slug}>
              <Link to={`/services/${current.code}/${s.slug}`} role="menuitem" onClick={onNavigate}>
                <strong>{s.title}</strong>
                <small>{s.shortDescription}</small>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mega__foot">
          <span>Not sure which service fits?</span>
          <button
            type="button"
            className="btn btn--green btn--sm"
            onClick={() => { onNavigate?.(); openEnquiry({ country: current.code }); }}
          >
            Request a free consultation
          </button>
        </div>
      </div>
    </div>
  );
}

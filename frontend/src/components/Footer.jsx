import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useSite } from '../context/SiteContext';

export default function Footer() {
  const { menu } = useSite();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Logo light />
          <p className="site-footer__about">Professional tax solutions for individuals, NRIs and businesses across the United States, Canada and India.</p>
        </div>
        {menu.map((c) => (
          <div key={c.code}>
            <h4>{c.menuTitle}</h4>
            <ul>
              {c.services.slice(0, 5).map((s) => (
                <li key={s.slug}><Link to={`/services/${c.code}/${s.slug}`}>{s.title}</Link></li>
              ))}
              <li><Link to={`/services/${c.code}`}>All services →</Link></li>
            </ul>
          </div>
        ))}
        <div>
          <h4>Company</h4>
          <ul>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/login">Client login</Link></li>
          </ul>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <span>© {new Date().getFullYear()} VedaTax. All rights reserved.</span>
        <span>Simplify • Plan • Grow</span>
      </div>
    </footer>
  );
}

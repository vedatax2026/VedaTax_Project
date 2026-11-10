import { Link } from 'react-router-dom';
import Modal from './Modal';
import { useSite } from '../context/SiteContext';

/** Pop-up shown when a service card (US / Canada / India Taxation) is clicked: lists its submenu. */
export default function ServicePopup({ code, onClose }) {
  const { countryInfo, openEnquiry } = useSite();
  const c = code ? countryInfo(code) : null;

  return (
    <Modal open={!!c} onClose={onClose} labelledBy="service-popup-title" width={760}>
      {c && (
        <div className="service-popup">
          <div className="service-popup__head">
            <span className={`flag flag--${c.code} flag--lg`}>{c.code.toUpperCase()}</span>
            <div>
              <p className="eyebrow">Services / {c.name}</p>
              <h2 id="service-popup-title">{c.menuTitle}</h2>
              <p className="muted">{c.tagline}</p>
            </div>
          </div>
          <ul className="service-popup__list">
            {c.services.map((s) => (
              <li key={s.slug}>
                <Link to={`/services/${c.code}/${s.slug}`} onClick={onClose}>
                  <strong>{s.title}</strong>
                  <small>{s.shortDescription}</small>
                  <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="service-popup__actions">
            <Link to={`/services/${c.code}`} className="btn btn--outline" onClick={onClose}>All {c.menuTitle} services</Link>
            <button type="button" className="btn btn--green" onClick={() => { onClose(); openEnquiry({ country: c.code }); }}>
              Request a free consultation
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

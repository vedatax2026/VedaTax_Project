import { Link, Navigate, useParams } from 'react-router-dom';
import { useSite, COUNTRY_CODES } from '../context/SiteContext';
import { api } from '../api/client';
import useFetch from '../api/useFetch';
import { formatPrice } from '../utils';

/** /services → redirects to the selected country; /services/:country lists that country's services. */
export default function ServicesIndex() {
  const { country: param } = useParams();
  const { country, menu, openEnquiry } = useSite();
  const code = param?.toLowerCase();
  const { data, error, loading } = useFetch(() => (code ? api.country(code) : Promise.resolve(null)), [code]);

  if (!code) return <Navigate to={`/services/${country}`} replace />;
  if (!COUNTRY_CODES.includes(code)) return <Navigate to="/services" replace />;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>Services</span></nav>
          <p className="eyebrow">Services / {data?.name || ''}</p>
          <h1>{data?.menuTitle || 'Services'}</h1>
          {data && <p className="page-hero__lead">{data.heroSubtitle}</p>}
          <div className="tabs tabs--left">
            {menu.map((c) => (
              <Link key={c.code} to={`/services/${c.code}`} className={`tab ${c.code === code ? 'is-active' : ''}`}>{c.menuTitle}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading && <p className="muted">Loading…</p>}
          {error && <p className="form__error">Could not load services. {error.message}</p>}
          {data && (
            <div className="grid-3">
              {data.services.map((s, i) => (
                <article key={s.slug} className="tile tile--static">
                  <span className="tile__num">{String(i + 1).padStart(2, '0')} / {data.name}</span>
                  <h3>{s.title}</h3>
                  <p>{s.shortDescription}</p>
                  <ul className="chips">{s.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
                  <p className="tile__price">From <strong>{formatPrice(s.startingPrice, data.currency)}</strong> <small>{s.priceUnit}</small></p>
                  <div className="tile__actions">
                    <Link to={`/services/${data.code}/${s.slug}`} className="link-arrow">Explore service →</Link>
                    <button type="button" className="link-btn" onClick={() => openEnquiry({ country: data.code, service: s.slug })}>Enquire</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

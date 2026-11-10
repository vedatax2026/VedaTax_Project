import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { api } from '../api/client';
import useFetch from '../api/useFetch';
import { formatPrice } from '../utils';

export default function Pricing() {
  const { country, setCountry, menu, openEnquiry } = useSite();
  const { data, loading, error } = useFetch(() => api.country(country), [country]);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">Pricing</p>
          <h1>Clear starting prices</h1>
          <p className="page-hero__lead">Starting fees for each service. Your final scope and preparation fee are confirmed in a written quotation before work begins.</p>
          <div className="tabs tabs--left" role="tablist">
            {menu.map((c) => (
              <button key={c.code} role="tab" aria-selected={c.code === country}
                className={`tab ${c.code === country ? 'is-active' : ''}`} onClick={() => setCountry(c.code)}>
                {c.menuTitle}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {loading && <p className="muted">Loading…</p>}
          {error && <p className="form__error">Could not load prices. {error.message}</p>}
          {data && (
            <div className="price-table" role="table" aria-label={`${data.menuTitle} prices`}>
              {data.services.map((s) => (
                <div key={s.slug} className="price-row" role="row">
                  <div role="cell">
                    <Link to={`/services/${data.code}/${s.slug}`}><strong>{s.title}</strong></Link>
                    <small>{s.shortDescription}</small>
                  </div>
                  <div role="cell" className="price-row__price">
                    <span>From</span> <strong>{formatPrice(s.startingPrice, data.currency)}</strong>
                    <small>{s.priceUnit}</small>
                  </div>
                  <div role="cell">
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => openEnquiry({ country: data.code, service: s.slug })}>Get a quote</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

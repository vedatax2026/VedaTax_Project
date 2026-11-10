import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { api } from '../api/client';
import useFetch from '../api/useFetch';
import { formatPrice } from '../utils';
import NotFound from './NotFound';

export default function ServiceDetail() {
  const { country, slug } = useParams();
  const { openEnquiry } = useSite();
  const { data: s, error, loading } = useFetch(() => api.service(country, slug), [country, slug]);
  const [openFaq, setOpenFaq] = useState(0);

  if (loading) return <div className="container section"><p className="muted">Loading…</p></div>;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container section"><p className="form__error">Could not load this service. {error.message}</p></div>;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link> / <Link to={`/services/${s.countryCode}`}>{s.menuTitle}</Link> / <span>{s.title}</span>
          </nav>
          <p className="eyebrow">Services / {s.countryName}</p>
          <h1>{s.pageTitle}</h1>
          <p className="page-hero__lead">{s.shortDescription}</p>
        </div>
      </section>

      <section className="section">
        <div className="container detail">
          <article className="detail__body">
            <h2>Overview</h2>
            <p>{s.overview}</p>

            <ul className="chips">{s.highlights.map((h) => <li key={h}>{h}</li>)}</ul>

            <h2>What to prepare</h2>
            <ul className="checklist">{s.whatToPrepare.map((w) => <li key={w}>{w}</li>)}</ul>

            <h2>How the engagement works</h2>
            <p>{s.howItWorks}</p>

            {s.faqs.length > 0 && (
              <>
                <h2>{s.countryName} filing questions</h2>
                <div className="faq">
                  {s.faqs.map((f, i) => (
                    <div key={f.question} className={`faq__item ${openFaq === i ? 'is-open' : ''}`}>
                      <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                        {f.question}<span aria-hidden="true">{openFaq === i ? '−' : '+'}</span>
                      </button>
                      {openFaq === i && <p>{f.answer}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {s.officialResourceUrl && (
              <>
                <h3>Official resources</h3>
                <a href={s.officialResourceUrl} target="_blank" rel="noopener noreferrer" className="link-arrow">{s.officialResourceName} ↗</a>
              </>
            )}
          </article>

          <aside className="detail__aside">
            <div className="next-step">
              <h3>Your next step</h3>
              <p className="muted">Share your situation. The team confirms your scope and quotation before work.</p>
              <p className="next-step__price">From <strong>{formatPrice(s.startingPrice, s.currency)}</strong><br /><small>{s.priceUnit}</small></p>
              <button type="button" className="btn btn--green btn--block" onClick={() => openEnquiry({ country: s.countryCode, service: s.slug })}>
                Free consultation
              </button>
              <ul className="next-step__links">
                <li><Link to={`/pricing?country=${s.countryCode}`}>Review preparation prices →</Link></li>
                <li><Link to="/login">Existing client? Sign in →</Link></li>
              </ul>
            </div>

            {s.relatedServices.length > 0 && (
              <div className="related">
                <h4>More {s.menuTitle} services</h4>
                <ul>
                  {s.relatedServices.map((r) => (
                    <li key={r.slug}><Link to={`/services/${s.countryCode}/${r.slug}`}>{r.title}</Link></li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}

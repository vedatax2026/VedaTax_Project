import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { api } from '../api/client';
import useFetch from '../api/useFetch';
import ServicePopup from '../components/ServicePopup';

const HERO_PHOTOS = [
  '/tax-documents.jpg',
  '/tax-planning.jpg',
  '/income-review.jpg',
];

const STEPS = [
  ['Tell us about your situation', 'Income, residency and the services you need.'],
  ['Review your written quotation', 'Confirm the scope and preparation fee before work.'],
  ['Share documents securely', 'Follow your checklist and ask the team questions.'],
  ['Review your return before filing', 'Your adviser explains the next step and filing status.'],
];

export default function Home() {
  const { country, setCountry, menu, menuStatus, openEnquiry } = useSite();
  const { data: info } = useFetch(() => api.country(country), [country]);
  const [popup, setPopup] = useState(null);
  const [seenCards, setSeenCards] = useState([]);
  const serviceCardsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < .15) return;
        const code = entry.target.dataset.country;
        setSeenCards((seen) => seen.includes(code) ? seen : [...seen, code]);
        observer.unobserve(entry.target);
      });
    }, { threshold: .15 });
    serviceCardsRef.current.querySelectorAll('.service-card').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [menu]);

  return (
    <>
      <section className="hero" aria-label="Tax services">
        <div className="hero__photos" aria-hidden="true">
          {HERO_PHOTOS.map((src) => (
            <img key={src} src={src} alt="" className="hero__photo" />
          ))}
        </div>
        <div className="container hero__inner">
          {info && <p className="eyebrow eyebrow--light">{info.heroEyebrow}</p>}
          <h1>Professional Tax Solutions<br />for Your <span className="hero__accent">Growth</span></h1>
          <p className="hero__sub">{info?.heroSubtitle || 'US, Canada and India taxation — prepared accurately, explained clearly.'}</p>
          <div className="hero__ctas">
            <button type="button" className="btn btn--green btn--lg" onClick={() => openEnquiry({ country })}>Get Started</button>
            <Link to="/pricing" className="btn btn--ghost-light btn--lg">Explore filing prices</Link>
          </div>
        </div>
        <div className="hero__strip">
          <div className="container hero__strip-inner">
            <span>Preparation fee agreed before work</span>
            <span>Secure document sharing</span>
            <span>US–India, US–Canada & India–Canada support</span>
          </div>
        </div>
      </section>

      <section className="section home-services" id="services">
        <div className="container">
          <p className="eyebrow">Our services</p>
          <h2 className="section__title">Taxation services across three countries</h2>
          <p className="section__lead">Choose a country to see its services, or open a card for the full list.</p>

          {menuStatus === 'error' && <p className="form__error">Services could not be loaded. Please make sure the API is running.</p>}

          <div className="service-cards" ref={serviceCardsRef}>
            {menu.map((c) => (
              <article key={c.code} data-country={c.code}
                className={`service-card ${c.code === country ? 'is-selected' : ''}${seenCards.includes(c.code) ? ' has-entered' : ''}`}>
                <div className="service-card__top">
                  <img className="service-card__flag" src={`/flag-${c.code}.svg`} alt={`${c.menuTitle} flag`} width="64" height="44" />
                </div>
                <h3>{c.menuTitle}</h3>
                <p>{c.tagline}</p>
                <ul className="service-card__subs">
                  {c.services.slice(0, 4).map((s) => <li key={s.slug}>{s.title}</li>)}
                  {c.services.length > 4 && <li className="muted">+ {c.services.length - 4} more</li>}
                </ul>
                <div className="service-card__actions">
                  <button type="button" className="btn btn--navy btn--sm" onClick={() => setPopup(c.code)}>View services</button>
                  <Link to={`/services/${c.code}`} className="link-arrow">Explore →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Country-specific service grid, driven by the country selector */}
      {info && (
        <section className="section section--tint service-finder">
          <div className="container">
            <div className="section__head-row">
              <div>
                <p className="eyebrow">Find the right service</p>
                <h2 className="section__title">Start with your situation.</h2>
                <p className="section__lead">Explore {info.menuTitle} services.</p>
              </div>
              <div className="tabs" role="tablist" aria-label="Country">
                {menu.map((c) => (
                  <button key={c.code} role="tab" aria-selected={c.code === country}
                    className={`tab ${c.code === country ? 'is-active' : ''}`} onClick={() => setCountry(c.code)}>
                    <img src={`/flag-${c.code}.svg`} alt="" width="24" height="16" />
                    {c.menuTitle}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid-3">
              {info.services.map((s, i) => (
                <Link key={s.slug} to={`/services/${info.code}/${s.slug}`} className="tile">
                  <span className="tile__num">{String(i + 1).padStart(2, '0')} / {info.name}</span>
                  <h3>{s.title}</h3>
                  <p>{s.shortDescription}</p>
                  <span className="link-arrow">Explore service →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section home-process">
        <div className="container">
          <p className="eyebrow">What to expect</p>
          <h2 className="section__title">From first question to filing day.</h2>
          <ol className="steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="steps__num">0{i + 1}</span><h3>{t}</h3><p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--navy home-cross-border">
        <div className="container cross-border">
          <div>
            <p className="eyebrow eyebrow--light">NRI & cross-border filing</p>
            <h2>One team for returns in more than one country</h2>
            <p>Living in the US or Canada with income in India? Moved between countries this year? We coordinate the returns in each country so foreign tax credits, treaty positions and residency dates line up.</p>
          </div>
          <ul className="cross-border__list">
            <li><Link to="/services/in/nri-tax-dtaa">US–India & India–Canada NRI filing →</Link></li>
            <li><Link to="/services/ca/us-canada-cross-border">US–Canada cross-border →</Link></li>
            <li><Link to="/services/us/fbar-fatca">FBAR & FATCA foreign accounts →</Link></li>
          </ul>
        </div>
      </section>

      <section className="section home-cta">
        <div className="container cta-band">
          <div>
            <h2>Let’s make the next step clear.</h2>
            <p className="muted">Call, email or book a conversation with the team.</p>
          </div>
          <div className="cta-band__actions">
            <button type="button" className="btn btn--green btn--lg" onClick={() => openEnquiry({ country })}>Request a free consultation</button>
            <Link to="/contact" className="btn btn--outline btn--lg">Contact options</Link>
          </div>
        </div>
      </section>

      <ServicePopup code={popup} onClose={() => setPopup(null)} />
    </>
  );
}

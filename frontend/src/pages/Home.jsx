import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { api } from '../api/client';
import useFetch from '../api/useFetch';
import ServicePopup from '../components/ServicePopup';

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
  const [activeStep, setActiveStep] = useState(0);
  const [activeService, setActiveService] = useState(0);
  const serviceIndex = activeService % Math.max(menu.length, 1);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const stepsPlaying = !reducedMotion;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motion.matches);
    motion.addEventListener('change', updateMotion);
    return () => motion.removeEventListener('change', updateMotion);
  }, []);

  useEffect(() => {
    if (!stepsPlaying) return undefined;
    const timer = window.setTimeout(() => setActiveStep((step) => (step + 1) % STEPS.length), 4000);
    return () => window.clearTimeout(timer);
  }, [stepsPlaying, activeStep]);

  useEffect(() => {
    if (reducedMotion || menu.length < 2) return undefined;
    const timer = window.setTimeout(() => setActiveService((index) => (index + 1) % menu.length), 4000);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, activeService, menu.length]);

  return (
    <>
      {/* Hero – keeps the existing VedaTax hero (headline + Get Started) */}
      <section className="hero">
        <div className="hero__background" aria-hidden="true">
          <div className="hero__image hero__image--advice" />
          <div className="hero__image hero__image--planning" />
        </div>
        <div className="container hero__inner">
          {info && <p className="eyebrow eyebrow--light">{info.heroEyebrow}</p>}
          <h1>Professional Tax Solutions<br />for Your Growth</h1>
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

      {/* Services – only US, Canada and India Taxation */}
      <section className="section" id="services">
        <div className="container">
          <p className="eyebrow">Our services</p>
          <h2 className="section__title">Taxation services across three countries</h2>
          <p className="section__lead">Choose a country to see its services, or open a card for the full list.</p>

          {menuStatus === 'error' && <p className="form__error">Services could not be loaded. Please make sure the API is running.</p>}

          <div className="service-cards service-cards--rotating">
            {menu.map((c, i) => (
              <article key={c.code} aria-hidden={i !== serviceIndex}
                className={`service-card service-card--${c.code} ${i === serviceIndex ? 'is-active' : ''} ${c.code === country ? 'is-selected' : ''}`}>
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
                  <button type="button" className="btn btn--navy btn--sm" tabIndex={i === serviceIndex ? 0 : -1} onClick={() => setPopup(c.code)}>View services</button>
                  <Link to={`/services/${c.code}`} className="link-arrow" tabIndex={i === serviceIndex ? 0 : -1}>Explore →</Link>
                </div>
              </article>
            ))}
          </div>
          {menu.length > 1 && (
            <div className="service-cards__controls" role="group" aria-label="Choose a service card">
              {menu.map((c, i) => (
                <button key={c.code} type="button" className={`tab ${i === serviceIndex ? 'is-active' : ''}`}
                  aria-pressed={i === serviceIndex} onClick={() => setActiveService(i)}>
                  <img src={`/flag-${c.code}.svg`} alt="" width="24" height="16" />
                  {c.menuTitle}
                </button>
              ))}
            </div>
          )}
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

      <section className="section">
        <div className="container">
          <p className="eyebrow">What to expect</p>
          <h2 className="section__title">From first question to filing day.</h2>
          <ol className={`steps${stepsPlaying ? ' steps--playing' : ''}`} aria-live="off">
            {STEPS.map(([t, d], i) => (
              <li key={t} className={i === activeStep ? 'is-active' : ''} aria-hidden={!reducedMotion && i !== activeStep}>
                <span className="steps__num">0{i + 1}</span><h3>{t}</h3><p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--navy">
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

      <section className="section">
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

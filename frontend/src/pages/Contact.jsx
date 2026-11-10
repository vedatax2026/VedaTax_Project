import { useSite } from '../context/SiteContext';

// Placeholder contact details – replace with VedaTax's real numbers and addresses.
const CONTACTS = [
  { code: 'us', label: 'United States', phone: '+1 (000) 000-0000', email: 'us@vedatax.com' },
  { code: 'ca', label: 'Canada', phone: '+1 (000) 000-0000', email: 'canada@vedatax.com' },
  { code: 'in', label: 'India', phone: '+91 00000 00000', email: 'india@vedatax.com' },
];

export default function Contact() {
  const { openEnquiry } = useSite();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">Contact</p>
          <h1>Let’s make the next step clear.</h1>
          <p className="page-hero__lead">Call, email or request a free consultation with the team for your country.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid-3">
          {CONTACTS.map((c) => (
            <article key={c.code} className="tile tile--static">
              <span className={`flag flag--${c.code} flag--lg`}>{c.code.toUpperCase()}</span>
              <h3>{c.label}</h3>
              <p><a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`}>{c.phone}</a><br /><a href={`mailto:${c.email}`}>{c.email}</a></p>
              <button type="button" className="btn btn--navy btn--sm" onClick={() => openEnquiry({ country: c.code })}>Request a consultation</button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

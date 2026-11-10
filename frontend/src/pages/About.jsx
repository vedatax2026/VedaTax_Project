import { useSite } from '../context/SiteContext';

const VALUES = [
  ['Simplify', 'We explain what applies to you in plain language and keep the paperwork to what is actually needed.'],
  ['Plan', 'A written scope and quotation before any work, and planning advice that looks beyond this year’s return.'],
  ['Grow', 'Year-round support as your income, family or business grows across borders.'],
];

export default function About() {
  const { openEnquiry, country } = useSite();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">About VedaTax</p>
          <h1>Tax support for people whose lives cross borders</h1>
          <p className="page-hero__lead">VedaTax provides US, Canada and India taxation services for individuals, NRIs and businesses — one team that understands how the three systems interact.</p>
        </div>
      </section>
      <section className="section">
        <div className="container grid-3">
          {VALUES.map(([t, d]) => (
            <article key={t} className="tile tile--static"><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
        <div className="container" style={{ marginTop: 40 }}>
          <button type="button" className="btn btn--green btn--lg" onClick={() => openEnquiry({ country })}>Talk to our team</button>
        </div>
      </section>
    </>
  );
}

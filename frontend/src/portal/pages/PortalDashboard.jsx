import { Link } from 'react-router-dom';
import { portal, api } from '../../api/client';
import useFetch from '../../api/useFetch';
import { useSite } from '../../context/SiteContext';
import { STAGE_LABELS } from '../PortalContext';
import { RequireFiling, formatLongDate, formatMoney, formatDate } from '../shared';
import { IconAlert, IconGift, IconUsers, IconUserCheck, IconCheck, IconCoin } from '../icons';

const NEXT_STEP = {
  Registered: { text: 'Download the tax organizer, fill it in and upload it with your tax documents.', to: '/portal/tax-organizer', cta: 'Open tax organizer' },
  DocumentsUploaded: { text: 'Thanks. Your documents are in. Add anything you missed while we start preparing your return.', to: '/portal/documents', cta: 'View documents' },
  PreparationPending: { text: 'Your consultant is preparing your return. We\'ll share a draft for review under Documents.', to: '/portal/documents', cta: 'View documents' },
  ReviewCompleted: { text: 'Your return has been reviewed. Your invoice will be ready to pay shortly.', to: '/portal/invoice', cta: 'View invoice' },
  InvoicePaid: { text: 'Payment received. We\'re filing your return now.', to: '/portal/invoice', cta: 'View invoice' },
  Completed: { text: 'Your return has been filed. Copies are available under Documents → Downloads.', to: '/portal/documents', cta: 'Get your copies' },
};

export default function PortalDashboard() {
  return <RequireFiling>{(filing) => <Overview filing={filing} />}</RequireFiling>;
}

function Overview({ filing }) {
  const { data, loading, error } = useFetch(() => portal.overview(filing.id), [filing.id, filing.status]);
  const enquiries = useFetch(() => api.myEnquiries(), []);
  const { menu } = useSite();

  if (loading && !data) return <p className="muted">Loading…</p>;
  if (error) return <p className="form__error">{error.message}</p>;

  const { stages, referrals } = data;
  const idx = data.filing.statusIndex;
  const pct = Math.round(((idx + 1) / stages.length) * 100);
  const next = NEXT_STEP[data.filing.status];
  const bonus = referrals.bonus.length
    ? referrals.bonus.map((b) => formatMoney(b.amount, b.currency)).join(' + ')
    : formatMoney(0, data.filing.countryCode === 'in' ? 'INR' : data.filing.countryCode === 'ca' ? 'CAD' : 'USD');

  const serviceTitle = (code, slug) =>
    menu.find((c) => c.code === code)?.services.find((s) => s.slug === slug)?.title || 'General enquiry';

  return (
    <>
      <div className={`p-alert ${data.daysToDue < 0 ? 'p-alert--late' : ''}`} role="status">
        <IconAlert size={20} />
        <div>
          <strong>{data.daysToDue < 0 ? 'Deadline passed' : 'Alert!'}</strong>
          {data.daysToDue >= 0 ? (
            <p>The last date to file your {data.filing.yearLabel} {data.filing.countryName} return with the {data.authority} is{' '}
              <b>{formatLongDate(data.dueDate)}</b> ({data.daysToDue === 0 ? 'today' : `${data.daysToDue} day${data.daysToDue === 1 ? '' : 's'} left`}).</p>
          ) : (
            <p>The {data.authority} due date for {data.filing.yearLabel} returns was <b>{formatLongDate(data.dueDate)}</b>.
              Upload your documents and we'll file as soon as possible; late-filing penalties or interest may apply.</p>
          )}
        </div>
      </div>

      <section className="p-card">
        <div className="status-head">
          <h2>Your file status: <span className="status-now">{STAGE_LABELS[data.filing.status]}</span></h2>
          <span className="status-pct">{pct}%</span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="File progress">
          <div className="progress__bar" style={{ width: `${pct}%` }} />
        </div>
        <ol className="stages">
          {stages.map((s, i) => (
            <li key={s} className={i < idx ? 'is-done' : i === idx ? 'is-current' : ''}>
              <span className="stages__dot">{i < idx ? <IconCheck size={12} /> : i + 1}</span>
              {STAGE_LABELS[s]}
            </li>
          ))}
        </ol>
        {next && (
          <div className="p-next">
            <p><strong>Next step:</strong> {next.text}</p>
            <Link to={next.to} className="btn btn--green btn--sm">{next.cta}</Link>
          </div>
        )}
      </section>

      <div className="stat-grid">
        <Link to="/portal/refer" className="stat stat--link">
          <div><p className="stat__label">Refer &amp;</p><p className="stat__value">Earn</p></div>
          <span className="stat__icon stat__icon--violet"><IconGift /></span>
        </Link>
        <Link to="/portal/referrals" className="stat stat--link">
          <div><p className="stat__label">My Referrals</p><p className="stat__value">{referrals.total}</p></div>
          <span className="stat__icon stat__icon--red"><IconUsers /></span>
        </Link>
        <div className="stat">
          <div><p className="stat__label">Registered</p><p className="stat__value">{referrals.registered}</p></div>
          <span className="stat__icon stat__icon--blue"><IconUserCheck /></span>
        </div>
        <div className="stat">
          <div><p className="stat__label">Paid Referrals</p><p className="stat__value">{referrals.paid}</p></div>
          <span className="stat__icon stat__icon--green"><IconCheck /></span>
        </div>
        <div className="stat">
          <div><p className="stat__label">Referral Bonus</p><p className="stat__value">{bonus}</p></div>
          <span className="stat__icon stat__icon--navy"><IconCoin /></span>
        </div>
      </div>

      {enquiries.data?.length > 0 && (
        <section className="p-card">
          <h2 className="p-card__title">Your consultation requests</h2>
          <div className="p-table-wrap">
            <table className="p-table">
              <thead><tr><th>Service</th><th>Country</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {enquiries.data.map((e) => (
                  <tr key={e.id}>
                    <td>{serviceTitle(e.countryCode, e.serviceSlug)}</td>
                    <td>{e.countryCode.toUpperCase()}</td>
                    <td>{formatDate(e.createdAt)}</td>
                    <td><span className="badge">{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

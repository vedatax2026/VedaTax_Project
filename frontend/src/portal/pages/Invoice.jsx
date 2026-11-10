import { portal } from '../../api/client';
import useFetch from '../../api/useFetch';
import { RequireFiling, PageHead, formatDate, formatMoney } from '../shared';
import { IconPrint } from '../icons';

export default function Invoice() {
  return <RequireFiling>{(filing) => <InvoiceView filing={filing} />}</RequireFiling>;
}

function InvoiceView({ filing }) {
  const { data, loading, error } = useFetch(() => portal.invoice(filing.id), [filing.id]);

  if (loading && !data) return <p className="muted">Loading…</p>;
  if (error) return <p className="form__error">{error.message}</p>;

  const inv = data.invoice;
  const money = (n) => (inv ? formatMoney(n, inv.currency) : '');

  return (
    <section className="p-card invoice">
      <PageHead title="Invoice details">
        {inv ? (
          <>
            <span className={`badge ${inv.status === 'Paid' ? 'badge--green' : 'badge--amber'}`}>{inv.status}</span>
            <button type="button" className="btn btn--outline btn--sm no-print" onClick={() => window.print()}>
              <IconPrint size={16} /> Print / Save PDF
            </button>
          </>
        ) : (
          <span className="badge badge--amber">Invoice not generated yet</span>
        )}
      </PageHead>

      <div className="invoice__sheet">
        <div className="invoice__top">
          <div className="invoice__brand">
            <img src="/vedatax-mark.jpeg" alt="" />
            <div>
              <p className="invoice__word"><span>VEDA</span><span>TAX</span></p>
              <p className="invoice__tag">Simplify • Plan • Grow</p>
            </div>
          </div>
          <dl className="invoice__meta">
            <div><dt>Invoice #</dt><dd>{inv?.invoiceNumber || '—'}</dd></div>
            <div><dt>Invoice date</dt><dd>{inv ? formatDate(inv.invoiceDate) : '—'}</dd></div>
            <div><dt>Return</dt><dd>{data.countryName} · {data.yearLabel}</dd></div>
          </dl>
        </div>

        <div className="invoice__parties">
          <div>
            <p className="invoice__label">From</p>
            <strong>{data.company.name}</strong>
            {data.company.addressLines.map((l) => <span key={l}>{l}</span>)}
            {data.company.email && <span>{data.company.email}</span>}
          </div>
          <div className="right">
            <p className="invoice__label">Invoice to</p>
            <strong>{data.clientName}</strong>
            <span>{data.clientEmail}</span>
            {data.clientPhone && <span>{data.clientPhone}</span>}
          </div>
        </div>

        <table className="invoice__table">
          <thead><tr><th>Item</th><th className="right">Price</th></tr></thead>
          <tbody>
            {inv ? inv.items.map((it, i) => (
              <tr key={i}><td>{it.description}</td><td className="right">{money(it.amount)}</td></tr>
            )) : (
              <tr><td colSpan={2} className="muted">Your invoice will appear here once your consultant has reviewed your return.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr><td>Total amount</td><td className="right">{inv ? money(inv.subtotal) : '—'}</td></tr>
            <tr><td>Referral bonus (−)</td><td className="right">{inv ? money(inv.referralBonus) : '—'}</td></tr>
            <tr className="invoice__final"><td>Final amount</td><td className="right">{inv ? money(inv.total) : '—'}</td></tr>
          </tfoot>
        </table>

        {inv?.status === 'Paid' && inv.paidAt && <p className="invoice__paid">Paid on {formatDate(inv.paidAt)}. Thank you!</p>}
        {inv?.status === 'Unpaid' && (
          <p className="muted invoice__note">Your consultant will share payment options with you. Referral bonuses you've earned are deducted automatically.</p>
        )}
      </div>
    </section>
  );
}

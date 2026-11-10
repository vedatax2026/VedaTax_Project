import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { admin } from '../../api/client';
import useFetch from '../../api/useFetch';
import { STAGE_LABELS, COUNTRY_SHORT } from '../../portal/PortalContext';
import { formatDate, formatLongDate, formatBytes, formatMoney } from '../../portal/shared';
import { IconDownload, IconTrash, IconPlus, IconCheck, IconUpload } from '../../portal/icons';
import { STAGE_BADGE } from './AdminFilings';

const CATEGORY = {
  client: { label: 'Client upload', badge: 'badge' },
  expert: { label: 'For review', badge: 'badge badge--blue' },
  download: { label: 'Download', badge: 'badge badge--green' },
};

const TYPE_SUGGESTIONS = {
  expert: ['Draft return for review', 'Engagement letter', 'Information request', 'Tax computation'],
  download: ['Filed return copy', 'E-file acknowledgement', 'Refund / assessment notice', 'Final tax computation'],
};

export default function AdminFilingDetail() {
  const { id } = useParams();
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useFetch(() => admin.filing(id), [id, version]);
  const refresh = () => setVersion((v) => v + 1);

  if (loading && !data) return <p className="muted">Loading…</p>;
  if (error) return <p className="form__error">{error.status === 404 ? 'Filing not found.' : error.message}</p>;

  const { filing, client } = data;

  return (
    <>
      <div className="admin-detail-head">
        <Link to="/admin" className="admin-back">← All filings</Link>
        <div className="admin-detail-head__row">
          <div>
            <h1 className="p-title">{client.fullName}</h1>
            <p className="muted">
              <span className={`flag flag--sm flag--${filing.countryCode}`}>{filing.countryCode.toUpperCase()}</span>{' '}
              {COUNTRY_SHORT[filing.countryCode]} · {filing.yearLabel} · due {formatLongDate(data.dueDate)} · filing #{filing.id}
            </p>
          </div>
          <span className={STAGE_BADGE[filing.status]}>{STAGE_LABELS[filing.status]}</span>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-grid__side">
          <StatusCard data={data} onSaved={refresh} />
          <section className="p-card">
            <h2 className="p-card__title">Client</h2>
            <dl className="admin-dl">
              <div><dt>Email</dt><dd><a href={`mailto:${client.email}`}>{client.email}</a></dd></div>
              <div><dt>Phone</dt><dd>{client.phone ? <a href={`tel:${client.phone.replace(/\s/g, '')}`}>{client.phone}</a> : '—'}</dd></div>
              <div><dt>Alt. phone</dt><dd>{client.alternatePhone || '—'}</dd></div>
              <div><dt>Client since</dt><dd>{formatDate(client.createdAt)}</dd></div>
              <div><dt>Referral credit</dt><dd>{formatMoney(data.availableReferralBonus, data.currency)} usable on this invoice</dd></div>
            </dl>
          </section>
        </div>
        <div className="admin-grid__main">
          <DocumentsCard data={data} onChanged={refresh} />
          <InvoiceCard data={data} onSaved={refresh} />
        </div>
      </div>
    </>
  );
}

function StatusCard({ data, onSaved }) {
  const { filing } = data;
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  useEffect(() => {
    setForm({
      status: filing.status,
      consultantName: filing.consultant?.name || '',
      consultantEmail: filing.consultant?.email || '',
      consultantPhone: filing.consultant?.phone || '',
    });
  }, [filing]);

  if (!form) return null;
  const set = (k) => (e) => { setMsg({ ok: '', err: '' }); setForm((f) => ({ ...f, [k]: e.target.value })); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ ok: '', err: '' });
    try {
      await admin.updateFiling(filing.id, {
        status: form.status,
        consultantName: form.consultantName.trim(),
        consultantEmail: form.consultantEmail.trim() || null,
        consultantPhone: form.consultantPhone.trim(),
      });
      setMsg({ ok: 'Saved. The client sees this straight away.', err: '' });
      onSaved();
    } catch (err) {
      setMsg({ ok: '', err: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p-card">
      <h2 className="p-card__title">Status &amp; consultant</h2>
      <form className="form" onSubmit={submit}>
        <label>File status
          <select value={form.status} onChange={set('status')}>
            {data.stages.map((s, i) => <option key={s} value={s}>{i + 1}. {STAGE_LABELS[s]}</option>)}
          </select>
        </label>
        <label>Consultant name
          <input value={form.consultantName} onChange={set('consultantName')} placeholder="Shown to the client in the sidebar" />
        </label>
        <label>Consultant email
          <input type="email" value={form.consultantEmail} onChange={set('consultantEmail')} />
        </label>
        <label>Consultant phone
          <input type="tel" value={form.consultantPhone} onChange={set('consultantPhone')} />
        </label>
        {msg.err && <p className="form__error" role="alert">{msg.err}</p>}
        {msg.ok && <p className="success-line" role="status"><IconCheck size={16} /> {msg.ok}</p>}
        <button type="submit" className="btn btn--navy btn--block" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </section>
  );
}

function DocumentsCard({ data, onChanged }) {
  const [category, setCategory] = useState('expert');
  const [type, setType] = useState('');
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const fileRef = useRef();

  const share = async (e) => {
    e.preventDefault();
    if (!file) { setErr('Choose a file to share.'); return; }
    setBusy(true);
    setErr('');
    setOk('');
    try {
      await admin.shareDocument(data.filing.id, { category, documentType: type.trim(), file, comments: comments.trim() });
      setOk(`${file.name} shared under ${category === 'expert' ? '"From VedaTax"' : '"Downloads"'}.`);
      setType(''); setFile(null); setComments('');
      if (fileRef.current) fileRef.current.value = '';
      onChanged();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const download = async (d) => {
    setErr('');
    setBusyId(d.id);
    try { await admin.downloadDocument(d); } catch (ex) { setErr(ex.message); } finally { setBusyId(null); }
  };

  const remove = async (d) => {
    if (!window.confirm(`Remove "${d.fileName}" from the client's portal? This can't be undone.`)) return;
    setErr('');
    setBusyId(d.id);
    try { await admin.deleteDocument(d.id); onChanged(); } catch (ex) { setErr(ex.message); } finally { setBusyId(null); }
  };

  return (
    <section className="p-card">
      <h2 className="p-card__title">Documents</h2>
      {data.documents.length === 0 ? (
        <p className="empty">No documents yet.</p>
      ) : (
        <div className="p-table-wrap">
          <table className="p-table">
            <thead><tr><th>Type</th><th>File</th><th>Shared as</th><th>Date</th><th className="right">Actions</th></tr></thead>
            <tbody>
              {data.documents.map((d) => (
                <tr key={d.id}>
                  <td data-label="Type">{d.documentTypeLabel}{d.comments && <small className="muted admin-comment">“{d.comments}”</small>}</td>
                  <td data-label="File"><span className="file-name">{d.fileName}</span><small className="muted"> · {formatBytes(d.sizeBytes)}</small></td>
                  <td data-label="Shared as"><span className={CATEGORY[d.category].badge}>{CATEGORY[d.category].label}</span></td>
                  <td data-label="Date" className="nowrap">{formatDate(d.createdAt)}</td>
                  <td className="right actions">
                    <button type="button" className="icon-btn" aria-label={`Download ${d.fileName}`} title="Download" disabled={busyId === d.id} onClick={() => download(d)}><IconDownload size={16} /></button>
                    {d.category !== 'client' && (
                      <button type="button" className="icon-btn icon-btn--danger" aria-label={`Remove ${d.fileName}`} title="Remove" disabled={busyId === d.id} onClick={() => remove(d)}><IconTrash size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="form admin-share" onSubmit={share}>
        <h3>Share a file with the client</h3>
        <div className="form__grid">
          <label>Show under
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="expert">From VedaTax (for review)</option>
              <option value="download">Downloads (final copies)</option>
            </select>
          </label>
          <label>Document name
            <input required list={`types-${category}`} value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Draft return for review" maxLength={80} />
            <datalist id={`types-${category}`}>{TYPE_SUGGESTIONS[category].map((t) => <option key={t} value={t} />)}</datalist>
          </label>
        </div>
        <label>File
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" onChange={(e) => { setErr(''); setFile(e.target.files?.[0] || null); }} />
        </label>
        <label>Note for the client
          <input value={comments} onChange={(e) => setComments(e.target.value)} maxLength={1000} placeholder="Optional" />
        </label>
        {err && <p className="form__error" role="alert">{err}</p>}
        {ok && <p className="success-line" role="status"><IconCheck size={16} /> {ok}</p>}
        <button type="submit" className="btn btn--green" disabled={busy}><IconUpload size={16} /> {busy ? 'Sharing…' : 'Share file'}</button>
      </form>
    </section>
  );
}

const newRow = (description = '', amount = '') => ({ key: Math.random().toString(36).slice(2), description, amount });

function InvoiceCard({ data, onSaved }) {
  const inv = data.invoice;
  const paid = inv?.status === 'Paid';
  const [rows, setRows] = useState([]);
  const [autoBonus, setAutoBonus] = useState(true);
  const [bonus, setBonus] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  useEffect(() => {
    setRows(inv ? inv.items.map((i) => newRow(i.description, String(i.amount))) : [newRow()]);
    setAutoBonus(true);
    setBonus(inv ? String(inv.referralBonus) : '');
  }, [inv]);

  const money = (n) => formatMoney(n, data.currency);
  const subtotal = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  // What the server will apply if left on "automatic": unused credit (incl. what this invoice already uses), capped at the subtotal.
  const autoAmount = Math.min(data.availableReferralBonus, subtotal);
  const appliedBonus = autoBonus ? autoAmount : Math.min(Number(bonus) || 0, subtotal);

  const update = (key, field) => (e) => { setMsg({ ok: '', err: '' }); setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: e.target.value } : r))); };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ ok: '', err: '' });
    try {
      await admin.saveInvoice(data.filing.id, {
        items: rows.map((r) => ({ description: r.description.trim(), amount: Number(r.amount) })),
        referralBonus: autoBonus ? null : Number(bonus) || 0,
      });
      setMsg({ ok: inv ? 'Invoice updated.' : 'Invoice created. The client can see it now.', err: '' });
      onSaved();
    } catch (err) {
      setMsg({ ok: '', err: err.message });
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async () => {
    if (!window.confirm(`Mark invoice ${inv.invoiceNumber} (${money(inv.total)}) as paid? It can't be edited afterwards.`)) return;
    setBusy(true);
    setMsg({ ok: '', err: '' });
    try { await admin.markPaid(data.filing.id); onSaved(); } catch (err) { setMsg({ ok: '', err: err.message }); } finally { setBusy(false); }
  };

  return (
    <section className="p-card">
      <div className="admin-card-head">
        <h2 className="p-card__title">Invoice</h2>
        {inv && (
          <span>
            <span className="muted">{inv.invoiceNumber} · {formatDate(inv.invoiceDate)}</span>{' '}
            <span className={paid ? 'badge badge--green' : 'badge badge--amber'}>{inv.status}</span>
          </span>
        )}
      </div>

      {paid ? (
        <>
          <table className="invoice__table">
            <tbody>{inv.items.map((i, n) => <tr key={n}><td>{i.description}</td><td className="right">{money(i.amount)}</td></tr>)}</tbody>
            <tfoot>
              <tr><td>Total amount</td><td className="right">{money(inv.subtotal)}</td></tr>
              <tr><td>Referral bonus (−)</td><td className="right">{money(inv.referralBonus)}</td></tr>
              <tr className="invoice__final"><td>Final amount</td><td className="right">{money(inv.total)}</td></tr>
            </tfoot>
          </table>
          <p className="invoice__paid">Paid on {formatDate(inv.paidAt)}.</p>
        </>
      ) : (
        <form className="form" onSubmit={save}>
          {!inv && <p className="muted">No invoice yet. Add the services below and save to show it to the client.</p>}
          <div className="admin-items">
            {rows.map((r, i) => (
              <div className="admin-item" key={r.key}>
                <label>Item
                  <input required value={r.description} onChange={update(r.key, 'description')} placeholder={i === 0 ? 'e.g. Federal return (1040)' : ''} maxLength={200} />
                </label>
                <label>Amount ({data.currency})
                  <input required type="number" min="0" step="0.01" value={r.amount} onChange={update(r.key, 'amount')} />
                </label>
                <button type="button" className="icon-btn icon-btn--danger" aria-label={`Remove item ${i + 1}`} disabled={rows.length === 1}
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}><IconTrash size={16} /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn--soft btn--sm" onClick={() => setRows((rs) => [...rs, newRow()])}><IconPlus size={16} /> Add item</button>

          <fieldset className="admin-bonus">
            <legend>Referral bonus</legend>
            <label className="admin-radio">
              <input type="radio" checked={autoBonus} onChange={() => setAutoBonus(true)} />
              Apply the client's available credit ({money(data.availableReferralBonus)})
            </label>
            <label className="admin-radio">
              <input type="radio" checked={!autoBonus} onChange={() => setAutoBonus(false)} />
              Custom amount
              <input type="number" min="0" step="0.01" value={bonus} disabled={autoBonus} onChange={(e) => setBonus(e.target.value)} className="admin-bonus__input" aria-label="Custom referral bonus" />
            </label>
          </fieldset>

          <dl className="admin-totals">
            <div><dt>Total amount</dt><dd>{money(subtotal)}</dd></div>
            <div><dt>Referral bonus (−)</dt><dd>{money(appliedBonus)}</dd></div>
            <div className="admin-totals__final"><dt>Final amount</dt><dd>{money(Math.max(0, subtotal - appliedBonus))}</dd></div>
          </dl>

          {msg.err && <p className="form__error" role="alert">{msg.err}</p>}
          {msg.ok && <p className="success-line" role="status"><IconCheck size={16} /> {msg.ok}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn btn--navy" disabled={busy}>{busy ? 'Saving…' : inv ? 'Update invoice' : 'Create invoice'}</button>
            {inv && <button type="button" className="btn btn--outline-green" disabled={busy} onClick={markPaid}><IconCheck size={16} /> Mark as paid</button>}
          </div>
        </form>
      )}
      {paid && msg.err && <p className="form__error" role="alert">{msg.err}</p>}
    </section>
  );
}

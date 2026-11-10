import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const EMPTY = { fullName: '', email: '', phone: '', serviceSlug: '', message: '' };

/** "Request a free consultation" pop-up — pick US / IN / CA, then a service from that country's submenu. */
export default function EnquiryModal() {
  const { enquiry, closeEnquiry, menu, country } = useSite();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [code, setCode] = useState(country);
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enquiry.open) return;
    setCode(enquiry.country || country);
    setForm({ ...EMPTY, serviceSlug: enquiry.service || '', fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '' });
    setStatus('idle');
    setError('');
  }, [enquiry.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const services = menu.find((c) => c.code === code)?.services || [];
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickCountry = (c) => {
    setCode(c);
    setForm((f) => ({ ...f, serviceSlug: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await api.createEnquiry({
        ...form,
        phone: form.phone || null,
        serviceSlug: form.serviceSlug || null,
        countryCode: code,
      });
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <Modal open={enquiry.open} onClose={closeEnquiry} labelledBy="enquiry-title">
      {status === 'done' ? (
        <div className="enquiry-done">
          <div className="enquiry-done__icon" aria-hidden="true">✓</div>
          <h2 id="enquiry-title">Thank you, {form.fullName.split(' ')[0]}.</h2>
          <p>Your request has been received. A VedaTax adviser will contact you at <strong>{form.email}</strong> to confirm your scope and quotation.</p>
          <button type="button" className="btn btn--navy" onClick={closeEnquiry}>Close</button>
        </div>
      ) : (
        <form onSubmit={submit} className="form">
          <p className="eyebrow">Request a free consultation</p>
          <h2 id="enquiry-title">Tell us about your tax needs</h2>
          <p className="muted">Choose the country for the service you need. If your case involves more than one country, mention both below. Please don’t include identity documents or tax records in this form.</p>

          <fieldset className="country-cards">
            <legend>Country of service *</legend>
            {menu.map((c) => (
              <button
                type="button"
                key={c.code}
                className={`country-card ${code === c.code ? 'is-active' : ''}`}
                aria-pressed={code === c.code}
                onClick={() => pickCountry(c.code)}
              >
                <span className="country-card__code">{c.code.toUpperCase()}</span>
                <strong>{c.name}</strong>
                <small>{c.menuTitle}</small>
              </button>
            ))}
          </fieldset>

          <div className="form__grid">
            <label>Full name *
              <input required minLength={2} value={form.fullName} onChange={update('fullName')} placeholder="Jane Smith" autoComplete="name" />
            </label>
            <label>Email *
              <input required type="email" value={form.email} onChange={update('email')} placeholder="jane@email.com" autoComplete="email" />
            </label>
            <label>Phone
              <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 555 000 0000" autoComplete="tel" />
            </label>
            <label>Service interested in
              <select value={form.serviceSlug} onChange={update('serviceSlug')}>
                <option value="">Select a service…</option>
                {services.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
              </select>
            </label>
          </div>
          <label>How can we help?
            <textarea rows={4} maxLength={2000} value={form.message} onChange={update('message')} placeholder="Briefly describe your situation…" />
          </label>

          {error && <p className="form__error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--navy btn--block" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Submit request →'}
          </button>
          <p className="fine">Your preparation fee is agreed in writing before any work begins.</p>
        </form>
      )}
    </Modal>
  );
}

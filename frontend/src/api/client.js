const BASE = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'vedatax.token';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t) => {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

function authHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function toError(res) {
  let data = null;
  try { const text = await res.text(); data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  const fieldErrors = data?.errors ? Object.values(data.errors).flat() : [];
  const err = new Error(fieldErrors[0] || data?.title || `Request failed (${res.status})`);
  err.status = res.status;
  err.errors = data?.errors;
  return err;
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = authHeaders(body ? { 'Content-Type': 'application/json' } : {});
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  if (!res.ok) throw await toError(res);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Fetches a protected file with the auth header and hands it to the browser as a download. */
async function download(path, fallbackName = 'download') {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw await toError(res);
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = /filename\*=UTF-8''([^;]+)/i.exec(disposition) || /filename="?([^";]+)"?/i.exec(disposition);
  const name = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const api = {
  menu: () => request('/api/services/menu'),
  country: (code) => request(`/api/services/${code}`),
  service: (code, slug) => request(`/api/services/${code}/${slug}`),
  createEnquiry: (payload) => request('/api/enquiries', { method: 'POST', body: payload }),
  myEnquiries: () => request('/api/enquiries/mine'),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me'),
  changePassword: (payload) => request('/api/auth/change-password', { method: 'POST', body: payload }),
};

/** Staff area (role Admin). */
export const admin = {
  filings: () => request('/api/admin/filings'),
  filing: (id) => request(`/api/admin/filings/${id}`),
  updateFiling: (id, payload) => request(`/api/admin/filings/${id}`, { method: 'PUT', body: payload }),
  shareDocument: (id, { category, documentType, file, comments }) => {
    const form = new FormData();
    form.append('category', category);
    form.append('documentType', documentType);
    form.append('file', file);
    if (comments) form.append('comments', comments);
    return request(`/api/admin/filings/${id}/documents`, { method: 'POST', form });
  },
  downloadDocument: (doc) => download(`/api/admin/documents/${doc.id}/download`, doc.fileName),
  deleteDocument: (docId) => request(`/api/admin/documents/${docId}`, { method: 'DELETE' }),
  saveInvoice: (id, payload) => request(`/api/admin/filings/${id}/invoice`, { method: 'PUT', body: payload }),
  markPaid: (id) => request(`/api/admin/filings/${id}/invoice/paid`, { method: 'POST' }),
  enquiries: () => request('/api/enquiries'),
  setEnquiryStatus: (id, status) => request(`/api/enquiries/${id}/status`, { method: 'PUT', body: { status } }),
};

/** Client portal (all calls need a signed-in user). */
export const portal = {
  filings: () => request('/api/portal/filings'),
  filingOptions: () => request('/api/portal/filing-options'),
  createFiling: (countryCode, taxYear) => request('/api/portal/filings', { method: 'POST', body: { countryCode, taxYear } }),
  overview: (id) => request(`/api/portal/filings/${id}/overview`),
  downloadOrganizer: (id) => download(`/api/portal/filings/${id}/organizer`, 'VedaTax_TaxOrganizer.docx'),
  documentTypes: (id) => request(`/api/portal/filings/${id}/document-types`),
  documents: (id) => request(`/api/portal/filings/${id}/documents`),
  uploadDocument: (id, { documentType, file, comments }) => {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('file', file);
    if (comments) form.append('comments', comments);
    return request(`/api/portal/filings/${id}/documents`, { method: 'POST', form });
  },
  downloadDocument: (doc) => download(`/api/portal/documents/${doc.id}/download`, doc.fileName),
  deleteDocument: (docId) => request(`/api/portal/documents/${docId}`, { method: 'DELETE' }),
  invoice: (id) => request(`/api/portal/filings/${id}/invoice`),
  referrals: () => request('/api/portal/referrals'),
  addReferrals: (referrals) => request('/api/portal/referrals', { method: 'POST', body: { referrals } }),
  profile: () => request('/api/portal/profile'),
  updateProfile: (payload) => request('/api/portal/profile', { method: 'PUT', body: payload }),
};

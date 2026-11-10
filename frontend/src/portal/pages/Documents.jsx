import { useState } from 'react';
import { portal } from '../../api/client';
import useFetch from '../../api/useFetch';
import { usePortal } from '../PortalContext';
import { RequireFiling, PageHead, formatDate, formatBytes } from '../shared';
import UploadModal from '../UploadModal';
import { IconUpload, IconDownload, IconTrash, IconOrganizer } from '../icons';

const TABS = [
  { key: 'client', label: 'My uploads', empty: 'You haven\'t uploaded any documents yet.' },
  { key: 'expert', label: 'From VedaTax', empty: 'Your tax expert hasn\'t shared any documents yet. Drafts for your review will appear here.' },
  { key: 'download', label: 'Downloads', empty: 'Your filed return and acknowledgements will appear here once your return is filed.' },
];

export default function Documents() {
  return <RequireFiling>{(filing) => <DocumentsView filing={filing} />}</RequireFiling>;
}

function DocumentsView({ filing }) {
  const { reload: reloadFilings } = usePortal();
  const [tab, setTab] = useState('client');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const { data, loading, error } = useFetch(() => portal.documents(filing.id), [filing.id, version]);

  const docs = (data || []).filter((d) => d.category === tab);
  const count = (key) => (data || []).filter((d) => d.category === key).length;
  const active = TABS.find((t) => t.key === tab);

  const download = async (doc) => {
    setActionError('');
    setBusyId(doc.id);
    try { await portal.downloadDocument(doc); } catch (e) { setActionError(e.message); } finally { setBusyId(null); }
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.fileName}"? This can't be undone.`)) return;
    setActionError('');
    setBusyId(doc.id);
    try { await portal.deleteDocument(doc.id); setVersion((v) => v + 1); } catch (e) { setActionError(e.message); } finally { setBusyId(null); }
  };

  const organizer = async () => {
    setActionError('');
    try { await portal.downloadOrganizer(filing.id); } catch (e) { setActionError(e.message); }
  };

  return (
    <section className="p-card">
      <PageHead title="Documents">
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setUploadOpen(true)}>
          <IconUpload size={16} /> Upload document
        </button>
      </PageHead>

      <div className="p-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
            className={`p-tabs__tab ${tab === t.key ? 'is-active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} {data && <span className="p-tabs__count">{count(t.key)}</span>}
          </button>
        ))}
      </div>

      {tab === 'download' && (
        <button type="button" className="link-btn organizer-link" onClick={organizer}>
          <IconOrganizer size={16} /> Download tax organizer ({filing.countryName} · {filing.yearLabel})
        </button>
      )}

      {actionError && <p className="form__error" role="alert">{actionError}</p>}
      {loading && !data && <p className="muted">Loading documents…</p>}
      {error && <p className="form__error">{error.message}</p>}
      {data && docs.length === 0 && <p className="empty">{active.empty}</p>}

      {docs.length > 0 && (
        <div className="p-table-wrap">
          <table className="p-table">
            <thead>
              <tr><th>Document type</th><th>File</th><th>Uploaded</th><th>Comments</th><th className="right">Actions</th></tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td data-label="Type">{d.documentTypeLabel}</td>
                  <td data-label="File"><span className="file-name">{d.fileName}</span><small className="muted"> · {formatBytes(d.sizeBytes)}</small></td>
                  <td data-label="Uploaded">{formatDate(d.createdAt)}</td>
                  <td data-label="Comments" className="muted">{d.comments || '—'}</td>
                  <td className="right actions">
                    <button type="button" className="icon-btn" title="Download" aria-label={`Download ${d.fileName}`} disabled={busyId === d.id} onClick={() => download(d)}>
                      <IconDownload size={16} />
                    </button>
                    {d.canDelete && (
                      <button type="button" className="icon-btn icon-btn--danger" title="Delete" aria-label={`Delete ${d.fileName}`} disabled={busyId === d.id} onClick={() => remove(d)}>
                        <IconTrash size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        filing={filing}
        onUploaded={() => { setTab('client'); setVersion((v) => v + 1); reloadFilings(); }}
      />
    </section>
  );
}

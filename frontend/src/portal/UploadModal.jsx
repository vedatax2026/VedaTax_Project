import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import { portal } from '../api/client';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.heic,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip';
const MAX_MB = 15;

/** "Upload Document" pop-up: document type (per country) + file + comments. */
export default function UploadModal({ open, onClose, filing, defaultType = '', onUploaded }) {
  const [types, setTypes] = useState([]);
  const [type, setType] = useState(defaultType);
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (!open) return;
    setType(defaultType); setFile(null); setComments(''); setError('');
    portal.documentTypes(filing.id).then(setTypes).catch(() => setTypes([]));
  }, [open, filing.id, defaultType]);

  const groups = [...new Set(types.map((t) => t.group))];

  const pickFile = (f) => {
    setError('');
    if (f && f.size > MAX_MB * 1024 * 1024) { setError(`Files must be ${MAX_MB} MB or smaller.`); setFile(null); return; }
    setFile(f || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please choose a file to upload.'); return; }
    setBusy(true);
    setError('');
    try {
      const doc = await portal.uploadDocument(filing.id, { documentType: type, file, comments: comments.trim() });
      onUploaded?.(doc);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="upload-title" width={560}>
      <h2 id="upload-title">Upload document</h2>
      <p className="muted">For your {filing.countryName} return · {filing.yearLabel}</p>
      <form className="form" onSubmit={submit}>
        <label>Document type *
          <select required value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Select document type</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {types.filter((t) => t.group === g).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        <label>File *
          <div
            className={`dropzone ${file ? 'has-file' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
          >
            <input ref={fileRef} type="file" accept={ACCEPT} onChange={(e) => pickFile(e.target.files?.[0])} />
            <span>{file ? file.name : 'Drag a file here or click to browse'}</span>
            <small>PDF, images, Word, Excel, CSV, TXT or ZIP · up to {MAX_MB} MB</small>
          </div>
        </label>

        <label>Comments
          <textarea rows={3} maxLength={1000} placeholder="Anything we should know about this document?" value={comments} onChange={(e) => setComments(e.target.value)} />
        </label>

        {error && <p className="form__error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="submit" className="btn btn--navy" disabled={busy}>{busy ? 'Uploading…' : 'Submit'}</button>
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

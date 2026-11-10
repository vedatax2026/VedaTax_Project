import { useState } from 'react';
import { Link } from 'react-router-dom';
import { portal } from '../../api/client';
import { usePortal } from '../PortalContext';
import { RequireFiling, PageHead } from '../shared';
import UploadModal from '../UploadModal';
import { IconDownload, IconUpload, IconCheck } from '../icons';

export default function TaxOrganizer() {
  return <RequireFiling>{(filing) => <Organizer filing={filing} />}</RequireFiling>;
}

function Organizer({ filing }) {
  const { reload } = usePortal();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [uploaded, setUploaded] = useState(null);

  const download = async () => {
    setDownloading(true);
    setError('');
    try { await portal.downloadOrganizer(filing.id); } catch (e) { setError(e.message); } finally { setDownloading(false); }
  };

  return (
    <section className="p-card">
      <PageHead title="Tax Organizer" />
      <p className="muted">
        The organizer collects everything we need for your {filing.countryName} return ({filing.yearLabel}) in one place.
        It takes about 15 minutes.
      </p>

      <ol className="organizer-steps">
        <li>
          <span className="organizer-steps__num">1</span>
          <div>
            <h3>Download the tax organizer</h3>
            <p>Download the form prepared for {filing.countryName} · {filing.yearLabel}.</p>
            <button type="button" className="btn btn--blue" onClick={download} disabled={downloading}>
              <IconDownload /> {downloading ? 'Preparing…' : 'Download'}
            </button>
            {error && <p className="form__error" role="alert">{error}</p>}
          </div>
        </li>
        <li>
          <span className="organizer-steps__num">2</span>
          <div>
            <h3>Fill in the details</h3>
            <p>Open it in Word or Google Docs and answer the questions that apply to you. Leave the rest blank.</p>
          </div>
        </li>
        <li>
          <span className="organizer-steps__num">3</span>
          <div>
            <h3>Upload the tax organizer</h3>
            <p>Upload the completed form, then add your slips and statements under <Link to="/portal/documents">Documents</Link>.</p>
            <button type="button" className="btn btn--green" onClick={() => setUploadOpen(true)}>
              <IconUpload /> Upload
            </button>
            {uploaded && (
              <p className="success-line"><IconCheck size={16} /> {uploaded.fileName} uploaded. <Link to="/portal/documents">View documents</Link></p>
            )}
          </div>
        </li>
      </ol>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        filing={filing}
        defaultType="Tax_Organizer"
        onUploaded={(doc) => { setUploaded(doc); reload(); }}
      />
    </section>
  );
}

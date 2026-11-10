import Modal from '../components/Modal';
import StartFilingForm from './StartFilingForm';

/** "Start another filing" pop-up opened from the tax-year selector. */
export default function NewFilingModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="new-filing-title" width={560}>
      <h2 id="new-filing-title">Start a filing</h2>
      <p className="muted">Choose the country and tax year you'd like VedaTax to file for you.</p>
      {open && <StartFilingForm onDone={onClose} />}
    </Modal>
  );
}

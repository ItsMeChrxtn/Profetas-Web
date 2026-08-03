import { useState } from 'react';
import Tesseract from 'tesseract.js';

function extractReferenceNumber(text) {
  const labelMatch = text.match(/reference\s*(no\.?|number)?\s*[:\-]?\s*(\d{6,})/i);
  if (labelMatch) return labelMatch[2];
  const digitSequences = text.match(/\d{6,}/g);
  if (digitSequences && digitSequences.length) {
    return digitSequences.reduce((longest, current) => (current.length >= longest.length ? current : longest));
  }
  return null;
}

/** OCRs the uploaded receipt client-side and auto-fills the reference number field if empty - best-effort, non-blocking. */
export function ReceiptUploader({ onFileSelected, referenceNumber, onReferenceDetected }) {
  const [status, setStatus] = useState('');

  function handleChange(e) {
    const file = e.target.files[0];
    onFileSelected(file || null);
    if (!file) return;

    setStatus('Scanning receipt for reference number...');
    Tesseract.recognize(file, 'eng')
      .then(({ data: { text } }) => {
        const refNumber = extractReferenceNumber(text);
        if (refNumber && !referenceNumber) {
          onReferenceDetected(refNumber);
          setStatus(`Found reference number: ${refNumber} (please double-check it).`);
        } else if (refNumber) {
          setStatus(`Detected ${refNumber} in the receipt — verify it matches the field above.`);
        } else {
          setStatus("Couldn't auto-read a reference number — please type it in manually.");
        }
      })
      .catch(() => setStatus("Couldn't scan this image automatically — please type the reference number manually."));
  }

  return (
    <div className="mb-2">
      <label className="form-label">
        Upload Receipt Screenshot <span className="text-muted fw-normal">(we'll try to read the reference number for you)</span>
      </label>
      <input type="file" className="form-control" accept="image/png, image/jpeg, image/webp" onChange={handleChange} />
      <div className="small text-muted mt-1">{status}</div>
    </div>
  );
}

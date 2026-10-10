import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wholesalerApi } from '../../api/wholesaler.js';
import { productsApi } from '../../api/products.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ProductCard } from '../../components/site/ProductCard.jsx';
import { formatDate } from '../../utils/dateFormat.js';
import { showToast } from '../../utils/toast.js';

const STEPS = [
  { icon: 'fa-file-signature', title: 'Submit Your Application', text: 'Provide the required information and documents for verification.' },
  { icon: 'fa-search', title: 'Review Process', text: 'Our team will review your application and verify the details.' },
  { icon: 'fa-user-check', title: 'Get Approved', text: "Once approved, you'll get wholesaler status and wholesale pricing." },
];

const REQUIREMENTS = [
  { icon: 'fa-address-card', title: 'Full Name & Contact Information', text: 'Your complete name, phone number, and email address.' },
  { icon: 'fa-store', title: 'Business or Store Name', text: 'The official name of your business or store.' },
  { icon: 'fa-map-marker-alt', title: 'Business Address', text: 'Your complete business address (for verification).' },
  { icon: 'fa-id-card', title: 'Valid ID', text: "A government-issued ID (e.g. PhilID, Driver's License, Passport)." },
  { icon: 'fa-certificate', title: 'Business Registration Certificate', text: 'If available - e.g. DTI, SEC, or Mayor\'s Permit.' },
  { icon: 'fa-camera', title: 'Optional Proof of Business', text: 'A store photo or other proof that your business is operating.' },
];

function WholesaleLanding({ onApply, rejected }) {
  return (
    <>
      <section className="wholesale-hero">
        <div>
          <h1>Partner with Profeta Integrated Farm</h1>
          <p>Get better prices, consistent supply, and grow your business with us.</p>
        </div>
        <i className="fas fa-handshake wholesale-hero-icon" />
      </section>

      {rejected && (
        <div className="alert alert-danger">
          <strong>Your previous application was not approved.</strong>
          <div className="small mt-1">Reason: {rejected.rejectionReason}</div>
          <div className="small">You can update your details and apply again.</div>
        </div>
      )}

      <div className="farm-card mb-4">
        <div className="wholesale-section-label">
          <i className="fas fa-handshake me-2" />How to Become a Wholesaler
        </div>
        <div className="row g-4 text-center">
          {STEPS.map((step, i) => (
            <div className="col-md-4" key={step.title}>
              <div className="wholesale-step-number">{i + 1}</div>
              <div className="wholesale-step-icon">
                <i className={`fas ${step.icon}`} />
              </div>
              <div className="fw-bold mb-1">{step.title}</div>
              <div className="small text-muted">{step.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="farm-card mb-4">
        <h5 className="fw-bold text-center mb-1">
          <i className="fas fa-star me-2" style={{ color: 'var(--accent-amber)' }} />
          What You Need
        </h5>
        <p className="small text-muted text-center mb-4">Prepare the following requirements to complete your application.</p>
        <div className="row g-4">
          {REQUIREMENTS.map((req) => (
            <div className="col-6 col-md-4 text-center" key={req.title}>
              <div className="wholesale-req-icon">
                <i className={`fas ${req.icon}`} />
              </div>
              <div className="fw-bold small mb-1">{req.title}</div>
              <div className="small text-muted">{req.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button type="button" className="btn btn-farm-amber btn-lg px-5" onClick={onApply}>
          Apply Now <i className="fas fa-arrow-right ms-1" />
        </button>
      </div>
    </>
  );
}

function FileField({ label, hint, required, onChange }) {
  return (
    <div className="mb-3">
      <label className="form-label">
        {label} {!required && <span className="text-muted fw-normal">(optional)</span>}
      </label>
      <input type="file" accept="image/jpeg,image/png,image/webp" className="form-control" onChange={(e) => onChange(e.target.files[0] || null)} required={required} />
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
}

function ApplicationForm({ user, onBack, onSubmitted }) {
  const [form, setForm] = useState({
    fullName: `${user.firstName} ${user.lastName}`,
    contactNumber: user.contactNumber || '',
    email: user.email,
    businessName: '',
    businessAddress: '',
  });
  const [files, setFiles] = useState({ validIdImage: null, businessPermitImage: null, proofOfBusinessImage: null });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setFile = (field) => (file) => setFiles((prev) => ({ ...prev, [field]: file }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    Object.entries(files).forEach(([k, f]) => f && data.append(k, f));
    setSubmitting(true);
    try {
      const res = await wholesalerApi.apply(data);
      showToast('success', res.message);
      onSubmitted();
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="farm-card" onSubmit={handleSubmit}>
      <button type="button" className="btn btn-link p-0 mb-3" onClick={onBack}>
        <i className="fas fa-chevron-left me-1" />Back
      </button>
      <h4 className="fw-bold mb-1">Wholesaler Application</h4>
      <p className="small text-muted mb-4">All documents are kept private and only seen by our team.</p>
      {error && <div className="alert alert-danger">{error}</div>}

      <h6 className="fw-bold mb-3">Contact Information</h6>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Full Name</label>
          <input className="form-control" value={form.fullName} onChange={update('fullName')} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Contact Number</label>
          <input className="form-control" placeholder="09xx xxx xxxx" value={form.contactNumber} onChange={update('contactNumber')} required />
        </div>
        <div className="col-12">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-control" value={form.email} onChange={update('email')} required />
        </div>
      </div>

      <h6 className="fw-bold mb-3">Business Information</h6>
      <div className="mb-3">
        <label className="form-label">Business or Store Name</label>
        <input className="form-control" value={form.businessName} onChange={update('businessName')} required />
      </div>
      <div className="mb-4">
        <label className="form-label">Business Address</label>
        <textarea className="form-control" rows={2} placeholder="Street, Barangay, City/Municipality, Province" value={form.businessAddress} onChange={update('businessAddress')} required />
      </div>

      <h6 className="fw-bold mb-3">Documents</h6>
      <FileField label="Valid ID" hint="Government-issued ID (PhilID, Driver's License, Passport, etc.)" required onChange={setFile('validIdImage')} />
      <FileField label="Business Registration Certificate" hint="DTI, SEC, or Mayor's Permit, if available." onChange={setFile('businessPermitImage')} />
      <FileField label="Proof of Business" hint="E.g. a photo of your store." onChange={setFile('proofOfBusinessImage')} />

      <button type="submit" className="btn btn-farm-primary w-100 mt-2" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}

function PendingCard({ application }) {
  return (
    <div className="farm-card text-center py-5">
      <div className="wholesale-req-icon mx-auto mb-3">
        <i className="fas fa-hourglass-half" />
      </div>
      <h4 className="fw-bold">Application Under Review</h4>
      <p className="text-muted mb-1">
        We received your application for <strong>{application.businessName}</strong> on {formatDate(application.createdAt)}.
      </p>
      <p className="text-muted mb-0">Our team is verifying your details. You'll get wholesale access once it's approved.</p>
    </div>
  );
}

function WholesaleCatalog({ businessName }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    productsApi.wholesale().then((data) => setItems(data.items));
  }, []);

  return (
    <>
      <div className="farm-card mb-4 d-flex align-items-center gap-3">
        <div className="wholesale-req-icon flex-shrink-0">
          <i className="fas fa-check" />
        </div>
        <div>
          <div className="fw-bold">
            You're a verified wholesaler <i className="fas fa-check-circle verified-check" />
          </div>
          <div className="small text-muted">
            {businessName ? `${businessName} gets` : 'You get'} wholesale pricing on these products. Add them to your cart and check out as
            usual.
          </div>
        </div>
      </div>

      {items && items.length === 0 && (
        <div className="farm-card text-center py-5 text-muted">No wholesale products are available right now. Please check back soon.</div>
      )}
      <div className="row g-4">
        {(items || []).map((p) => (
          <div className="col-6 col-md-4 col-lg-3" key={p._id}>
            <ProductCard product={p} harvestedLabel="Harvested Today" />
            <div className="small text-muted text-center mt-1">
              Retail: <s>₱{Number(p.retailPrice).toFixed(2)}</s>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Wholesale() {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    wholesalerApi.mine().then(setState);
  }
  useEffect(load, []);

  if (!state) return null;

  const { application, isWholesaler, businessName } = state;
  let body;
  if (isWholesaler) body = <WholesaleCatalog businessName={businessName} />;
  else if (application?.status === 'Pending') body = <PendingCard application={application} />;
  else if (showForm)
    body = (
      <ApplicationForm
        user={user}
        onBack={() => setShowForm(false)}
        onSubmitted={() => {
          setShowForm(false);
          load();
        }}
      />
    );
  else body = <WholesaleLanding onApply={() => setShowForm(true)} rejected={application?.status === 'Rejected' ? application : null} />;

  return (
    <div className="container" style={{ maxWidth: 960, paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">{isWholesaler ? 'Wholesale Catalog' : 'Become Our Wholesaler'}</h2>
      <p className="section-subtitle">
        {isWholesaler ? (
          'Exclusive wholesale prices for verified partners.'
        ) : (
          <>
            Buy in bulk at wholesale prices. Questions? See our <Link to="/faq">FAQs</Link>.
          </>
        )}
      </p>
      {body}
    </div>
  );
}

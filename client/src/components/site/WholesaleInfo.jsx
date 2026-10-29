import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const STEPS = [
  { icon: 'fa-file-signature', title: 'Submit Your Application', text: 'Provide the required information and documents for verification.' },
  { icon: 'fa-search', title: 'Review Process', text: 'Our team will review your application and verify the details.' },
  { icon: 'fa-user-check', title: 'Get Approved', text: "Once approved, you'll see wholesale prices on our wholesale products." },
];

const REQUIREMENTS = [
  { icon: 'fa-address-card', title: 'Full Name & Contact Information', text: 'Your complete name, phone number, and email address.' },
  { icon: 'fa-store', title: 'Business or Store Name', text: 'The official name of your business or store.' },
  { icon: 'fa-map-marker-alt', title: 'Business Address', text: 'Your complete business address (for verification).' },
  { icon: 'fa-id-card', title: 'Valid ID', text: "A government-issued ID (e.g. PhilID, Driver's License, Passport)." },
  { icon: 'fa-certificate', title: 'Business Registration Certificate', text: 'If available - e.g. DTI, SEC, or Mayor\'s Permit.' },
  { icon: 'fa-camera', title: 'Optional Proof of Business', text: 'A store photo or other proof that your business is operating.' },
];

/**
 * "Become our wholesaler" info block (steps + requirements). Sits at the
 * bottom of Home; Apply Now opens the application form on /wholesale.
 */
export function WholesaleInfo() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.isWholesaler) return null;
  const onApply = () => navigate('/wholesale');

  return (
    <section className="mt-5 mb-5" id="become-wholesaler">
      <h2 className="section-title">Become Our Wholesaler</h2>
      <p className="section-subtitle">Buy in bulk for your store or business.</p>
      <div className="wholesale-hero">
        <div>
          <h1>Partner with Profeta Integrated Farm</h1>
          <p>Get better prices, consistent supply, and grow your business with us.</p>
        </div>
        <i className="fas fa-handshake wholesale-hero-icon" />
      </div>

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
    </section>
  );
}

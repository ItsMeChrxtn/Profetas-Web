import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext.jsx';

function FaqItem({ question, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="faq-item">
      <button type="button" className="faq-question" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{question}</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} />
      </button>
      {open && <div className="faq-answer">{children}</div>}
    </div>
  );
}

export default function Faq() {
  const settings = useSiteSettings();

  return (
    <div className="container" style={{ maxWidth: 820, paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Frequently Asked Questions</h2>
      <p className="section-subtitle">Everything you need to know about ordering from Profetas Integrated Farm.</p>

      <h5 className="fw-bold mt-4 mb-3">
        <i className="fas fa-truck me-2" />Shipping &amp; Delivery
      </h5>
      <div className="farm-card mb-4 p-0">
        <FaqItem question="How is the shipping fee computed?" defaultOpen>
          <p>
            We deliver through <strong>Lalamove</strong>, so the shipping fee is computed by Lalamove itself &mdash; not a flat rate.
            It is based on the <strong>distance</strong> between our farm and the location you pin on the map at checkout.
          </p>
          <div className="faq-formula">
            <div className="fw-bold mb-2">Shipping Fee = Base Fare + (Distance &times; Rate per km) + Surcharges (if any)</div>
            <ul className="mb-0 small">
              <li>
                <strong>Pickup point:</strong> Profetas Integrated Farm, Tres Cruces, Tanza, Cavite
              </li>
              <li>
                <strong>Drop-off point:</strong> the exact location you pin on the map
              </li>
              <li>
                <strong>Vehicle:</strong> Motorcycle
              </li>
              <li>
                <strong>Base fare and per-km rate</strong> are set by Lalamove. Surcharges may apply during peak hours or holidays.
              </li>
            </ul>
          </div>
          <p className="mt-3 mb-2">
            <strong>Example:</strong> a drop-off within Tanza costs around ₱70, while a drop-off in Makati (about 30 km away) costs
            around ₱150. The closer you are, the lower the fee. These are only estimates &mdash; your checkout shows the exact amount.
          </p>
          <p className="mb-0">
            You'll always see the <strong>exact fee before you pay</strong>: once you pin your location at checkout, the fee and your
            new total appear in the Order Summary.
          </p>
        </FaqItem>
        <FaqItem question="Is there a way to avoid the shipping fee?">
          Yes &mdash; choose <strong>Self-Pickup</strong> at checkout and pick up your order at the farm in Tres Cruces, Tanza, Cavite. Pickup
          has no extra fee; just choose your preferred date and time.
        </FaqItem>
        <FaqItem question="Why did my shipping fee change when I placed my order?">
          Lalamove prices can change slightly over time (for example, during peak hours). We check the price again when you place your
          order. If it changed, we'll show you the new fee so you can review your total before confirming.
        </FaqItem>
        <FaqItem question="How do I track my delivery?">
          Go to <Link to="/track-order">Track Order</Link> and enter your order number and email &mdash; no login needed. Once a rider
          is booked, you'll also see a link to track the rider live.
        </FaqItem>
      </div>

      <h5 className="fw-bold mb-3">
        <i className="fas fa-wallet me-2" />Orders &amp; Payment
      </h5>
      <div className="farm-card mb-4 p-0">
        <FaqItem question="How do I pay?">
          We accept <strong>GCash</strong>. Send your payment to {settings.gcashNumber ? <strong>{settings.gcashNumber}</strong> : 'our GCash number'}{' '}
          shown at checkout, then enter your reference number and/or upload your receipt. Our team will verify it manually.
        </FaqItem>
        <FaqItem question="Do I need an account to order?">
          Yes. Please <Link to="/register">sign up</Link> or <Link to="/login">log in</Link> to view the full catalog, add items to your
          cart, place orders, and send wholesale inquiries.
        </FaqItem>
        <FaqItem question="What do the order statuses mean?">
          <ul className="mb-0">
            <li><strong>Pending</strong> &ndash; we received your order and are verifying your payment.</li>
            <li><strong>Confirmed</strong> &ndash; your payment is verified.</li>
            <li><strong>Processing</strong> &ndash; your order is being prepared.</li>
            <li><strong>Shipped</strong> &ndash; your order is on the way, or ready for pickup.</li>
            <li><strong>Completed</strong> &ndash; your order has been delivered or picked up.</li>
          </ul>
        </FaqItem>
        <FaqItem question="Can I order in bulk?">
          Yes. For orders of ₱10,000 or more, send us a <Link to="/wholesale">Wholesale Inquiry</Link> and we'll send you a quotation.
        </FaqItem>
      </div>

      <h5 className="fw-bold mb-3">
        <i className="fas fa-user me-2" />Account
      </h5>
      <div className="farm-card p-0">
        <FaqItem question="I forgot my password. What should I do?">
          Click <Link to="/forgot-password">Forgot password?</Link> on the login page. We'll email you a 6-digit code so you can set a new
          password.
        </FaqItem>
        <FaqItem question="How do I change my name or password?">
          Log in, then go to <Link to="/account">My Account</Link>. You can edit your profile and change your password there.
        </FaqItem>
      </div>
    </div>
  );
}

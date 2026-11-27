import { useState } from 'react';

const SECTIONS = [
  {
    title: '1. Your Account',
    body: [
      'You must give accurate information (name, email, and an 11-digit contact number) when you sign up, and keep your password private.',
      'An account can be logged in on one device at a time. Logging in on another device logs out the earlier one.',
      'We may suspend an account that breaks these terms, for example by placing fake orders or submitting false payment details.',
    ],
  },
  {
    title: '2. Orders and Payment',
    body: [
      'Orders are paid through GCash. Your order is confirmed only after our team verifies your reference number or receipt.',
      'Prices shown are in Philippine Peso and are VAT-inclusive (12%). Your invoice shows the VATable sales and VAT amount.',
      'If a payment cannot be verified, we will reject it and tell you why.',
    ],
  },
  {
    title: '3. Delivery and Pickup',
    body: [
      'Deliveries are booked through Lalamove. The delivery fee is computed by Lalamove from the distance and the weight of your order and is shown before you pay.',
      'For Self-Pickup, please come on the date and time you chose at Profetas Integrated Farm, Tres Cruces, Tanza, Cavite.',
    ],
  },
  {
    title: '4. No Refunds - Replacement Only',
    body: [
      'We do not give refunds. If an item arrives damaged or unusable (for example, a broken fruiting bag or a contaminated grow bag), we will replace the item.',
      'Send your order number and clear photos of the damaged item and packaging as soon as you receive it.',
    ],
  },
  {
    title: '5. Wholesale Accounts',
    body: [
      'Wholesale prices are only for approved wholesalers and only apply to products bought from the Wholesale page, with the minimum order shown for each product.',
      'Documents you submit for a wholesaler application are kept private and only seen by our team.',
    ],
  },
  {
    title: '6. Farm Visits',
    body: ['Farm visits are from 7:00 AM to 5:00 PM, for up to 100 visitors per request, and are confirmed by our team. A day that is already booked cannot be requested.'],
  },
  {
    title: '7. Your Privacy',
    body: [
      'We collect only the details needed to process your orders, deliveries, and farm visits, in line with the Data Privacy Act of 2012 (RA 10173).',
      'Your contact details are shared with Lalamove only to deliver your order, and are not sold to anyone.',
    ],
  },
  {
    title: '8. Changes to These Terms',
    body: ['We may update these terms. The latest version is always shown here when you sign up.'],
  },
];

/**
 * Terms and Conditions shown before signing up. "I Agree" only unlocks once
 * the reader has scrolled to the end, so the terms are actually read.
 */
export function TermsModal({ onAgree, onClose }) {
  const [readToEnd, setReadToEnd] = useState(false);

  function handleScroll(e) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReadToEnd(true);
  }

  return (
    <div className="terms-overlay" role="dialog" aria-modal="true" aria-labelledby="terms-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="terms-dialog">
        <div className="terms-head">
          <h5 id="terms-title" className="fw-bold mb-0">
            Terms and Conditions
          </h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div className="terms-body" onScroll={handleScroll}>
          <p className="small text-muted">Please read these terms before creating your Profeta Integrated Farm account.</p>
          {SECTIONS.map((s) => (
            <section key={s.title} className="mb-3">
              <h6 className="fw-bold">{s.title}</h6>
              <ul className="small mb-0">
                {s.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
          <p className="small fw-bold mb-0">By tapping "I Agree", you accept these Terms and Conditions.</p>
        </div>
        <div className="terms-foot">
          {!readToEnd && (
            <span className="small text-muted">
              <i className="fas fa-arrow-down me-1" />
              Scroll to the end to continue
            </span>
          )}
          <button type="button" className="btn btn-farm-primary ms-auto" disabled={!readToEnd} onClick={onAgree}>
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

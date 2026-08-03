import { useEffect, useState } from 'react';
import { loyaltyApi } from '../../api/loyalty.js';
import { peso } from '../../utils/peso.js';

const LOYALTY_THRESHOLDS = [1000, 5000, 10000];

export default function Loyalty() {
  const [spend, setSpend] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    loyaltyApi.mine().then((data) => {
      setSpend(data.spend);
      setVouchers(data.vouchers);
    });
  }, []);

  if (spend === null) return null;

  const vouchersByThreshold = Object.fromEntries(vouchers.map((v) => [v.thresholdAmount, v]));
  const maxThreshold = Math.max(...LOYALTY_THRESHOLDS);
  const progressPct = Math.min(100, (spend / maxThreshold) * 100);
  const nextThreshold = LOYALTY_THRESHOLDS.find((t) => spend < t);

  return (
    <div className="container" style={{ maxWidth: 900, paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Loyalty & Vouchers</h2>
      <p className="section-subtitle">Earn vouchers automatically as you shop with us.</p>

      <div className="farm-card mb-4">
        <div className="d-flex justify-content-between align-items-end mb-2">
          <div>
            <div className="small text-muted">Your Cumulative Spend</div>
            <div className="fs-3 fw-bold" style={{ color: 'var(--primary-green)' }}>
              {peso(spend)}
            </div>
          </div>
          {nextThreshold ? (
            <div className="text-end small text-muted">
              {peso(nextThreshold - spend)} more to unlock {peso(nextThreshold)} voucher
            </div>
          ) : (
            <div className="text-end small fw-bold" style={{ color: 'var(--accent-amber)' }}>
              All voucher tiers unlocked! <i className="fas fa-trophy" />
            </div>
          )}
        </div>
        <div className="loyalty-progress">
          <div className="loyalty-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="row g-3">
        {LOYALTY_THRESHOLDS.map((threshold) => {
          const voucher = vouchersByThreshold[threshold];
          const unlocked = Boolean(voucher);
          return (
            <div className="col-md-4" key={threshold}>
              <div className={`voucher-card ${unlocked ? 'unlocked' : ''}`}>
                <i
                  className={`fas ${unlocked ? 'fa-gift' : 'fa-lock'} fa-2x mb-2`}
                  style={{ color: unlocked ? 'var(--accent-amber)' : 'var(--text-muted)' }}
                />
                <div className="fw-bold">₱{threshold.toLocaleString()} Voucher</div>
                {unlocked ? (
                  <>
                    <div className="small text-muted mt-1">Code</div>
                    <div className="fw-bold" style={{ letterSpacing: 1, color: 'var(--primary-green)' }}>
                      {voucher.code}
                    </div>
                    <span className={`stock-badge ${voucher.status === 'Available' ? 'stock-in' : 'stock-out'} mt-2 d-inline-block`}>
                      {voucher.status}
                    </span>
                  </>
                ) : (
                  <div className="small text-muted mt-1">Spend ₱{threshold.toLocaleString()} total to unlock</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="alert alert-light border mt-4 small">
        <i className="fas fa-info-circle me-1" /> Present your voucher code to our team when picking up or receiving your order to redeem
        it.
      </div>
    </div>
  );
}

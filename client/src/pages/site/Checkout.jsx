import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { cartApi } from '../../api/cart.js';
import { ordersApi } from '../../api/orders.js';
import { peso } from '../../utils/peso.js';
import { todayDateString } from '../../utils/dateFormat.js';
import { DeliveryMap } from '../../components/site/DeliveryMap.jsx';
import { ReceiptUploader } from '../../components/site/ReceiptUploader.jsx';
import { showToast } from '../../utils/toast.js';

const DELIVERY_FEES = { Lalamove: 150.0, 'Self-Pickup': 0.0 };

export default function Checkout() {
  const { settings } = useOutletContext();
  const { asItemsArray, clear } = useCart();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [items, setItems] = useState(null);
  const [subtotal, setSubtotal] = useState(0);

  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [position, setPosition] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  const [findingAddress, setFindingAddress] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const requested = asItemsArray();
    if (requested.length === 0) {
      navigate('/cart');
      return;
    }
    cartApi.validate(requested).then((data) => {
      if (data.items.length === 0) {
        navigate('/cart');
        return;
      }
      setItems(data.items);
      setSubtotal(data.subtotal);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function placeMarker(lat, lng) {
    setPosition([lat, lng]);
  }

  function handleFindOnMap() {
    const address = deliveryAddress.trim();
    if (!address) {
      alert('Please type your address first.');
      return;
    }
    setFindingAddress(true);
    const query = encodeURIComponent(`${address}, Philippines`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=ph&limit=1&q=${query}`)
      .then((res) => res.json())
      .then((results) => {
        if (!results.length) {
          alert('Could not find that address automatically. Please pin your location on the map instead.');
          return;
        }
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        placeMarker(lat, lng);
        mapRef.current?.setView([lat, lng], 16);
      })
      .catch(() => alert('Could not search that address right now. Please pin your location on the map instead.'))
      .finally(() => setFindingAddress(false));
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert('Your browser does not support location detection. Please pin your location on the map instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        placeMarker(lat, lng);
        mapRef.current?.setView([lat, lng], 16);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) setDeliveryAddress(data.display_name);
          })
          .catch(() => {})
          .finally(() => setLocating(false));
      },
      (error) => {
        setLocating(false);
        alert(
          error.code === error.PERMISSION_DENIED
            ? 'Location access was denied. Please allow location access, or pin your location on the map instead.'
            : 'Could not get your location. Please pin it on the map instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    if (!deliveryMethod) {
      setErrors(['Please select a valid delivery method.']);
      return;
    }
    if (deliveryMethod !== 'Self-Pickup' && !position) {
      alert('Please pin your delivery location on the map.');
      return;
    }

    const formData = new FormData();
    formData.append('items', JSON.stringify(asItemsArray()));
    formData.append('deliveryMethod', deliveryMethod);
    if (deliveryMethod === 'Self-Pickup') {
      formData.append('pickupDate', pickupDate);
      formData.append('pickupTime', pickupTime);
    } else {
      formData.append('deliveryAddress', deliveryAddress);
      formData.append('deliveryLandmark', deliveryLandmark);
      formData.append('deliveryLat', position[0]);
      formData.append('deliveryLng', position[1]);
    }
    formData.append('referenceNumber', referenceNumber);
    if (receiptFile) formData.append('receiptImage', receiptFile);

    setSubmitting(true);
    try {
      const data = await ordersApi.place(formData);
      clear();
      showToast('success', 'Order placed! We will verify your GCash payment shortly.');
      navigate(`/track-order?highlight=${data.order.orderNumber}`);
    } catch (err) {
      setErrors([err.message]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!items) return null;

  const isPickup = deliveryMethod === 'Self-Pickup';
  const fee = deliveryMethod ? DELIVERY_FEES[deliveryMethod] || 0 : 0;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h2 className="section-title">Checkout</h2>

      {errors.length > 0 && (
        <div className="alert alert-danger">
          <ul className="mb-0">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="farm-card mb-4">
              <h5 className="fw-bold mb-3">
                <i className="fas fa-truck me-2" />Delivery Method
              </h5>
              <div className="row g-3">
                {Object.entries(DELIVERY_FEES).map(([method, methodFee]) => (
                  <div className="col-md-6" key={method}>
                    <label className="border rounded-3 p-3 d-flex align-items-center gap-2 w-100" style={{ cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="delivery_method"
                        value={method}
                        className="form-check-input mt-0"
                        required
                        checked={deliveryMethod === method}
                        onChange={() => setDeliveryMethod(method)}
                      />
                      <span className="flex-grow-1">
                        <span className="d-block fw-bold">{method}</span>
                        <span className="small text-muted">{methodFee > 0 ? `${peso(methodFee)} fee` : 'No extra fee'}</span>
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {isPickup && (
              <div className="farm-card mb-4">
                <h5 className="fw-bold mb-3">
                  <i className="fas fa-store me-2" />Pickup Schedule
                </h5>
                <p className="small text-muted">Pick-up at Profetas Integrated Farm, Tres Cruces, Tanza, Cavite.</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Pickup Date</label>
                    <input
                      type="date"
                      className="form-control"
                      min={todayDateString()}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Pickup Time</label>
                    <input type="time" className="form-control" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {deliveryMethod && !isPickup && (
              <div className="farm-card mb-4">
                <h5 className="fw-bold mb-3">
                  <i className="fas fa-map-marker-alt me-2" />Delivery Address
                </h5>
                <div className="mb-3">
                  <label className="form-label">Full Address</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="House/Unit No., Street, Barangay, City/Municipality"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                  <button type="button" className="btn btn-farm-outline btn-sm mt-2" disabled={findingAddress} onClick={handleFindOnMap}>
                    <i className={`fas ${findingAddress ? 'fa-spinner fa-spin' : 'fa-search-location'} me-1`} />
                    {findingAddress ? 'Searching...' : 'Find on Map'}
                  </button>
                </div>
                <div className="mb-3">
                  <label className="form-label">Landmark (optional)</label>
                  <input type="text" className="form-control" value={deliveryLandmark} onChange={(e) => setDeliveryLandmark(e.target.value)} />
                </div>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <label className="form-label mb-0">
                    Pin Your Exact Location{' '}
                    <span className="text-muted fw-normal">(search your address, use your current location, or click the map)</span>
                  </label>
                  <button type="button" className="btn btn-farm-outline btn-sm" disabled={locating} onClick={handleUseMyLocation}>
                    <i className={`fas ${locating ? 'fa-spinner fa-spin' : 'fa-location-arrow'} me-1`} />
                    {locating ? 'Locating...' : 'Use My Current Location'}
                  </button>
                </div>
                <DeliveryMap position={position} onPick={placeMarker} mapRef={mapRef} />
                <div className="small text-muted">
                  {position ? `Pinned: ${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'No location pinned yet.'}
                </div>
              </div>
            )}

            <div className="farm-card">
              <h5 className="fw-bold mb-3">
                <i className="fas fa-wallet me-2" />GCash Payment
              </h5>
              <p className="small text-muted">
                Send payment to <strong>{settings.gcashNumber}</strong>, then provide your reference number and/or upload your receipt
                below. Our team will verify it manually.
              </p>
              <div className="mb-3">
                <label className="form-label">GCash Reference Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 1234567890123"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
              <ReceiptUploader onFileSelected={setReceiptFile} referenceNumber={referenceNumber} onReferenceDetected={setReferenceNumber} />
            </div>
          </div>

          <div className="col-lg-4">
            <div className="farm-card">
              <h5 className="fw-bold mb-3">Order Summary</h5>
              {items.map((item) => (
                <div className="d-flex justify-content-between small mb-2" key={item.productId}>
                  <span>
                    {item.name} &times; {item.quantity}
                  </span>
                  <span>{peso(item.subtotal)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Subtotal</span>
                <span>{peso(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Delivery Fee</span>
                <span>{peso(fee)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3 fs-5">
                <span className="fw-bold">Total</span>
                <span className="fw-bold" style={{ color: 'var(--primary-green)' }}>
                  {peso(subtotal + fee)}
                </span>
              </div>
              <button type="submit" className="btn btn-farm-primary w-100" disabled={submitting}>
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

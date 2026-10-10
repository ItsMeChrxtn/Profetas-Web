import { getLalamoveQuotation } from '../utils/lalamoveClient.js';
import { HttpError } from '../utils/httpError.js';
import { Product } from '../models/index.js';

// Must match client/src/components/site/DeliveryMap.jsx's FARM_CENTER - the
// farm is the pickup point for every Lalamove booking.
export const FARM_PICKUP = { lat: 14.3585, lng: 120.8155, address: 'Profetas Integrated Farm, Tres Cruces, Tanza, Cavite' };

// Lalamove PH vehicles and their load limits (from Lalamove's /v3/cities), smallest first.
// A heavier order needs a bigger vehicle, which is what makes weight change the fee.
export const LALAMOVE_VEHICLES = [
  { serviceType: 'MOTORCYCLE', label: 'Motorcycle', maxKg: 20 },
  { serviceType: 'SEDAN', label: 'Sedan', maxKg: 200 },
  { serviceType: 'MPV', label: 'Small Crossover / MPV', maxKg: 300 },
  { serviceType: 'VAN', label: 'Van', maxKg: 600 },
  { serviceType: 'VAN1000', label: 'Van (1,000 kg)', maxKg: 1000 },
  { serviceType: 'TRUCK550', label: 'Light Truck (2,000 kg)', maxKg: 2000 },
  { serviceType: '3000KG_TRUCK', label: 'Truck (3,000 kg)', maxKg: 3000 },
  { serviceType: '7000KG_TRUCK', label: 'Truck (7,000 kg)', maxKg: 7000 },
];

export function vehicleForWeight(weightKg) {
  const vehicle = LALAMOVE_VEHICLES.find((v) => weightKg <= v.maxKg);
  if (!vehicle) {
    throw new HttpError(400, 'This order is too heavy for Lalamove delivery. Please choose Self-Pickup or contact us.');
  }
  return vehicle;
}

// Products saved before weights existed have no weightKg; same default as the schema.
const DEFAULT_WEIGHT_KG = 0.5;

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Total weight (kg) of cart intents [{productId, quantity}], from live product data. */
export async function totalWeightKg(items) {
  const ids = (items || []).map((i) => i.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).select('weightKg').lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  let total = 0;
  for (const { productId, quantity } of items || []) {
    const product = byId.get(String(productId));
    const qty = parseInt(quantity, 10) || 0;
    if (product && qty > 0) total += (product.weightKg ?? DEFAULT_WEIGHT_KG) * qty;
  }
  return round2(total);
}

/**
 * Live Lalamove price (PHP) for farm -> the given drop-off. The vehicle is
 * picked from the order weight, so distance and weight both affect the fee.
 */
export async function quoteLalamoveFee({ lat, lng, address, weightKg = 0 }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new HttpError(400, 'Please pin your delivery location on the map.');
  }

  const vehicle = vehicleForWeight(weightKg);
  const quotation = await getLalamoveQuotation({
    serviceType: vehicle.serviceType,
    pickup: FARM_PICKUP,
    dropoff: { lat, lng, address: address || 'Delivery address' },
  });

  const fee = Number(quotation?.priceBreakdown?.total);
  if (!Number.isFinite(fee)) {
    throw new HttpError(502, 'Could not get a delivery fee from Lalamove. Please try again.');
  }
  return {
    fee,
    serviceType: vehicle.serviceType,
    vehicleLabel: vehicle.label,
    vehicleMaxKg: vehicle.maxKg,
    weightKg,
    distanceKm: quotation.distance?.value ? round2(Number(quotation.distance.value) / 1000) : null,
    breakdown: feeBreakdown(quotation.priceBreakdown),
  };
}

// Lalamove's priceBreakdown keys, in the order customers should read them.
const BREAKDOWN_LABELS = {
  base: 'Base fare',
  extraMileage: 'Distance charge',
  surcharge: 'Surcharge (peak hours / holidays)',
  specialRequests: 'Special requests',
  multiStopSurcharge: 'Extra stop',
  minimumSurcharge: 'Minimum fare top-up',
  adminFee: 'Service fee',
  priorityFee: 'Priority fee',
};

/** Non-zero fee lines, e.g. [{ key: 'base', label: 'Base fare', amount: 39 }, ...]. */
function feeBreakdown(priceBreakdown = {}) {
  return Object.entries(BREAKDOWN_LABELS)
    .map(([key, label]) => ({ key, label, amount: Number(priceBreakdown[key]) }))
    .filter((line) => line.amount > 0);
}

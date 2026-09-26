import { getLalamoveQuotation } from '../utils/lalamoveClient.js';
import { HttpError } from '../utils/httpError.js';

// Must match client/src/components/site/DeliveryMap.jsx's FARM_CENTER - the
// farm is the pickup point for every Lalamove booking.
export const FARM_PICKUP = { lat: 14.3585, lng: 120.8155, address: 'Profetas Integrated Farm, Tres Cruces, Tanza, Cavite' };

/** Live Lalamove price (PHP) for farm -> the given drop-off, based on distance. */
export async function quoteLalamoveFee({ lat, lng, address }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new HttpError(400, 'Please pin your delivery location on the map.');
  }

  const quotation = await getLalamoveQuotation({
    pickup: FARM_PICKUP,
    dropoff: { lat, lng, address: address || 'Delivery address' },
  });

  const fee = Number(quotation?.priceBreakdown?.total);
  if (!Number.isFinite(fee)) {
    throw new HttpError(502, 'Could not get a delivery fee from Lalamove. Please try again.');
  }
  return fee;
}

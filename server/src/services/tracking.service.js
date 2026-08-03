/**
 * Simulated Lalamove courier booking - there is no real courier API
 * integration in this app (same as the original PHP admin panel), just a
 * fake reference string in the same shape a real Lalamove booking would use.
 */
export function generateTrackingNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `LM${datePart}-${randomPart}`;
}

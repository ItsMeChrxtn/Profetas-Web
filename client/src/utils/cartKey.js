// A product can sit in the cart twice: at the regular price (from the shop) and at
// the wholesale price (from the wholesale page), so wholesale lines get their own key.
const WHOLESALE_SUFFIX = ':wholesale';

export function cartKey(productId, wholesale) {
  return wholesale ? `${productId}${WHOLESALE_SUFFIX}` : String(productId);
}

export function parseCartKey(key) {
  const wholesale = key.endsWith(WHOLESALE_SUFFIX);
  return { productId: wholesale ? key.slice(0, -WHOLESALE_SUFFIX.length) : key, wholesale };
}

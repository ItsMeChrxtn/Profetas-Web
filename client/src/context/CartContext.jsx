import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/cart.js';
import { cartKey, parseCartKey } from '../utils/cartKey.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'profetas_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function toItemsArray(items) {
  return Object.entries(items).map(([key, quantity]) => ({ ...parseCartKey(key), quantity }));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const count = useMemo(() => Object.values(items).reduce((sum, qty) => sum + qty, 0), [items]);

  // Keeps only these lines. Without this, products that were removed stay in the
  // browser's saved cart and the badge shows a number over an empty cart.
  const keepOnly = useCallback((keys) => {
    setItems((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([key]) => keys.includes(key)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, []);

  useEffect(() => {
    const requested = toItemsArray(items);
    if (requested.length === 0) return;
    cartApi
      .validate(requested)
      .then((data) => keepOnly(data.items.map((item) => cartKey(item.productId, item.isWholesalePrice))))
      .catch(() => {}); // offline or server error: leave the cart alone
    // Only on first load; the Cart page re-checks whenever it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Mirrors the original cart-add.php all-or-nothing live-stock check before committing to local state. */
  const addItem = useCallback(
    async (productId, quantity, { wholesale = false } = {}) => {
      const key = cartKey(productId, wholesale);
      const currentQuantity = items[key] || 0;
      await cartApi.checkAdd(productId, currentQuantity, quantity, wholesale);
      setItems((prev) => ({ ...prev, [key]: (prev[key] || 0) + quantity }));
    },
    [items]
  );

  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: quantity };
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems({}), []);

  // After checking out only some lines, drop just those.
  const removeItems = useCallback((keys) => {
    setItems((prev) => {
      const next = { ...prev };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  const asItemsArray = useCallback(() => toItemsArray(items), [items]);

  return (
    <CartContext.Provider value={{ items, count, addItem, updateQuantity, removeItem, removeItems, keepOnly, clear, asItemsArray }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

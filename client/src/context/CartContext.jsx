import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/cart.js';

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

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const count = useMemo(() => Object.values(items).reduce((sum, qty) => sum + qty, 0), [items]);

  /** Mirrors the original cart-add.php all-or-nothing live-stock check before committing to local state. */
  const addItem = useCallback(
    async (productId, quantity) => {
      const currentQuantity = items[productId] || 0;
      await cartApi.checkAdd(productId, currentQuantity, quantity);
      setItems((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + quantity }));
    },
    [items]
  );

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: quantity };
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems({}), []);

  // After checking out only some lines, drop just those.
  const removeItems = useCallback((productIds) => {
    setItems((prev) => {
      const next = { ...prev };
      productIds.forEach((id) => delete next[id]);
      return next;
    });
  }, []);

  const asItemsArray = useCallback(() => Object.entries(items).map(([productId, quantity]) => ({ productId, quantity })), [items]);

  return (
    <CartContext.Provider value={{ items, count, addItem, updateQuantity, removeItem, removeItems, clear, asItemsArray }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

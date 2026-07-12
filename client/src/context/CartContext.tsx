'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  CartItem,
  CartVariant,
  fetchCart,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from '@/services/cart';

// ── Context value shape ─────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  isLoading: boolean;
  cartCount: number;
  subtotal: number;
  addToCart: (variantId: string, quantity?: number, variantSnapshot?: CartVariant | null) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Derived values ──────────────────────────────────────────────────────

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = items.reduce((sum, i) => {
    if (i.productUnavailable || !i.variant) return sum;
    return sum + parseFloat(i.variant.price) * i.quantity;
  }, 0);

  // ── Load cart on mount / auth change ────────────────────────────────────

  const loadAuthCart = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const serverItems = await fetchCart(accessToken);
      setItems(serverItems);
    } catch (err: any) {
      console.error('Failed to fetch cart:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (user && accessToken) {
      loadAuthCart();
    } else {
      setItems([]);
    }
  }, [user, accessToken, loadAuthCart]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const refreshCart = useCallback(async () => {
    if (accessToken) {
      await loadAuthCart();
    } else {
      setItems([]);
    }
  }, [accessToken, loadAuthCart]);

  const addToCart = useCallback(
    async (variantId: string, quantity: number = 1, variantSnapshot: CartVariant | null = null) => {
      if (!accessToken) {
        toast.error('Please log in to add items to your cart.');
        return;
      }

      const existingIdx = items.findIndex((i) => i.variantId === variantId);
      const prevItems = [...items];

      if (existingIdx >= 0) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item,
          ),
        );
      } else {
        const tempItem: CartItem = {
          id: `temp-${Date.now()}`,
          variantId,
          quantity,
          productUnavailable: false,
          variant: variantSnapshot,
        };
        setItems((prev) => [...prev, tempItem]);
      }

      try {
        await addToCartApi(accessToken, variantId, quantity);
        toast.success('Item added to cart.');
        await loadAuthCart();
      } catch (err: any) {
        setItems(prevItems);
        toast.error(err.message || 'Failed to add item');
      }
    },
    [accessToken, items, loadAuthCart],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      if (!accessToken) return;

      const prevItems = [...items];
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
      );

      try {
        await updateCartItemApi(accessToken, itemId, quantity);
      } catch (err: any) {
        setItems(prevItems);
        toast.error(err.message || 'Failed to update quantity');
      }
    },
    [accessToken, items],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!accessToken) return;

      const prevItems = [...items];
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      try {
        await removeCartItemApi(accessToken, itemId);
        toast.success('Item removed');
      } catch (err: any) {
        setItems(prevItems);
        toast.error(err.message || 'Failed to remove item');
      }
    },
    [accessToken, items],
  );

  const clearCart = useCallback(async () => {
    if (!accessToken) return;
    setItems([]);
    try {
      await clearCartApi(accessToken);
    } catch (err) {
      await loadAuthCart();
      throw err;
    }
  }, [accessToken, loadAuthCart]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        cartCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

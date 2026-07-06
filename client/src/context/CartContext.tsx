'use client';
/* eslint-disable */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
  mergeCartApi,
} from '@/services/cart';

// ── Guest cart types (localStorage) ─────────────────────────────────────────

interface GuestCartItem {
  variantId: string;
  quantity: number;
  // Snapshot of variant details for instant rendering (reconciled on merge)
  variant: CartVariant | null;
}

const GUEST_CART_KEY = 'viewora_guest_cart';

function readGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

// ── Context value shape ─────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  isLoading: boolean;
  cartCount: number;
  subtotal: number;
  addToCart: (variantId: string, quantity?: number, variantSnapshot?: CartVariant | null) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Track previous auth state to detect login transitions
  const prevUserRef = useRef<typeof user>(undefined);
  const hasMergedRef = useRef(false);

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

  const loadGuestCart = useCallback(() => {
    const guestItems = readGuestCart();
    setItems(
      guestItems.map((g) => ({
        id: g.variantId, // Use variantId as a pseudo-id for guest items
        variantId: g.variantId,
        quantity: g.quantity,
        productUnavailable: false,
        variant: g.variant,
      })),
    );
  }, []);

  // When user logs in: merge guest cart → server, then load server cart
  useEffect(() => {
    const wasGuest = prevUserRef.current === null || prevUserRef.current === undefined;
    const isNowAuthed = !!user && !!accessToken;

    if (wasGuest && isNowAuthed && !hasMergedRef.current) {
      hasMergedRef.current = true;
      const guestItems = readGuestCart();

      if (guestItems.length > 0) {
        const mergeItems = guestItems.map((g) => ({
          variantId: g.variantId,
          quantity: g.quantity,
        }));

        mergeCartApi(accessToken, mergeItems)
          .then((result) => {
            clearGuestCart();
            if (result.skippedItems.length > 0) {
              const skippedCount = result.skippedItems.length;
              toast.warning(
                `${skippedCount} item${skippedCount > 1 ? 's' : ''} couldn't be added — unavailable or out of stock`,
              );
            } else {
              toast.success('Your cart has been synced');
            }
            loadAuthCart();
          })
          .catch(() => {
            toast.error('Failed to sync your cart. Please try again.');
            loadAuthCart();
          });
      } else {
        loadAuthCart();
      }
    } else if (isNowAuthed) {
      loadAuthCart();
    } else if (!user) {
      hasMergedRef.current = false;
      loadGuestCart();
    }

    prevUserRef.current = user;
  }, [user, accessToken, loadAuthCart, loadGuestCart]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const refreshCart = useCallback(async () => {
    if (accessToken) {
      await loadAuthCart();
    } else {
      loadGuestCart();
    }
  }, [accessToken, loadAuthCart, loadGuestCart]);

  const addToCart = useCallback(
    async (variantId: string, quantity: number = 1, variantSnapshot: CartVariant | null = null) => {
      if (accessToken) {
        // ── Authenticated: call API with optimistic update ──
        const existingIdx = items.findIndex((i) => i.variantId === variantId);
        const prevItems = [...items];

        if (existingIdx >= 0) {
          // Optimistic: increment quantity
          setItems((prev) =>
            prev.map((item, idx) =>
              idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item,
            ),
          );
        } else {
          // Optimistic: add new item
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
          toast.success('Added to cart');
          // Refresh to get accurate server state
          await loadAuthCart();
        } catch (err: any) {
          setItems(prevItems);
          toast.error(err.message || 'Failed to add item');
        }
      } else {
        // ── Guest: localStorage ──
        const guestItems = readGuestCart();
        const existingIdx = guestItems.findIndex((g) => g.variantId === variantId);

        if (existingIdx >= 0) {
          guestItems[existingIdx].quantity += quantity;
        } else {
          guestItems.push({ variantId, quantity, variant: variantSnapshot });
        }

        writeGuestCart(guestItems);
        loadGuestCart();
        toast.success('Added to cart');
      }
    },
    [accessToken, items, loadAuthCart, loadGuestCart],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;

      if (accessToken) {
        // Optimistic update
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
      } else {
        // Guest: itemId is variantId
        const guestItems = readGuestCart();
        const idx = guestItems.findIndex((g) => g.variantId === itemId);
        if (idx >= 0) {
          guestItems[idx].quantity = quantity;
          writeGuestCart(guestItems);
          loadGuestCart();
        }
      }
    },
    [accessToken, items, loadGuestCart],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (accessToken) {
        // Optimistic removal
        const prevItems = [...items];
        setItems((prev) => prev.filter((item) => item.id !== itemId));

        try {
          await removeCartItemApi(accessToken, itemId);
          toast.success('Item removed');
        } catch (err: any) {
          setItems(prevItems);
          toast.error(err.message || 'Failed to remove item');
        }
      } else {
        // Guest: itemId is variantId
        const guestItems = readGuestCart().filter((g) => g.variantId !== itemId);
        writeGuestCart(guestItems);
        loadGuestCart();
        toast.success('Item removed');
      }
    },
    [accessToken, items, loadGuestCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (!accessToken) {
      clearGuestCart();
    }
  }, [accessToken]);

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

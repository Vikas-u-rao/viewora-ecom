'use client';

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
  mergeCartApi,
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
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to fetch cart:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const syncOrMergeCart = async () => {
      if (user && accessToken) {
        const stored = localStorage.getItem('viewora_guest_cart');
        if (stored) {
          try {
            const guestItems: CartItem[] = JSON.parse(stored);
            if (guestItems.length > 0) {
              await mergeCartApi(
                accessToken,
                guestItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
              );
              localStorage.removeItem('viewora_guest_cart');
              toast.success('Your guest cart was merged with your account.');
            }
          } catch (err) {
            console.error('Failed to merge guest cart:', err);
            // Restore guest cart locally so the user doesn't lose their items
            toast.warning('We could not merge your cart. Your saved items have been restored. Please try adding them again after refreshing.', {
              duration: 6000,
            });
            // Keep the guest cart items in localStorage for next attempt
          }
        }
        await loadAuthCart();
      } else {
        const stored = localStorage.getItem('viewora_guest_cart');
        if (stored) {
          try {
            setItems(JSON.parse(stored));
          } catch {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      }
    };

    syncOrMergeCart();
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
        const existingIdx = items.findIndex((i) => i.variantId === variantId);
        const existingQty = existingIdx >= 0 ? items[existingIdx].quantity : 0;
        const stock = variantSnapshot?.stock ?? 999;
        const targetQty = existingQty + quantity;
        if (targetQty > stock) {
          const msg = stock > 0
            ? `Only ${stock} unit${stock === 1 ? '' : 's'} in stock. You already have ${existingQty} in cart.`
            : 'This product is out of stock.';
          toast.error(msg);
          return;
        }
        let newItems: CartItem[] = [];
        if (existingIdx >= 0) {
          newItems = items.map((item, idx) =>
            idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item,
          );
        } else {
          const newItem: CartItem = {
            id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            variantId,
            quantity,
            productUnavailable: false,
            variant: variantSnapshot,
          };
          newItems = [...items, newItem];
        }
        setItems(newItems);
        localStorage.setItem('viewora_guest_cart', JSON.stringify(newItems));
        toast.success('Item added to cart.');
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
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setItems(prevItems);
        toast.error(err.message || 'Failed to add item');
      }
    },
    [accessToken, items, loadAuthCart],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      if (!accessToken) {
        const newItems = items.map((item) => (item.id === itemId ? { ...item, quantity } : item));
        setItems(newItems);
        localStorage.setItem('viewora_guest_cart', JSON.stringify(newItems));
        return;
      }

      const prevItems = [...items];
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
      );

      try {
        await updateCartItemApi(accessToken, itemId, quantity);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setItems(prevItems);
        toast.error(err.message || 'Failed to update quantity');
      }
    },
    [accessToken, items],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!accessToken) {
        const newItems = items.filter((item) => item.id !== itemId);
        setItems(newItems);
        localStorage.setItem('viewora_guest_cart', JSON.stringify(newItems));
        toast.success('Item removed');
        return;
      }

      const prevItems = [...items];
      setItems((prev) => prev.filter((item) => item.id !== itemId));

      try {
        await removeCartItemApi(accessToken, itemId);
        toast.success('Item removed');
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        setItems(prevItems);
        toast.error(err.message || 'Failed to remove item');
      }
    },
    [accessToken, items],
  );

  const clearCart = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      localStorage.removeItem('viewora_guest_cart');
      return;
    }
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

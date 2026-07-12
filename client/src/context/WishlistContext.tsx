'use client';
/* eslint-disable react-hooks/set-state-in-effect */

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
  WishlistItem,
  fetchWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
} from '@/services/wishlist';

// ── Context value shape ─────────────────────────────────────────────────────

interface WishlistContextValue {
  items: WishlistItem[];
  isLoading: boolean;
  wishlistCount: number;
  isWishlisted: (productId: string) => boolean;
  getWishlistItemId: (productId: string) => string | null;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────

  const wishlistCount = items.length;

  const isWishlisted = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items],
  );

  const getWishlistItemId = useCallback(
    (productId: string) => items.find((item) => item.productId === productId)?.id ?? null,
    [items],
  );

  // ── Load wishlist ───────────────────────────────────────────────────────

  const loadWishlist = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await fetchWishlistApi(accessToken);
      setItems(data.wishlistItems);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load wishlist';
      console.error('Wishlist load error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Load on mount / auth change
  useEffect(() => {
    if (user && accessToken) {
      loadWishlist();
    } else {
      setItems([]);
    }
  }, [user, accessToken, loadWishlist]);

  const refreshWishlist = useCallback(async () => {
    await loadWishlist();
  }, [loadWishlist]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const addToWishlist = useCallback(
    async (productId: string) => {
      if (!accessToken) {
        toast.error('Please log in to save items to your wishlist.');
        return;
      }

      // Optimistic: assume success, will revert on error
      try {
        const { wishlistItem } = await addToWishlistApi(accessToken, productId);
        setItems((prev) => {
          // Avoid duplicates if already present
          if (prev.some((i) => i.productId === productId)) return prev;
          return [wishlistItem, ...prev];
        });
        toast.success('Added to wishlist');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add to wishlist';
        toast.error(message);
      }
    },
    [accessToken],
  );

  const removeFromWishlist = useCallback(
    async (itemId: string) => {
      if (!accessToken) return;

      // Optimistic removal
      const prevItems = [...items];
      setItems((prev) => prev.filter((i) => i.id !== itemId));

      try {
        await removeFromWishlistApi(accessToken, itemId);
        toast.success('Removed from wishlist');
      } catch (err: unknown) {
        setItems(prevItems); // Revert on error
        const message = err instanceof Error ? err.message : 'Failed to remove from wishlist';
        toast.error(message);
      }
    },
    [accessToken, items],
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!accessToken) {
        toast.error('Please log in to save items to your wishlist.');
        return;
      }

      const itemId = getWishlistItemId(productId);
      if (itemId) {
        await removeFromWishlist(itemId);
      } else {
        await addToWishlist(productId);
      }
    },
    [accessToken, getWishlistItemId, addToWishlist, removeFromWishlist],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        wishlistCount,
        isWishlisted,
        getWishlistItemId,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

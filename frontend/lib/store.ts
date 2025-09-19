'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, UserProfile } from './types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

interface AuthStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

interface FavoritesStore {
  favorites: string[]; // Array of product IDs
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getFavoritesCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.product.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        });
      },
      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => {
        const price = item.product.price || 0;
        return total + (price * item.quantity);
      }, 0)
    }),
    {
      name: 'topgel-cart'
    }
  )
);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (email === 'cliente@example.com' && password === 'password123') {
          const user: UserProfile = {
            id: '1',
            name: 'Juan Pérez',
            email: 'cliente@example.com',
            company: 'Restaurante El Buen Sabor',
            phone: '+34 666 123 456'
          };
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (data) => set(state => ({
        user: state.user ? { ...state.user, ...data } : null
      }))
    }),
    {
      name: 'topgel-auth'
    }
  )
);

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (productId: string) => {
        const favorites = get().favorites;
        if (!favorites.includes(productId)) {
          set({ favorites: [...favorites, productId] });
        }
      },
      removeFavorite: (productId: string) => {
        set({ favorites: get().favorites.filter(id => id !== productId) });
      },
      toggleFavorite: (productId: string) => {
        const isFavorite = get().isFavorite(productId);
        if (isFavorite) {
          get().removeFavorite(productId);
        } else {
          get().addFavorite(productId);
        }
      },
      isFavorite: (productId: string) => {
        return get().favorites.includes(productId);
      },
      getFavoritesCount: () => get().favorites.length
    }),
    {
      name: 'topgel-favorites'
    }
  )
);
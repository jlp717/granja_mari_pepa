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
  resetStore: () => void;
}

interface LoginResult {
  success: boolean;
  showPasswordChangeModal?: boolean;
  requiresEmailSetup?: boolean;
  message?: string;
}

interface AuthStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (codigoCliente: string, password: string) => Promise<LoginResult>;
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
      getTotalItems: () => {
        const items = get().items;
        const total = items.reduce((total, item) => total + item.quantity, 0);
        // Debug logging for cart sync issues
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('🛒 Cart items:', items.length, 'Total quantity:', total);
        }
        return total;
      },
      getTotalPrice: () => get().items.reduce((total, item) => {
        const price = item.product.price || 0;
        return total + (price * item.quantity);
      }, 0),
      resetStore: () => {
        // Clear localStorage and reset state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('topgel-cart');
          console.log('🛒 Cart store reset - localStorage cleared');
        }
        set({ items: [], isOpen: false });
      }
    }),
    {
      name: 'topgel-cart'
    }
  )
);

/**
 * ====================================================================
 * SEGURIDAD: Auth Store con HttpOnly Cookies
 * ====================================================================
 * Los tokens JWT ahora se almacenan en cookies HttpOnly configuradas
 * por el backend. El frontend NO tiene acceso a los tokens directamente.
 * Esto previene ataques XSS de robo de tokens.
 * ====================================================================
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      /**
       * Login seguro - Los tokens se reciben como HttpOnly cookies
       * El frontend solo almacena información del usuario, NO tokens
       */
      login: async (codigoCliente: string, password: string) => {
        try {
          const response = await fetch('/api/auth/v2/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // 🔐 CRÍTICO: Permite enviar/recibir cookies HttpOnly
            body: JSON.stringify({
              codigoCliente: codigoCliente.trim(),
              password: password.trim()
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            const user: UserProfile = {
              id: data.cliente.codigoCliente,
              customerId: data.cliente.id || data.cliente.customerId, // ID numérico del backend
              name: data.cliente.nombre,
              email: data.cliente.email || '',
              company: data.cliente.nombreAlternativo || data.cliente.nombreComercial || data.cliente.nombre,
              phone: data.cliente.telefono
            };

            // 🔐 SEGURIDAD: NO guardamos tokens en localStorage
            // Los tokens HttpOnly son configurados automáticamente por el backend
            // Limpiar cualquier token legacy que pudiera existir
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            }

            set({ user, isAuthenticated: true });

            // ✅ Devolver objeto completo
            return {
              success: true,
              showPasswordChangeModal: data.showPasswordChangeModal || false,
              requiresEmailSetup: data.requiresEmailSetup || false,
              message: data.message
            };
          }

          // Special case: Login successful but requires email setup
          if (response.ok && data.success && data.requiresEmailSetup) {
            // 🔐 DO NOT set isAuthenticated: true yet
            // Return success so UI can show the setup modal, but keep app locked
            return {
              success: true,
              requiresEmailSetup: true,
              message: 'Configuración de email requerida'
            };
          }

          return { success: false };
        } catch (error) {
          console.error('Error en login:', error);
          return { success: false };
        }
      },

      /**
       * Logout seguro - El backend limpia las cookies HttpOnly
       */
      logout: async () => {
        try {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // 🔐 Envía cookies para que el backend las invalide
            });
          } catch (error) {
            console.warn('Error calling logout endpoint:', error);
            // Continuar con logout local incluso si el backend falla
          }

          // 🔐 Limpiar cualquier token legacy de localStorage (por si migración)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }

          // Limpiar estado de autenticación
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Error en logout:', error);
          // 🔐 Forzar limpieza completa en caso de error
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
          set({ user: null, isAuthenticated: false });
        }
      },

      updateProfile: (data) => set(state => ({
        user: state.user ? { ...state.user, ...data } : null
      }))
    }),
    {
      name: 'topgel-auth',
      // 🔐 Solo persistir user info, nunca tokens
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
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
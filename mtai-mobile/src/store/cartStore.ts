import { create } from 'zustand';
import api from '../api/client';
import { CartItem, Product } from '../api/types';

interface CartState {
  items: CartItem[];
  businessId: number | null;
  addItem: (product: Product, businessId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  businessId: null,

  addItem: (product, businessId) => {
    const { items, businessId: currentBizId } = get();
    if (currentBizId && currentBizId !== businessId) {
      set({ items: [], businessId });
    }
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
        businessId,
      });
    } else {
      set({ items: [...items, { product, quantity: 1 }], businessId });
    }
  },

  removeItem: (productId) => {
    const items = get().items.filter((i) => i.product.id !== productId);
    set({ items, businessId: items.length === 0 ? null : get().businessId });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [], businessId: null }),

  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

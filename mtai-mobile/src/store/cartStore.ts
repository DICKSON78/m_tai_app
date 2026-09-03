import { create } from 'zustand';
import api from '../api/client';
import { CartItem, Product } from '../api/types';

function priceOf(product: Product): number {
  const price = Number(product.price ?? 0);
  if (price > 0) return price;
  const selling = Number((product as any)?.selling_price ?? 0);
  if (selling > 0) return selling;
  return Number((product as any)?.retail_price ?? 0);
}

function normalizeProduct(product: Product): Product {
  const price = priceOf(product);
  return { ...product, price, compare_at_price: product.compare_at_price };
}

interface CartState {
  items: CartItem[];
  businessId: number | null;
  addItem: (product: Product, businessId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loadServerCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

async function syncAdd(product: Product, quantity: number) {
  try {
    await api.post('/cart', {
      product_id: product.id,
      quantity,
      price_type: 'selling',
    });
  } catch {
    // best-effort; cart stays local when offline/unauthorized
  }
}

async function syncRemove(productId: number) {
  try {
    await api.delete(`/cart/product_${productId}`);
  } catch {
    // best-effort
  }
}

async function syncUpdate(productId: number, quantity: number) {
  try {
    await api.put(`/cart/product_${productId}`, { quantity });
  } catch {
    // best-effort
  }
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
    const nextQuantity = existing ? existing.quantity + 1 : 1;
    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: nextQuantity } : i
        ),
        businessId,
      });
    } else {
      set({ items: [...items, { product: normalizeProduct(product), quantity: 1 }], businessId });
    }
    syncAdd(product, 1);
  },

  removeItem: (productId) => {
    const items = get().items.filter((i) => i.product.id !== productId);
    set({ items, businessId: items.length === 0 ? null : get().businessId });
    syncRemove(productId);
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
    syncUpdate(productId, quantity);
  },

  clearCart: () => {
    set({ items: [], businessId: null });
    try {
      void api.delete('/cart');
    } catch {
      // best-effort
    }
  },

  loadServerCart: async () => {
    try {
      const res = await api.get('/cart');
      const body = res.data as {
        items?: Array<{
          product_id: number;
          name: string;
          image?: string | null;
          price: number;
          quantity: number;
          business_id?: number | null;
        }>;
      };
      const items = Array.isArray(body?.items) ? body.items : [];
      const mapped: CartItem[] = items.map((item) => ({
        product: {
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          images: item.image ? [{ id: 0, url: item.image }] : undefined,
        } as Product,
        quantity: item.quantity,
      }));
      if (mapped.length > 0) {
        const first = items[0];
        set({
          items: mapped,
          businessId: first?.business_id != null ? Number(first.business_id) : null,
        });
      } else {
        set({ items: [], businessId: null });
      }
    } catch {
      // cart stays local when server is unavailable
    }
  },

  getTotal: () =>
    get().items.reduce((sum, i) => sum + priceOf(i.product) * i.quantity, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));

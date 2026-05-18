import { create } from 'zustand';
import { Order, Bid } from '@/types';
import { ordersAPI, bidsAPI } from '@/lib/api';

interface OrderStore {
  orders: Order[];
  activeOrder: Order | null;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  filters: { category?: string; urgency?: string; status?: string };

  fetchOrders: (reset?: boolean) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (data: Record<string, unknown>) => Promise<Order>;
  updateOrderStatus: (id: string, status: string, note?: string) => Promise<void>;
  acceptOrder: (id: string) => Promise<void>;
  addNewOrder: (order: Order) => void;
  updateOrderInList: (order: Order) => void;
  setFilters: (filters: Partial<{ category?: string; urgency?: string; status?: string }>) => void;
  setActiveOrder: (order: Order | null) => void;

  // Bids
  placeBid: (orderId: string, data: { price: number; message?: string; estimatedTime?: number }) => Promise<Bid>;
  acceptBid: (orderId: string, bidId: string) => Promise<void>;
  addBidToOrder: (orderId: string, bid: Bid) => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  activeOrder: null,
  isLoading: false,
  hasMore: true,
  page: 1,
  filters: {},

  fetchOrders: async (reset = false) => {
    const { page, filters, isLoading } = get();
    if (isLoading) return;

    const currentPage = reset ? 1 : page;
    set({ isLoading: true });

    try {
      const { data } = await ordersAPI.getAll({ page: currentPage, limit: 20, ...filters });
      const newOrders = data.orders || [];
      set({
        orders: reset ? newOrders : [...get().orders, ...newOrders],
        page: currentPage + 1,
        hasMore: newOrders.length === 20,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await ordersAPI.getById(id);
      set({ activeOrder: data.order, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createOrder: async (formData) => {
    const { data } = await ordersAPI.create(formData);
    return data.order;
  },

  updateOrderStatus: async (id, status, note) => {
    const { data } = await ordersAPI.updateStatus(id, status, note);
    const updatedOrder = data.order;
    set((state) => ({
      orders: state.orders.map((o) => (o._id === id ? updatedOrder : o)),
      activeOrder: state.activeOrder?._id === id ? updatedOrder : state.activeOrder,
    }));
  },

  acceptOrder: async (id) => {
    const { data } = await ordersAPI.accept(id);
    const updatedOrder = data.order;
    set((state) => ({
      orders: state.orders.filter((o) => o._id !== id),
      activeOrder: updatedOrder,
    }));
  },

  addNewOrder: (order) => {
    set((state) => ({ orders: [order, ...state.orders] }));
  },

  updateOrderInList: (order) => {
    if (!order?._id) return;
    set((state) => ({
      orders: state.orders.map((o) => (o._id === order._id ? order : o)),
      activeOrder: state.activeOrder?._id === order._id ? order : state.activeOrder,
    }));
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters }, page: 1, orders: [] });
  },

  setActiveOrder: (order) => set({ activeOrder: order }),

  placeBid: async (orderId, bidData) => {
    const { data } = await bidsAPI.place(orderId, bidData);
    return data.bid;
  },

  acceptBid: async (orderId, bidId) => {
    const { data } = await bidsAPI.accept(orderId, bidId);
    const updatedOrder = data.order;
    set((state) => ({
      orders: state.orders.map((o) => (o._id === orderId ? updatedOrder : o)),
      activeOrder: state.activeOrder?._id === orderId ? updatedOrder : state.activeOrder,
    }));
  },

  addBidToOrder: (orderId, bid) => {
    set((state) => ({
      activeOrder:
        state.activeOrder?._id === orderId
          ? { ...state.activeOrder, bids: [...(state.activeOrder.bids || []), bid] }
          : state.activeOrder,
    }));
  },
}));

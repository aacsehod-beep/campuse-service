'use client';

import { useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Order, Bid, Message } from '@/types';
import toast from 'react-hot-toast';

export function useSocket() {
  const { token, user } = useAuthStore();
  const { addNewOrder, updateOrderInList, addBidToOrder } = useOrderStore();
  const { addNotification } = useNotificationStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!token || initialized.current) return;
    initialized.current = true;

    const socket = connectSocket(token);

    // New order broadcasted (for providers)
    socket.on('new_order', ({ order }: { order: Order }) => {
      if (order.userId._id !== user?._id) {
        addNewOrder(order);
        addNotification({
          type: 'new_order',
          title: `New ${order.category} request`,
          message: order.description.slice(0, 80),
          orderId: order._id,
        });
        toast(`📦 New request: ${order.description.slice(0, 50)}`, { icon: '🔔' });
      }
    });

    // New bid placed
    socket.on('new_bid', ({ bid, orderId }: { bid: Bid; orderId: string }) => {
      addBidToOrder(orderId, bid);
      if (bid.userId._id !== user?._id) {
        addNotification({
          type: 'new_bid',
          title: 'New bid received',
          message: `${bid.userId.name} bid ₹${bid.price}`,
          orderId,
        });
        toast(`💰 New bid: ₹${bid.price} from ${bid.userId.name}`);
      }
    });

    // Bid accepted
    socket.on('bid_accepted', ({ bid, order }: { bid: Bid; order: Order; orderId: string }) => {
      updateOrderInList(order);
      if (bid.userId._id === user?._id) {
        addNotification({
          type: 'bid_accepted',
          title: 'Your bid was accepted! 🎉',
          message: `Your bid of ₹${bid.price} was selected`,
          orderId: order._id,
        });
        toast.success(`🎉 Your bid of ₹${bid.price} was accepted!`);
      }
    });

    // Order status update
    socket.on('order_status_update', ({ order }: { order: Order; orderId: string; status: string }) => {
      updateOrderInList(order);
      const isInvolved =
        order.userId._id === user?._id || order.assignedTo?._id === user?._id;
      if (isInvolved) {
        addNotification({
          type: 'status_update',
          title: 'Order Updated',
          message: `Status changed to ${order.status}`,
          orderId: order._id,
        });
      }
    });

    return () => {
      initialized.current = false;
    };
  }, [token, user, addNewOrder, updateOrderInList, addBidToOrder, addNotification]);

  return getSocket();
}

export function useOrderSocket(orderId: string) {
  const socket = getSocket();

  const onNewMessage = (handler: (msg: Message) => void) => {
    socket?.on('new_message', ({ message }: { message: Message }) => handler(message));
    return () => socket?.off('new_message');
  };

  const onStatusUpdate = (handler: (data: { order: Order; status: string }) => void) => {
    socket?.on('order_status_update', handler);
    return () => socket?.off('order_status_update');
  };

  return { socket, onNewMessage, onStatusUpdate };
}

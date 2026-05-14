import { useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Order, Bid, Message } from '@/types';
import Toast from 'react-native-toast-message';

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
        Toast.show({
          type: 'info',
          text1: '📦 New Request',
          text2: order.description.slice(0, 60),
        });
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
        Toast.show({
          type: 'info',
          text1: '💰 New Bid',
          text2: `₹${bid.price} from ${bid.userId.name}`,
        });
      }
    });

    // Bid accepted
    socket.on('bid_accepted', ({ bid, order }: { bid: Bid; order: Order }) => {
      updateOrderInList(order);
      if (bid.userId._id === user?._id) {
        addNotification({
          type: 'bid_accepted',
          title: 'Your bid was accepted! 🎉',
          message: `Your bid of ₹${bid.price} was selected`,
          orderId: order._id,
        });
        Toast.show({
          type: 'success',
          text1: '🎉 Bid Accepted!',
          text2: `Your bid of ₹${bid.price} was selected`,
        });
      }
    });

    // Order status update
    socket.on('order_status_update', ({ order }: { order: Order }) => {
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

export function useOrderSocket(_orderId: string) {
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

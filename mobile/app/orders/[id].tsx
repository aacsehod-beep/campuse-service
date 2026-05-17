import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { messagesAPI, reviewsAPI, bidsAPI } from '@/lib/api';
import { Message, STATUS_META, CATEGORY_META, Bid } from '@/types';
import { timeAgo, formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { getSocket, joinOrderRoom, leaveOrderRoom, emitTypingStart, emitTypingStop } from '@/lib/socket';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeOrder, isLoading, fetchOrderById, updateOrderStatus, acceptOrder, acceptBid, placeBid } = useOrderStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDone, setReviewDone] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [myBidOverride, setMyBidOverride] = useState<Bid | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderById(id);
      loadMessages(id);
      joinOrderRoom(id);

      const socket = getSocket();
      socket?.on('new_message', ({ message }: { message: Message }) => {
        setMessages((prev) => [...prev, message]);
      });
      socket?.on('order_status_update', () => {
        fetchOrderById(id);
      });
      socket?.on('new_bid', () => {
        fetchOrderById(id);
      });
    }
    return () => {
      if (id) leaveOrderRoom(id);
      const socket = getSocket();
      socket?.off('new_message');
      socket?.off('order_status_update');
      socket?.off('new_bid');
    };
  }, [id]);

  useEffect(() => {
    if (!id || !user?._id) return;
    bidsAPI
      .getByOrder(id)
      .then(({ data }) => {
        const bids = (data?.bids || []) as Bid[];
        const mine = bids.find((b) => {
          const bidUserId = typeof b.userId === 'string' ? b.userId : b.userId?._id;
          return bidUserId === user._id;
        });
        setMyBidOverride(mine || null);
      })
      .catch(() => {
        setMyBidOverride(null);
      });
  }, [id, user?._id]);

  // Bid countdown — tick every second from order creation
  useEffect(() => {
    if (!activeOrder || !['CREATED', 'BROADCASTED'].includes(activeOrder.status)) return;
    const tick = () => {
      const created = new Date(activeOrder.createdAt).getTime();
      const elapsed = Date.now() - created;
      const WINDOW = 24 * 60 * 60 * 1000; // 24h bidding window
      const remaining = WINDOW - elapsed;
      if (remaining <= 0) { setCountdown('Bidding closed'); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [activeOrder?._id, activeOrder?.status]);

  const handleTrackOrder = async () => {
    const coords = activeOrder?.location?.coordinates;
    if (coords && coords[0] !== 0 && coords[1] !== 0) {
      const [lng, lat] = coords;
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url).catch(() =>
        Toast.show({ type: 'error', text1: 'Could not open Maps' })
      );
      return;
    }
    // Try to get user's current location as fallback
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Location permission denied' });
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const url = `https://www.google.com/maps/search/?api=1&query=${loc.coords.latitude},${loc.coords.longitude}`;
    Linking.openURL(url);
  };

  const loadMessages = async (orderId: string) => {
    try {
      const { data } = await messagesAPI.getMessages(orderId);
      setMessages(data.messages || []);
    } catch {}
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !id) return;
    const content = chatInput.trim();
    setChatInput('');
    try {
      await messagesAPI.send(id, content);
    } catch {}
  };

  const handleStatusUpdate = async (status: string) => {
    if (!id) return;
    try {
      await updateOrderStatus(id, status);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (status === 'COMPLETED') {
        Toast.show({ type: 'success', text1: 'Order completed successfully!' });
        router.replace('/(tabs)/feed' as any);
        return;
      }
      Toast.show({ type: 'success', text1: `Status updated to ${status}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status' });
    }
  };

  const handleAcceptOrder = async () => {
    if (!id) return;
    try {
      await acceptOrder(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Order accepted! 🎉' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to accept order' });
    }
  };

  const handlePlaceBid = async () => {
    if (!bidPrice || !id) {
      Toast.show({ type: 'error', text1: 'Please enter a price' });
      return;
    }
    setBidSubmitting(true);
    try {
      const createdBid = await placeBid(id, {
        price: parseFloat(bidPrice),
        message: bidMessage || undefined,
      });
      setMyBidOverride(createdBid as Bid);
      fetchOrderById(id);
      setBidSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to place bid';
      Toast.show({ type: 'error', text1: msg });
    }
    setBidSubmitting(false);
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!id) return;
    try {
      await acceptBid(id, bidId);
      Toast.show({ type: 'success', text1: 'Bid accepted! Provider assigned.' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to accept bid' });
    }
  };

  const handleReview = async () => {
    if (!activeOrder) return;
    const toUser = user?._id === activeOrder.userId._id
      ? activeOrder.assignedTo?._id
      : activeOrder.userId._id;
    if (!toUser) return;
    try {
      await reviewsAPI.createReview({ toUser, orderId: activeOrder._id, rating, comment: reviewComment });
      setReviewDone(true);
      Toast.show({ type: 'success', text1: 'Review submitted! ⭐' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to submit review' });
    }
  };

  if (isLoading && !activeOrder) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8b5cf6" size="large" />
      </View>
    );
  }

  if (!activeOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Order not found</Text>
      </View>
    );
  }

  const order = activeOrder;
  const isOwner = user?._id === order.userId._id;
  const isProvider = user?._id === order.assignedTo?._id;
  const statusMeta = STATUS_META[order.status];
  const catMeta = CATEGORY_META[order.category];
  const myBidFromOrder = (order.bids || []).find((b) => {
    const bidUserId = typeof b.userId === 'string' ? b.userId : b.userId?._id;
    return bidUserId === user?._id;
  });
  const myBid = myBidFromOrder || myBidOverride;

  const STATUS_STEPS = ['CREATED', 'BROADCASTED', 'ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Status banner */}
      <Card shadow style={[styles.statusBanner, { borderLeftWidth: 3, borderLeftColor: statusMeta.color }]}>
        <View style={styles.statusTop}>
          <View style={[styles.catIcon, { backgroundColor: catMeta.bg }]}>
            <Ionicons name={catMeta.icon as any} size={22} color={catMeta.color} />
          </View>
          <View style={styles.statusInfo}>
            <View style={styles.statusBadges}>
              <Badge label={statusMeta.label} color={statusMeta.color} bg={statusMeta.bg} />
              {order.urgency === 'asap' && (
                <Badge label="⚡ ASAP" color="#fb923c" bg="rgba(249,115,22,0.12)" />
              )}
              <Badge
                label={order.mode === 'bidding' ? '🔖 Bidding' : '💰 Fixed'}
                color="#60a5fa"
                bg="rgba(59,130,246,0.12)"
              />
            </View>
            <Text style={styles.orderDesc}>{order.description}</Text>
          </View>
        </View>
        {(order.finalPrice || order.budget) && (
          <Text style={styles.price}>
            {formatCurrency(order.finalPrice || order.budget || 0)}
          </Text>
        )}
        {order.location?.address && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#73897a" />
            <Text style={styles.locationText}>{order.location.address}</Text>
          </View>
        )}
        <Text style={styles.posted}>Posted {timeAgo(order.createdAt)}</Text>
        {/* Bid countdown */}
        {order.mode === 'bidding' && ['CREATED', 'BROADCASTED'].includes(order.status) && countdown ? (
          <View style={styles.countdownRow}>
            <Ionicons name="timer-outline" size={14} color="#f97316" />
            <Text style={styles.countdownText}>Bidding closes in {countdown}</Text>
          </View>
        ) : null}
        {/* Track order button */}
        {['ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'].includes(order.status) && (
          <TouchableOpacity onPress={handleTrackOrder} style={styles.trackBtn}>
            <Ionicons name="navigate-outline" size={14} color="#fff" />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Parties */}
      <View style={styles.row2}>
        <Card style={styles.partyCard}>
          <Text style={styles.partyRole}>Customer</Text>
          <Avatar name={order.userId.name} size={40} />
          <Text style={styles.partyName}>{order.userId.name}</Text>
          {order.userId.hostel && (
            <Text style={styles.partyMeta}>{order.userId.hostel}</Text>
          )}
        </Card>
        {order.assignedTo && (
          <Card style={styles.partyCard}>
            <Text style={styles.partyRole}>Provider</Text>
            <Avatar name={order.assignedTo.name} size={40} online />
            <Text style={styles.partyName}>{order.assignedTo.name}</Text>
            <Text style={styles.partyMeta}>⭐ {Number(order.assignedTo.rating ?? 0).toFixed(1)}</Text>
          </Card>
        )}
      </View>

      {/* Status Timeline */}
      <Card shadow>
        <Text style={styles.sectionTitle}>Progress</Text>
        {STATUS_STEPS.filter((s) => s !== 'CANCELLED').map((step, i) => {
          const hist = order.statusHistory.find((h) => h.status === step);
          const isCurrent = order.status === step;
          const isPast = STATUS_STEPS.indexOf(step) < STATUS_STEPS.indexOf(order.status);
          const isCancelled = order.status === 'CANCELLED';
          return (
            <View key={step} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    (isPast || isCurrent) && !isCancelled && styles.timelineDotDone,
                    isCurrent && !isCancelled && styles.timelineDotCurrent,
                  ]}
                />
                {i < STATUS_STEPS.length - 2 && (
                  <View
                    style={[
                      styles.timelineLine,
                      isPast && !isCancelled && styles.timelineLineDone,
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text
                  style={[
                    styles.timelineLabel,
                    (isPast || isCurrent) && !isCancelled && styles.timelineLabelDone,
                  ]}
                >
                  {step.replace('_', ' ')}
                  {isCurrent && !isCancelled && ' ← now'}
                </Text>
                {hist && (
                  <Text style={styles.timelineTime}>{timeAgo(hist.timestamp)}</Text>
                )}
              </View>
            </View>
          );
        })}
        {order.status === 'CANCELLED' && (
          <View style={[styles.timelineItem, { marginTop: 8 }]}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
            <Text style={[styles.timelineLabel, { color: '#f87171', marginLeft: 8 }]}>
              CANCELLED{order.cancelReason ? ` — ${order.cancelReason}` : ''}
            </Text>
          </View>
        )}
      </Card>

      {/* Action buttons */}
      {isOwner && order.status === 'DELIVERED' && (
        <Button
          title="✅ Confirm Received"
          onPress={() => handleStatusUpdate('COMPLETED')}
          fullWidth
          size="lg"
        />
      )}
      {isOwner && ['CREATED', 'BROADCASTED'].includes(order.status) && (
        <Button
          title="Cancel Request"
          onPress={() => handleStatusUpdate('CANCELLED')}
          variant="danger"
          fullWidth
        />
      )}
      {isProvider && order.status === 'ACCEPTED' && (
        <Button
          title="▶ Start Order"
          onPress={() => handleStatusUpdate('IN_PROGRESS')}
          fullWidth
          size="lg"
        />
      )}
      {isProvider && order.status === 'BID_SELECTED' && (
        <Button
          title="▶ Start Order"
          onPress={() => handleStatusUpdate('IN_PROGRESS')}
          fullWidth
          size="lg"
        />
      )}
      {isProvider && order.status === 'IN_PROGRESS' && (
        <Button
          title="📦 Mark Delivered"
          onPress={() => handleStatusUpdate('DELIVERED')}
          fullWidth
          size="lg"
        />
      )}
      {/* Accept fixed-price order */}
      {!isOwner && order.mode === 'fixed' && ['CREATED', 'BROADCASTED'].includes(order.status) && !order.assignedTo && (
        <Button
          title="Accept This Order"
          onPress={handleAcceptOrder}
          fullWidth
          size="lg"
        />
      )}

      {/* Bid section */}
      {order.mode === 'bidding' && ['CREATED', 'BROADCASTED'].includes(order.status) && !isOwner && (
        <Card shadow>
          <Text style={styles.sectionTitle}>{myBid ? 'Your Bid' : 'Place Your Bid'}</Text>
          {myBid ? (
            <View style={styles.myBidWrap}>
              <Text style={styles.myBidAmount}>{formatCurrency(myBid.price)}</Text>
              <Text style={styles.myBidStatus}>
                {myBid.status === 'accepted'
                  ? 'Accepted by customer'
                  : myBid.status === 'rejected'
                    ? 'Rejected by customer'
                    : 'Bid submitted. Waiting for customer update.'}
              </Text>
              {!!myBid.message && <Text style={styles.myBidMsg}>“{myBid.message}”</Text>}
            </View>
          ) : bidSuccess ? (
            <View style={styles.bidSuccess}>
              <Text style={styles.bidSuccessEmoji}>🎉</Text>
              <Text style={styles.bidSuccessText}>Bid placed! Waiting for acceptance.</Text>
            </View>
          ) : (
            <>
              <TextInput
                value={bidPrice}
                onChangeText={setBidPrice}
                placeholder="Your price (₹)"
                placeholderTextColor="#73897a"
                keyboardType="numeric"
                style={styles.bidInput}
              />
              <TextInput
                value={bidMessage}
                onChangeText={setBidMessage}
                placeholder="Optional message…"
                placeholderTextColor="#73897a"
                style={[styles.bidInput, { marginTop: 8 }]}
              />
              <Button
                title={bidSubmitting ? 'Placing bid…' : 'Place Bid →'}
                onPress={handlePlaceBid}
                loading={bidSubmitting}
                fullWidth
                style={{ marginTop: 10 }}
              />
            </>
          )}
        </Card>
      )}

      {/* Bids list (owner view) */}
      {isOwner && order.mode === 'bidding' && (order.bids?.length ?? 0) > 0 && (
        <Card shadow>
          <Text style={styles.sectionTitle}>Bids ({order.bids!.length})</Text>
          {order.bids!.map((bid) => (
            <View key={bid._id} style={styles.bidCard}>
              <Avatar name={bid.userId.name} size={36} />
              <View style={styles.bidInfo}>
                <Text style={styles.bidName}>{bid.userId.name}</Text>
                <Text style={styles.bidPrice}>{formatCurrency(bid.price)}</Text>
                {bid.message && (
                  <Text style={styles.bidMsg}>{bid.message}</Text>
                )}
              </View>
              {bid.status === 'accepted' ? (
                <Badge label="Selected ✓" color="#4ade80" bg="rgba(34,197,94,0.12)" />
              ) : (
                ['CREATED', 'BROADCASTED'].includes(order.status) && (
                  <Button
                    title="Accept"
                    onPress={() => handleAcceptBid(bid._id)}
                    size="sm"
                  />
                )
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Review */}
      {order.status === 'COMPLETED' && (isOwner || isProvider) && !reviewDone && (
        <Card shadow>
          <Text style={styles.sectionTitle}>Leave a Review</Text>
          <StarRating rating={rating} onRate={setRating} size={38} />
          <TextInput
            value={reviewComment}
            onChangeText={setReviewComment}
            placeholder="Optional comment…"
            placeholderTextColor="#73897a"
            style={styles.bidInput}
            multiline
          />
          <Button title="Submit Review" onPress={handleReview} fullWidth style={{ marginTop: 10 }} />
        </Card>
      )}

      {/* Chat */}
      {(isOwner || isProvider) && order.assignedTo && (
        <Card shadow>
          <Text style={styles.sectionTitle}>Chat</Text>
          <View style={styles.chatMessages}>
            {messages.slice(-10).map((msg) => {
              const isMe = msg.senderId._id === user?._id;
              if (msg.type === 'system') {
                return (
                  <Text key={msg._id} style={styles.systemMsg}>{msg.content}</Text>
                );
              }
              return (
                <View key={msg._id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.bubbleText, !isMe && styles.bubbleTextThem]}>{msg.content}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.chatInputRow}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Message…"
              placeholderTextColor="#73897a"
              style={styles.chatTextInput}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
        <Button
          title="Back To Home"
          onPress={() => router.replace('/(tabs)/feed' as any)}
          fullWidth
          variant="outline"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f0faf4' },
  container: { padding: 16, gap: 12, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0faf4' },
  notFound: { color: '#73897a', fontSize: 15 },
  statusBanner: { gap: 10 },
  statusTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusInfo: { flex: 1, gap: 6 },
  statusBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  orderDesc: { fontSize: 14, color: '#182a1e', fontWeight: '500' },
  price: { fontSize: 20, fontWeight: '800', color: '#0c8a57' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: '#73897a', flex: 1 },
  posted: { fontSize: 11, color: '#73897a' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  countdownText: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0c8a57',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  trackBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  partyCard: { flex: 1, alignItems: 'center', gap: 6, padding: 14 },
  partyRole: { fontSize: 10, fontWeight: '700', color: '#73897a', textTransform: 'uppercase' },
  partyName: { fontSize: 13, fontWeight: '700', color: '#182a1e' },
  partyMeta: { fontSize: 11, color: '#73897a' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#182a1e', marginBottom: 10 },
  timelineItem: { flexDirection: 'row', gap: 8, minHeight: 36 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d4e8da',
    marginTop: 4,
  },
  timelineDotDone: { backgroundColor: '#0c8a57' },
  timelineDotCurrent: { backgroundColor: '#209e82', width: 12, height: 12, borderRadius: 6 },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#d4e8da', marginTop: 2 },
  timelineLineDone: { backgroundColor: '#0c8a57' },
  timelineRight: { flex: 1, paddingBottom: 8 },
  timelineLabel: { fontSize: 12, color: '#73897a', fontWeight: '600' },
  timelineLabelDone: { color: '#182a1e' },
  timelineTime: { fontSize: 10, color: '#73897a' },
  bidCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d4e8da' },
  bidInfo: { flex: 1 },
  bidName: { fontSize: 13, fontWeight: '700', color: '#182a1e' },
  bidPrice: { fontSize: 15, fontWeight: '800', color: '#0c8a57' },
  bidMsg: { fontSize: 12, color: '#73897a' },
  bidInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4e8da',
    color: '#182a1e',
    fontSize: 14,
    padding: 10,
  },
  bidSuccess: { alignItems: 'center', gap: 6, padding: 10 },
  bidSuccessEmoji: { fontSize: 32 },
  bidSuccessText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  myBidWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4e8da',
    backgroundColor: '#f8fdf9',
    padding: 12,
    gap: 4,
  },
  myBidAmount: { fontSize: 20, fontWeight: '800', color: '#0c8a57' },
  myBidStatus: { fontSize: 13, fontWeight: '600', color: '#3a6d4f' },
  myBidMsg: { fontSize: 12, color: '#73897a' },
  chatMessages: { gap: 6, maxHeight: 200, overflow: 'scroll' },
  msgRow: { flexDirection: 'row' },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 8 },
  bubbleMe: { backgroundColor: '#0c8a57' },
  bubbleThem: { backgroundColor: '#e6f4ec' },
  bubbleText: { fontSize: 13, color: '#fff' },
  bubbleTextThem: { color: '#182a1e' },
  systemMsg: { textAlign: 'center', fontSize: 11, color: '#73897a' },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#f0faf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d4e8da',
    color: '#182a1e',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0c8a57',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

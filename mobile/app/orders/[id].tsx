import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
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
  const [deliveryProof, setDeliveryProof] = useState('');
  const [myBidOverride, setMyBidOverride] = useState<Bid | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bikeBob = useRef(new Animated.Value(0)).current;

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
  }, [id, user?._id, activeOrder?.updatedAt, activeOrder?.status]);

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

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bikeBob, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(bikeBob, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bikeBob]);

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

  const handleEmergencyHelp = () => {
    Alert.alert(
      'Emergency Assistance',
      'Call emergency support now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 112',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:112').catch(() => {
              Toast.show({ type: 'error', text1: 'Unable to open dialer' });
            });
          },
        },
      ]
    );
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
      fetchOrderById(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (status === 'COMPLETED') {
        Toast.show({ type: 'success', text1: 'Order completed. You can leave a review now.' });
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

  const handleMarkDelivered = async () => {
    if (!id) return;
    const note = deliveryProof.trim() ? `Proof: ${deliveryProof.trim()}` : undefined;
    try {
      await updateOrderStatus(id, 'DELIVERED', note);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Marked as delivered' });
      setDeliveryProof('');
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to mark delivered' });
    }
  };

  const handleReview = async () => {
    if (!activeOrder) return;
    const toUser = user?._id === activeOrder.userId._id
      ? activeOrder.assignedTo?._id
      : activeOrder.userId._id;
    if (!toUser) {
      Toast.show({ type: 'error', text1: 'Unable to identify review recipient' });
      return;
    }
    try {
      await reviewsAPI.createReview({ toUser, orderId: activeOrder._id, rating, comment: reviewComment });
      setReviewDone(true);
      if (id) fetchOrderById(id);
      Toast.show({ type: 'success', text1: 'Review submitted! ⭐' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review';
      Toast.show({ type: 'error', text1: msg });
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
  const hasReviewed = isOwner ? order.isReviewedByCustomer : isProvider ? order.isReviewedByProvider : false;
  const canLeaveReview = order.status === 'COMPLETED' && (isOwner || isProvider) && !reviewDone && !hasReviewed;
  const isChatLocked = order.status === 'COMPLETED' || order.status === 'CANCELLED';
  const myBidFromOrder = (order.bids || []).find((b) => {
    const bidUserId = typeof b.userId === 'string' ? b.userId : b.userId?._id;
    return bidUserId === user?._id;
  });
  const myBid = myBidFromOrder || myBidOverride;
  const isAssignedElsewhere = !!order.assignedTo && !isOwner && !isProvider;
  const isMyBidRejected = myBid?.status === 'rejected';
  const acceptedBid = (order.bids || []).find((bid) => bid.status === 'accepted') || null;
  const etaMins = acceptedBid?.estimatedTime;
  const etaBaseline = order.statusHistory.find((h) => h.status === 'BID_SELECTED')
    || order.statusHistory.find((h) => h.status === 'ACCEPTED');
  let etaLabel = '';
  if (etaMins && etaBaseline && ['ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'].includes(order.status)) {
    const dueAt = new Date(etaBaseline.timestamp).getTime() + etaMins * 60000;
    const left = dueAt - Date.now();
    etaLabel = left > 0
      ? `ETA ${Math.max(1, Math.ceil(left / 60000))} min`
      : 'ETA window reached';
  }
  const rankedBids = (order.bids || [])
    .map((bid) => {
      const priceScore = bid.price > 0 ? 1000 / bid.price : 0;
      const ratingScore = (bid.userId?.rating || 0) * 18;
      const reliabilityScore = (bid.userId?.reliabilityScore || 0) * 0.45;
      const etaScore = bid.estimatedTime ? Math.max(0, 90 - bid.estimatedTime) : 20;
      const score = priceScore + ratingScore + reliabilityScore + etaScore;
      return { bid, score };
    })
    .sort((a, b) => b.score - a.score);
  const cheapestBidId = rankedBids.reduce<string | null>((best, entry) => {
    if (!best) return entry.bid._id;
    const currentBest = rankedBids.find((x) => x.bid._id === best)?.bid.price ?? Number.MAX_SAFE_INTEGER;
    return entry.bid.price < currentBest ? entry.bid._id : best;
  }, null);
  const fastestBidId = rankedBids.reduce<string | null>((best, entry) => {
    if (!entry.bid.estimatedTime) return best;
    if (!best) return entry.bid._id;
    const currentBest = rankedBids.find((x) => x.bid._id === best)?.bid.estimatedTime ?? Number.MAX_SAFE_INTEGER;
    return (entry.bid.estimatedTime || Number.MAX_SAFE_INTEGER) < currentBest ? entry.bid._id : best;
  }, null);
  const topRatedBidId = rankedBids.reduce<string | null>((best, entry) => {
    if (!best) return entry.bid._id;
    const currentBest = rankedBids.find((x) => x.bid._id === best)?.bid.userId?.rating ?? -1;
    return (entry.bid.userId?.rating || 0) > currentBest ? entry.bid._id : best;
  }, null);

  const STATUS_STEPS = ['CREATED', 'BROADCASTED', 'ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'];
  const currentStepIndex = Math.max(0, STATUS_STEPS.indexOf(order.status));
  const timelineProgressPct = (currentStepIndex / (STATUS_STEPS.length - 1)) * 100;
  const bikeLift = bikeBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#153728" />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Order Details</Text>
          <Text style={styles.topSubtitle}>#{order._id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={[styles.topStatusDot, { backgroundColor: statusMeta.bg }]}>
          <Ionicons name="ellipse" size={8} color={statusMeta.color} />
        </View>
      </View>

      {/* Status banner */}
      <Card shadow style={styles.statusBanner}>
        <View style={styles.statusTop}>
          <View style={[styles.catIcon, { backgroundColor: catMeta.bg }]}>
            <Ionicons name={catMeta.icon as any} size={20} color={catMeta.color} />
          </View>
          <View style={styles.statusInfo}>
            <View style={styles.statusBadges}>
              <Badge label={statusMeta.label} color={statusMeta.color} bg={statusMeta.bg} />
              <Badge
                label={order.mode === 'bidding' ? 'Bidding' : order.mode === 'instant' ? 'Instant' : 'Fixed'}
                color="#4f86f7"
                bg="rgba(79,134,247,0.12)"
              />
            </View>
            <View style={styles.titleRowCompact}>
              <Text style={styles.orderDesc}>{order.description}</Text>
              {order.urgency === 'asap' && (
                <View style={styles.urgencyInline}>
                  <Ionicons name="flash" size={12} color="#f97316" />
                </View>
              )}
            </View>
          </View>
        </View>
        {(order.finalPrice || order.budget) && (
          <Text style={styles.price}>
            {formatCurrency(order.finalPrice || order.budget || 0)}
          </Text>
        )}
        {order.location?.address && (
          <View style={styles.locationRowCompact}>
            <Ionicons name="location-outline" size={14} color="#73897a" />
            <Text style={styles.locationText}>{order.location.address}</Text>
          </View>
        )}
        <View style={styles.metaRowCompact}>
          <View style={styles.metaInlineItem}>
            <Ionicons name="pricetag-outline" size={12} color="#6a8477" />
            <Text style={styles.metaInlineText}>{catMeta.label}</Text>
          </View>
          <View style={styles.metaDividerDot} />
          <View style={styles.metaInlineItem}>
            <Ionicons name="time-outline" size={12} color="#6a8477" />
            <Text style={styles.metaInlineText}>{timeAgo(order.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.posted}>Posted {timeAgo(order.createdAt)}</Text>
        {/* Bid countdown */}
        {order.mode === 'bidding' && ['CREATED', 'BROADCASTED'].includes(order.status) && countdown ? (
          <View style={styles.countdownRow}>
            <Ionicons name="timer-outline" size={14} color="#f97316" />
            <Text style={styles.countdownText}>Bidding closes in {countdown}</Text>
          </View>
        ) : null}
        {/* Track order button */}
        {(isOwner || isProvider) && ['ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'].includes(order.status) && (
          <TouchableOpacity onPress={handleTrackOrder} style={styles.trackBtn}>
            <Ionicons name="navigate-outline" size={14} color="#fff" />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
        )}
      </Card>

      {(isAssignedElsewhere || isMyBidRejected) && (
        <Card shadow style={styles.unavailableCard}>
          <View style={styles.unavailableIconWrap}>
            <Ionicons name="information-circle-outline" size={18} color="#f97316" />
          </View>
          <View style={styles.unavailableTextWrap}>
            <Text style={styles.unavailableTitle}>This request is no longer available</Text>
            <Text style={styles.unavailableText}>
              {isMyBidRejected
                ? 'Customer selected another provider. This order is kept only for your history.'
                : 'Customer has already selected another provider for this request.'}
            </Text>
          </View>
        </Card>
      )}

      {etaMins && ['ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'].includes(order.status) && (
        <Card shadow style={styles.etaCard}>
          <View style={styles.etaHead}>
            <View style={styles.etaIconWrap}>
              <Ionicons name="navigate-circle-outline" size={18} color="#0c8a57" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.etaTitle}>Live tracker</Text>
              <Text style={styles.etaSub}>{etaLabel || `Estimated completion ${etaMins} min`}</Text>
            </View>
          </View>
          <View style={styles.etaSteps}>
            {['Accepted', 'On the way', 'In progress', 'Delivered'].map((label, idx) => {
              const activeStep =
                order.status === 'ACCEPTED' || order.status === 'BID_SELECTED' ? 1 :
                order.status === 'IN_PROGRESS' ? 2 :
                order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 3 : 0;
              const done = idx <= activeStep;
              return (
                <View key={label} style={styles.etaStepItem}>
                  <View style={[styles.etaDot, done && styles.etaDotDone]} />
                  <Text style={[styles.etaStepText, done && styles.etaStepTextDone]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {(isOwner || isProvider) && ['ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'].includes(order.status) && (
        <Card shadow style={styles.sosCard}>
          <View style={styles.sosTextWrap}>
            <Text style={styles.sosTitle}>Safety Help</Text>
            <Text style={styles.sosSub}>If you feel unsafe during this order, call emergency support immediately.</Text>
          </View>
          <TouchableOpacity onPress={handleEmergencyHelp} style={styles.sosBtn}>
            <Ionicons name="warning-outline" size={16} color="#fff" />
            <Text style={styles.sosBtnText}>SOS</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Parties */}
      <View style={styles.row2}>
        <Card style={styles.partyCard}>
          <Text style={styles.partyRole}>Customer</Text>
          <Avatar name={order.userId.name} size={40} />
          <Text style={styles.partyName}>{order.userId.name}</Text>
          <View style={styles.trustRow}>
            {(order.userId.isVerified || (order.userId.totalRatings || 0) >= 5) && (
              <Text style={styles.trustChip}>Verified</Text>
            )}
            {(order.userId.reliabilityScore || 0) >= 90 && <Text style={styles.trustChip}>Trusted</Text>}
          </View>
          {order.userId.hostel && (
            <Text style={styles.partyMeta}>{order.userId.hostel}</Text>
          )}
        </Card>
        {order.assignedTo && (
          <Card style={styles.partyCard}>
            <Text style={styles.partyRole}>Provider</Text>
            <Avatar name={order.assignedTo.name} size={40} online />
            <Text style={styles.partyName}>{order.assignedTo.name}</Text>
            <View style={styles.trustRow}>
              {(order.assignedTo.isVerified || (order.assignedTo.totalRatings || 0) >= 5) && (
                <Text style={styles.trustChip}>Verified</Text>
              )}
              {(order.assignedTo.reliabilityScore || 0) >= 90 && <Text style={styles.trustChip}>Trusted</Text>}
            </View>
            <Text style={styles.partyMeta}>⭐ {Number(order.assignedTo.rating ?? 0).toFixed(1)}</Text>
          </Card>
        )}
      </View>

      {/* Status Timeline */}
      <Card shadow style={styles.progressCardWrap}>
        <View style={styles.progressTitleRow}>
          <Text style={styles.sectionTitle}>Progress Timeline</Text>
          <Text style={styles.progressHint}>Live status</Text>
        </View>
        <View style={styles.timelineRailWrap}>
          <View style={styles.timelineRail} />
          <View style={[styles.timelineRailDone, { width: `${timelineProgressPct}%` }]} />
          <Animated.View
            style={[
              styles.bikeWrap,
              {
                left: `${timelineProgressPct}%`,
                transform: [{ translateX: -12 }, { translateY: bikeLift }],
              },
            ]}
          >
            <Ionicons name="bicycle-outline" size={15} color="#0c8a57" />
          </Animated.View>
          <View style={styles.timelineNodesRow}>
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              return <View key={step} style={[styles.timelineNode, isDone && styles.timelineNodeDone]} />;
            })}
          </View>
        </View>

        {STATUS_STEPS.filter((s) => s !== 'CANCELLED').map((step, i) => {
          const hist = order.statusHistory.find((h) => h.status === step);
          const stepIndex = STATUS_STEPS.indexOf(step);
          const isCurrent = stepIndex === currentStepIndex;
          const isPast = stepIndex < currentStepIndex;

          return (
            <View key={step} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    (isPast || isCurrent) && styles.timelineDotDone,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                />
                {i < STATUS_STEPS.length - 1 && (
                  <View style={[styles.timelineLine, isPast && styles.timelineLineDone]} />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text style={[styles.timelineLabel, (isPast || isCurrent) && styles.timelineLabelDone]}>
                  {step.replace('_', ' ')}
                  {isCurrent && ' - now'}
                </Text>
                <Text style={styles.timelineTime}>{hist ? timeAgo(hist.timestamp) : 'Pending'}</Text>
                {!!hist?.note && step === 'DELIVERED' && (
                  <Text style={styles.timelineNote}>{hist.note}</Text>
                )}
              </View>
            </View>
          );
        })}
        {order.status === 'CANCELLED' && (
          <View style={styles.cancelledRow}>
            <Ionicons name="close-circle" size={18} color="#ef4444" />
            <Text style={styles.cancelledText}>
              Cancelled{order.cancelReason ? ` - ${order.cancelReason}` : ''}
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
        <Card shadow>
          <Text style={styles.sectionTitle}>Proof of delivery</Text>
          <TextInput
            value={deliveryProof}
            onChangeText={setDeliveryProof}
            placeholder="Add proof note or link (optional)"
            placeholderTextColor="#73897a"
            style={styles.bidInput}
          />
          <Button
            title="📦 Mark Delivered"
            onPress={handleMarkDelivered}
            fullWidth
            size="lg"
            style={{ marginTop: 10 }}
          />
        </Card>
      )}
      {/* Accept fixed-price order */}
      {!isOwner && ['fixed', 'instant'].includes(order.mode) && ['CREATED', 'BROADCASTED'].includes(order.status) && !order.assignedTo && (
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
          <View style={styles.bidSectionHead}>
            <Text style={styles.sectionTitle}>Bids ({order.bids!.length})</Text>
            <Text style={styles.bidHint}>Ranked for value, speed and trust</Text>
          </View>
          {rankedBids.map(({ bid }, index) => (
            <View key={bid._id} style={styles.bidCard}>
              <Avatar name={bid.userId.name} size={36} />
              <View style={styles.bidInfo}>
                <View style={styles.bidTopRow}>
                  <Text style={styles.bidName}>{bid.userId.name}</Text>
                  {index === 0 && <Text style={styles.rankChip}>Recommended</Text>}
                </View>
                <Text style={styles.bidPrice}>{formatCurrency(bid.price)}</Text>
                <View style={styles.bidMetaRow}>
                  <Text style={styles.bidMetaPill}>⭐ {Number(bid.userId?.rating ?? 0).toFixed(1)}</Text>
                  <Text style={styles.bidMetaPill}>Trust {bid.userId?.reliabilityScore ?? 0}%</Text>
                  {(bid.userId?.isVerified || (bid.userId?.totalRatings || 0) >= 5) && <Text style={styles.bidMetaPill}>Verified</Text>}
                  {!!bid.estimatedTime && <Text style={styles.bidMetaPill}>{bid.estimatedTime} min</Text>}
                </View>
                <View style={styles.bidTagRow}>
                  {bid._id === cheapestBidId && <Text style={styles.bidTag}>Best Value</Text>}
                  {bid._id === fastestBidId && <Text style={styles.bidTag}>Fastest</Text>}
                  {bid._id === topRatedBidId && <Text style={styles.bidTag}>Top Rated</Text>}
                </View>
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
      {canLeaveReview && (
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
          <View style={styles.chatHeaderRow}>
            <Text style={styles.sectionTitle}>Chat</Text>
            {isChatLocked && (
              <View style={styles.chatLockedChip}>
                <Ionicons
                  name={order.status === 'COMPLETED' ? 'checkmark-circle-outline' : 'close-circle-outline'}
                  size={13}
                  color={order.status === 'COMPLETED' ? '#16a34a' : '#ef4444'}
                />
                <Text style={styles.chatLockedChipText}>
                  {order.status === 'COMPLETED' ? 'Order Completed' : 'Order Cancelled'}
                </Text>
              </View>
            )}
          </View>
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
          <View style={[styles.chatInputRow, isChatLocked && styles.chatInputRowDisabled]}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder={isChatLocked ? 'Chat is closed for this order' : 'Message…'}
              placeholderTextColor="#73897a"
              style={[styles.chatTextInput, isChatLocked && styles.chatTextInputDisabled]}
              editable={!isChatLocked}
            />
            <TouchableOpacity
              onPress={isChatLocked ? undefined : sendMessage}
              style={[styles.sendBtn, isChatLocked && styles.sendBtnDisabled]}
              disabled={isChatLocked}
            >
              <Ionicons name="send" size={16} color={isChatLocked ? '#9bb2a4' : '#fff'} />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
        <TouchableOpacity style={styles.homeAction} onPress={() => router.replace('/(tabs)/feed' as any)}>
          <Ionicons name="home-outline" size={18} color="#ffffff" />
          <Text style={styles.homeActionText}>Home</Text>
        </TouchableOpacity>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ecf8f1' },
  scroll: { flex: 1, backgroundColor: '#ecf8f1' },
  container: { padding: 16, gap: 12, paddingBottom: 60 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  topBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfe4d8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleWrap: { flex: 1 },
  topTitle: { fontSize: 16, fontWeight: '800', color: '#153728' },
  topSubtitle: { fontSize: 11, color: '#5e7f6d', marginTop: 1 },
  topStatusDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0faf4' },
  notFound: { color: '#73897a', fontSize: 15 },
  statusBanner: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dcebe3',
    backgroundColor: '#fbfefc',
    padding: 12,
  },
  statusTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusInfo: { flex: 1, gap: 6 },
  statusBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  titleRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  urgencyInline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  orderDesc: { flex: 1, fontSize: 13, color: '#182a1e', fontWeight: '600', lineHeight: 18 },
  price: { fontSize: 18, fontWeight: '800', color: '#0c8a57', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  locationText: { fontSize: 12, color: '#73897a', flex: 1 },
  metaStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#f2faf6',
    borderWidth: 1,
    borderColor: '#dbede3',
  },
  metaChipText: {
    fontSize: 10,
    color: '#537565',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaInlineText: { fontSize: 11, color: '#6a8477', fontWeight: '600' },
  metaDividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#bfd7ca',
  },
  posted: { fontSize: 10, color: '#83988c', marginTop: 1 },
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
  unavailableCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderColor: '#fde7d3', borderWidth: 1 },
  unavailableIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
  },
  unavailableTextWrap: { flex: 1, gap: 4 },
  unavailableTitle: { fontSize: 13, fontWeight: '700', color: '#9a3412' },
  unavailableText: { fontSize: 12, lineHeight: 18, color: '#7c2d12' },
  etaCard: { gap: 10 },
  etaHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  etaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#e8f7ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaTitle: { fontSize: 13, fontWeight: '800', color: '#182a1e' },
  etaSub: { fontSize: 12, color: '#537565' },
  etaSteps: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  etaStepItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  etaDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d4e8da' },
  etaDotDone: { backgroundColor: '#0c8a57' },
  etaStepText: { fontSize: 11, color: '#73897a', fontWeight: '600' },
  etaStepTextDone: { color: '#1f5137' },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderColor: '#fde7d3',
    borderWidth: 1,
    backgroundColor: '#fffaf5',
  },
  sosTextWrap: { flex: 1, gap: 3 },
  sosTitle: { fontSize: 13, fontWeight: '800', color: '#9a3412' },
  sosSub: { fontSize: 11, color: '#7c2d12', lineHeight: 17 },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sosBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  row2: { flexDirection: 'row', gap: 10 },
  partyCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d5e8dc',
    backgroundColor: '#ffffff',
  },
  partyRole: { fontSize: 10, fontWeight: '700', color: '#73897a', textTransform: 'uppercase' },
  partyName: { fontSize: 13, fontWeight: '700', color: '#182a1e' },
  trustRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  trustChip: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f5f3b',
    backgroundColor: '#e8f7ef',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  partyMeta: { fontSize: 11, color: '#73897a' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#182a1e', marginBottom: 10 },
  progressCardWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d5e8dc',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressHint: { fontSize: 11, color: '#5b7d6c', fontWeight: '700' },
  timelineRailWrap: {
    marginBottom: 6,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 14,
    position: 'relative',
  },
  timelineRail: {
    height: 4,
    borderRadius: 4,
    backgroundColor: '#dbece2',
  },
  timelineRailDone: {
    position: 'absolute',
    left: 6,
    top: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#0c8a57',
  },
  bikeWrap: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ebf8f0',
    borderWidth: 1,
    borderColor: '#bfe1cd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodesRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineNode: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#cfe4d8',
  },
  timelineNodeDone: {
    backgroundColor: '#0c8a57',
  },
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
  timelineNote: { fontSize: 11, color: '#537565', marginTop: 2 },
  cancelledRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7d7',
    backgroundColor: '#fff5f5',
    padding: 10,
  },
  cancelledText: { fontSize: 12, fontWeight: '700', color: '#b91c1c', flex: 1 },
  bidCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#d4e8da' },
  bidInfo: { flex: 1 },
  bidSectionHead: { marginBottom: 4 },
  bidHint: { marginTop: -6, marginBottom: 10, fontSize: 11, color: '#73897a' },
  bidTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  bidName: { fontSize: 13, fontWeight: '700', color: '#182a1e' },
  rankChip: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0c8a57',
    backgroundColor: '#e8f7ef',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  bidPrice: { fontSize: 15, fontWeight: '800', color: '#0c8a57' },
  bidMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  bidMetaPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#537565',
    backgroundColor: '#f3faf5',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  bidTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  bidTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9a3412',
    backgroundColor: '#ffedd5',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },
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
  chatHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatLockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3faf5',
    borderWidth: 1,
    borderColor: '#d4e8da',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chatLockedChipText: { fontSize: 11, fontWeight: '700', color: '#3a6d4f' },
  chatMessages: {
    gap: 6,
    maxHeight: 220,
    backgroundColor: '#f7fcf9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbece2',
    padding: 10,
    overflow: 'scroll',
  },
  msgRow: { flexDirection: 'row' },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 12, padding: 8 },
  bubbleMe: { backgroundColor: '#0c8a57' },
  bubbleThem: { backgroundColor: '#e6f4ec' },
  bubbleText: { fontSize: 13, color: '#fff' },
  bubbleTextThem: { color: '#182a1e' },
  systemMsg: { textAlign: 'center', fontSize: 11, color: '#73897a' },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  chatInputRowDisabled: { opacity: 0.8 },
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
  chatTextInputDisabled: { backgroundColor: '#edf5ef' },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0c8a57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#d7e5dc' },
  homeAction: {
    marginTop: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0c8a57',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  homeActionText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
});

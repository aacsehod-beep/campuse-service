import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { ordersAPI } from '@/lib/api';
import { OrderCategory, Order } from '@/types';
import { RequestCard } from '@/components/orders/RequestCard';
import { FeedSkeleton } from '@/components/ui/Skeleton';

const CATEGORIES: { id: OrderCategory | ''; label: string; icon: string }[] = [
  { id: '', label: 'All', icon: 'apps-outline' },
  { id: 'food', label: 'Food', icon: 'fast-food-outline' },
  { id: 'print', label: 'Prints', icon: 'print-outline' },
  { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
  { id: 'ride', label: 'Ride', icon: 'bicycle-outline' },
  { id: 'assessment', label: 'Assessment', icon: 'clipboard-outline' },
  { id: 'project', label: 'Project', icon: 'laptop-outline' },
  { id: 'coaching', label: 'Coaching', icon: 'school-outline' },
  { id: 'design', label: 'Design', icon: 'color-palette-outline' },
  { id: 'event', label: 'Event', icon: 'calendar-outline' },
  { id: 'marketplace', label: 'Marketplace', icon: 'cart-outline' },
  { id: 'others', label: 'Others', icon: 'cube-outline' },
];

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, isLoading, hasMore, filters, fetchOrders, setFilters } = useOrderStore();
  const activeCategory = (filters.category as OrderCategory) || '';
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders(true);
    // Fetch active orders for the tracking strip (same as frontend)
    const ACTIVE = ['CREATED', 'BROADCASTED', 'ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'];
    Promise.all([
      ordersAPI.getMy({ role: 'customer', limit: 10 }),
      ordersAPI.getMy({ role: 'provider', limit: 10 }),
    ]).then(([cr, pr]) => {
      const combined = [...(cr.data.orders || []), ...(pr.data.orders || [])];
      const seen: string[] = [];
      const active = combined.filter((o: Order) => {
        if (seen.includes(o._id)) return false;
        seen.push(o._id);
        return ACTIVE.includes(o.status);
      });
      setMyOrders(active);
    }).catch(() => {});
  }, [filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) fetchOrders();
  };

  const filteredOrders = search.trim()
    ? orders.filter((o) =>
        o.description.toLowerCase().includes(search.toLowerCase()) ||
        o.category.toLowerCase().includes(search.toLowerCase()) ||
        (o.userId?.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const showDashboard = !search && !filters.category;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Sticky header */}
      <View style={styles.header}>
        {/* Top row: greeting + refresh + bell */}
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good to see you,</Text>
            <Text style={styles.name}>{user?.name?.split(' ')[0] || 'Hey'} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} disabled={refreshing}>
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#73897a"
                style={refreshing ? { opacity: 0.5 } : undefined}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={18} color="#73897a" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          {!search && <Ionicons name="search-outline" size={16} color="#73897a" style={styles.searchIcon} />}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search requests..."
            placeholderTextColor="#73897a"
            style={[styles.searchInput, !search && styles.searchInputIndented]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#73897a" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map(({ id, label, icon }) => (
            <TouchableOpacity
              key={id}
              onPress={() => { setFilters({ category: id || undefined }); fetchOrders(true); }}
              style={[styles.pill, activeCategory === id && styles.pillActive]}
            >
              <Ionicons
                name={icon as any}
                size={13}
                color={activeCategory === id ? '#fff' : '#73897a'}
              />
              <Text style={[styles.pillLabel, activeCategory === id && styles.pillLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scrollable content */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <RequestCard order={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0c8a57" />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            {/* Dashboard section — only shown when not searching/filtering */}
            {showDashboard && (
              <View style={styles.dashboard}>
                {/* Stats 2-col grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                      <Ionicons name="cube-outline" size={16} color="#3b82f6" />
                    </View>
                    <Text style={styles.statValue}>{myOrders.length}</Text>
                    <Text style={styles.statLabel}>Active orders</Text>
                  </View>
                  <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#fef9c3' }]}>
                      <Ionicons name="star-outline" size={16} color="#eab308" />
                    </View>
                    <Text style={styles.statValue}>{(user?.rating ?? 0).toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Your rating</Text>
                  </View>
                </View>

                {/* Quick actions 2-col grid */}
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/create')}>
                    <View style={styles.actionIconGreen}>
                      <Ionicons name="add" size={18} color="#fff" />
                    </View>
                    <View style={styles.actionTextWrap}>
                      <Text style={styles.actionTitle}>Post Request</Text>
                      <Text style={styles.actionSub}>Need something?</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/provider')}>
                    <View style={styles.actionIconMint}>
                      <Ionicons name="flash-outline" size={18} color="#16a34a" />
                    </View>
                    <View style={styles.actionTextWrap}>
                      <Text style={styles.actionTitle}>Go Online</Text>
                      <Text style={styles.actionSub}>Earn on campus</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* My Active Orders strip */}
                {myOrders.length > 0 && (
                  <View style={styles.activeOrdersWrap}>
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionLabel}>MY ACTIVE ORDERS</Text>
                      <TouchableOpacity onPress={() => router.push('/(tabs)/my-orders')}>
                        <Text style={styles.viewAll}>View all →</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                      {myOrders.map((order) => (
                        <TouchableOpacity
                          key={order._id}
                          style={styles.miniOrderCard}
                          onPress={() => router.push(`/orders/${order._id}`)}
                        >
                          <Text style={styles.miniOrderCat}>{order.category}</Text>
                          <Text style={styles.miniOrderDesc} numberOfLines={2}>{order.description}</Text>
                          <View style={styles.miniOrderBadge}>
                            <Text style={styles.miniOrderStatus}>{order.status.replaceAll('_', ' ')}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Section heading */}
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>CAMPUS REQUESTS</Text>
                  {orders.length > 0 && (
                    <Text style={styles.countLabel}>{orders.length} nearby</Text>
                  )}
                </View>
              </View>
            )}

            {filteredOrders.length > 0 && !showDashboard ? (
              <Text style={styles.count}>{filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="mail-open-outline" size={40} color="#d4e8da" />
              </View>
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>Be the first to post a request on campus</Text>
            </View>
          ) : (
            <FeedSkeleton />
          )
        }
        ListFooterComponent={
          hasMore && orders.length > 0 ? (
            <TouchableOpacity onPress={loadMore} style={styles.loadMore}>
              {isLoading ? (
                <ActivityIndicator color="#0c8a57" size="small" />
              ) : (
                <Text style={styles.loadMoreText}>Load more</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0faf4' },

  // ── Header (sticky) ──────────────────────────────────────
  header: {
    backgroundColor: '#f0faf4',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
    paddingBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  greeting: { fontSize: 11, color: '#73897a', fontWeight: '500' },
  name: { fontSize: 18, fontWeight: '800', color: '#0c8a57' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4e8da',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Search bar ───────────────────────────────────────────
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e8da',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 13, color: '#182a1e' },
  searchInputIndented: {},

  // ── Category pills ───────────────────────────────────────
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4e8da',
  },
  pillActive: {
    backgroundColor: '#0c8a57',
    borderColor: '#0c8a57',
    shadowColor: '#0c8a57',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  pillEmoji: { fontSize: 13 },  // kept for compat
  pillLabel: { fontSize: 12, fontWeight: '600', color: '#73897a' },
  pillLabelActive: { color: '#fff' },

  // ── Dashboard section ────────────────────────────────────
  dashboard: { marginBottom: 4 },

  // Stats 2-col grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d4e8da',
    padding: 14,
    gap: 6,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#182a1e' },
  statLabel: { fontSize: 11, color: '#73897a', fontWeight: '500' },

  // Quick actions 2-col grid
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d4e8da',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconGreen: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0c8a57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconMint: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 13, fontWeight: '700', color: '#182a1e' },
  actionSub: { fontSize: 10, color: '#73897a', marginTop: 1 },
  actionTextWrap: { flex: 1, minWidth: 0 },

  // My Active Orders strip
  activeOrdersWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  miniOrderCard: {
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e8da',
    padding: 12,
    marginRight: 10,
    gap: 4,
  },
  miniOrderCat: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0c8a57',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniOrderDesc: { fontSize: 12, color: '#182a1e', fontWeight: '500', lineHeight: 16 },
  miniOrderBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#e6f4ec',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  miniOrderStatus: { fontSize: 9, fontWeight: '700', color: '#0c8a57', textTransform: 'capitalize' },

  // Section labels
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#73897a', letterSpacing: 0.8 },
  countLabel: { fontSize: 11, color: '#73897a' },
  viewAll: { fontSize: 11, color: '#0c8a57', fontWeight: '600' },

  // ── List ─────────────────────────────────────────────────
  listContent: { padding: 16, paddingTop: 0, flexGrow: 1 },
  count: { fontSize: 11, color: '#73897a', fontWeight: '600', marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#e6f4ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#182a1e' },
  emptyText: { fontSize: 13, color: '#73897a', textAlign: 'center' },
  loadingWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 13, color: '#73897a' },
  loadMore: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0c8a57',
    alignItems: 'center',
  },
  loadMoreText: { fontSize: 13, color: '#0c8a57', fontWeight: '600' },
});

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { OrderCategory } from '@/types';
import { RequestCard } from '@/components/orders/RequestCard';

const CATEGORIES: { id: OrderCategory | ''; label: string; emoji: string }[] = [
  { id: '', label: 'All', emoji: '✨' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'print', label: 'Prints', emoji: '🖨️' },
  { id: 'notes', label: 'Notes', emoji: '📝' },
  { id: 'ride', label: 'Ride', emoji: '🛵' },
  { id: 'others', label: 'Others', emoji: '📦' },
];

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, isLoading, hasMore, filters, fetchOrders, setFilters } = useOrderStore();
  const activeCategory = (filters.category as OrderCategory) || '';

  useEffect(() => {
    fetchOrders(true);
  }, [filters]);

  const onRefresh = () => fetchOrders(true);

  const loadMore = () => {
    if (!isLoading && hasMore) fetchOrders();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good to see you,</Text>
          <Text style={styles.name}>{user?.name?.split(' ')[0] || 'Hey'} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        style={styles.catScroll}
      >
        {CATEGORIES.map(({ id, label, emoji }) => (
          <TouchableOpacity
            key={id}
            onPress={() => {
              setFilters({ category: id || undefined });
              fetchOrders(true);
            }}
            style={[styles.pill, activeCategory === id && styles.pillActive]}
          >
            <Text style={styles.pillEmoji}>{emoji}</Text>
            <Text style={[styles.pillLabel, activeCategory === id && styles.pillLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <RequestCard order={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && orders.length === 0}
            onRefresh={onRefresh}
            tintColor="#8b5cf6"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          orders.length > 0 ? (
            <Text style={styles.count}>
              {orders.length} request{orders.length !== 1 ? 's' : ''} nearby
            </Text>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>Be the first to post a request on campus</Text>
            </View>
          ) : (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#8b5cf6" size="large" />
              <Text style={styles.loadingText}>Loading requests…</Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && orders.length > 0 ? (
            <TouchableOpacity onPress={loadMore} style={styles.loadMore}>
              {isLoading ? (
                <ActivityIndicator color="#8b5cf6" size="small" />
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
  safe: { flex: 1, backgroundColor: '#0d0d14' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  greeting: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  name: { fontSize: 18, fontWeight: '800', color: '#a78bfa' },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#13131f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catScroll: { flexGrow: 0 },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#13131f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  pillEmoji: { fontSize: 14 },
  pillLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  pillLabelActive: { color: '#fff' },
  listContent: { padding: 16, paddingTop: 4, flexGrow: 1 },
  count: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  loadingWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  loadMore: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center',
  },
  loadMoreText: { fontSize: 13, color: '#a78bfa', fontWeight: '600' },
});

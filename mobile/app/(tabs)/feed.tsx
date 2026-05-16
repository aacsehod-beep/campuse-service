import React, { useEffect, useState, useCallback } from 'react';
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
import { OrderCategory } from '@/types';
import { RequestCard } from '@/components/orders/RequestCard';

const CATEGORIES: { id: OrderCategory | ''; label: string; emoji: string }[] = [
  { id: '', label: 'All', emoji: '✨' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'print', label: 'Prints', emoji: '🖨️' },
  { id: 'notes', label: 'Notes', emoji: '📝' },
  { id: 'ride', label: 'Ride', emoji: '🛵' },
  { id: 'assessment', label: 'Assessment', emoji: '📋' },
  { id: 'project', label: 'Project', emoji: '💻' },
  { id: 'coaching', label: 'Coaching', emoji: '🎓' },
  { id: 'design', label: 'Design', emoji: '🎨' },
  { id: 'event', label: 'Event', emoji: '🎉' },
  { id: 'marketplace', label: 'Marketplace', emoji: '🛒' },
  { id: 'others', label: 'Others', emoji: '📦' },
];

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { orders, isLoading, hasMore, filters, fetchOrders, setFilters } = useOrderStore();
  const activeCategory = (filters.category as OrderCategory) || '';
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders(true);
  }, [filters]);

  const onRefresh = () => fetchOrders(true);

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

  const activeOrders = orders.filter((o) =>
    ['ACCEPTED', 'IN_PROGRESS', 'BROADCASTED'].includes(o.status)
  );

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
          <Ionicons name="notifications-outline" size={20} color="#0c8a57" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color="#73897a" style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search requests, categories…"
          placeholderTextColor="#73897a"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#73897a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dashboard stats strip (only when not searching) */}
      {!search && (
        <View style={styles.statsStrip}>
          <TouchableOpacity style={styles.statChip} onPress={() => router.push('/(tabs)/my-orders')}>
            <Ionicons name="time-outline" size={14} color="#0c8a57" />
            <Text style={styles.statChipValue}>{activeOrders.length}</Text>
            <Text style={styles.statChipLabel}>Active</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Ionicons name="star-outline" size={14} color="#fbbf24" />
            <Text style={styles.statChipValue}>{user?.rating?.toFixed(1) || '–'}</Text>
            <Text style={styles.statChipLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statChip} onPress={() => router.push('/(tabs)/create')}>
            <Ionicons name="add-circle-outline" size={14} color="#0c8a57" />
            <Text style={styles.statChipLabel}>Post Request</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statChip} onPress={() => router.push('/provider')}>
            <Ionicons name="bicycle-outline" size={14} color="#209e82" />
            <Text style={styles.statChipLabel}>Go Online</Text>
          </TouchableOpacity>
        </View>
      )}

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
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <RequestCard order={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && orders.length === 0}
            onRefresh={onRefresh}
            tintColor="#0c8a57"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          filteredOrders.length > 0 ? (
            <Text style={styles.count}>
              {filteredOrders.length} request{filteredOrders.length !== 1 ? 's' : ''} nearby
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
              <ActivityIndicator color="#0c8a57" size="large" />
              <Text style={styles.loadingText}>Loading requests…</Text>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
  },
  greeting: { fontSize: 11, color: '#73897a', fontWeight: '500' },
  name: { fontSize: 18, fontWeight: '800', color: '#0c8a57' },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#e6f4ec',
    borderWidth: 1,
    borderColor: '#d4e8da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e8da',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: 13, color: '#182a1e' },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
  },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' },
  statChipValue: { fontSize: 13, fontWeight: '800', color: '#182a1e' },
  statChipLabel: { fontSize: 11, color: '#73897a', fontWeight: '500' },
  statDivider: { width: 1, height: 20, backgroundColor: '#d4e8da' },
  catScroll: { flexGrow: 0 },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  },
  pillEmoji: { fontSize: 14 },
  pillLabel: { fontSize: 12, fontWeight: '600', color: '#73897a' },
  pillLabelActive: { color: '#fff' },
  listContent: { padding: 16, paddingTop: 4, flexGrow: 1 },
  count: { fontSize: 11, color: '#73897a', fontWeight: '600', marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
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

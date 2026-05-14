import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ordersAPI } from '@/lib/api';
import { Order, STATUS_META, CATEGORY_META } from '@/types';
import { timeAgo, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

type Role = 'customer' | 'provider';
type StatusTab = 'active' | 'completed';

const ACTIVE_STATUSES = ['CREATED', 'BROADCASTED', 'ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS', 'DELIVERED'];
const DONE_STATUSES = ['COMPLETED', 'CANCELLED'];

export default function MyOrdersScreen() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('customer');
  const [tab, setTab] = useState<StatusTab>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await ordersAPI.getMy({ role });
      setOrders(data.orders || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [role]);

  const filtered = orders.filter((o) =>
    tab === 'active' ? ACTIVE_STATUSES.includes(o.status) : DONE_STATUSES.includes(o.status)
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        {/* Role toggle */}
        <View style={styles.toggle}>
          {(['customer', 'provider'] as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRole(r)}
              style={[styles.toggleBtn, role === r && styles.toggleActive]}
            >
              <Text style={[styles.toggleText, role === r && styles.toggleTextActive]}>
                {r === 'customer' ? '🧑‍💼 Customer' : '🛵 Provider'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status tabs */}
      <View style={styles.tabs}>
        {(['active', 'completed'] as StatusTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? 'Active' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchOrders} tintColor="#8b5cf6" />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No {tab} orders</Text>
              <Text style={styles.emptyText}>
                {tab === 'active' ? 'Post a request to get started' : 'Completed orders appear here'}
              </Text>
            </View>
          ) : (
            <ActivityIndicator color="#8b5cf6" style={{ marginTop: 60 }} />
          )
        }
        renderItem={({ item: order }) => {
          const statusMeta = STATUS_META[order.status];
          const catMeta = CATEGORY_META[order.category];
          return (
            <TouchableOpacity onPress={() => router.push(`/orders/${order._id}`)} activeOpacity={0.85}>
              <Card shadow>
                <View style={styles.orderRow}>
                  <View style={[styles.catBadge, { backgroundColor: catMeta.bg }]}>
                    <Text style={{ fontSize: 20 }}>{catMeta.icon}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderDesc} numberOfLines={2}>{order.description}</Text>
                    <View style={styles.orderMeta}>
                      <Badge label={statusMeta.label} color={statusMeta.color} bg={statusMeta.bg} />
                      {order.finalPrice && (
                        <Text style={styles.price}>{formatCurrency(order.finalPrice)}</Text>
                      )}
                    </View>
                    <Text style={styles.orderTime}>{timeAgo(order.createdAt)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d14' },
  header: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#13131f',
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  toggleActive: { backgroundColor: '#7c3aed' },
  toggleText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  toggleTextActive: { color: '#fff' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: 'rgba(139,92,246,0.15)' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  tabTextActive: { color: '#a78bfa' },
  list: { padding: 16, flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: { flex: 1, gap: 4 },
  orderDesc: { fontSize: 13, fontWeight: '600', color: '#fff' },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 13, fontWeight: '700', color: '#a78bfa' },
  orderTime: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
});

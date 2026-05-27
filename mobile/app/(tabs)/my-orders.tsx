import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
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

function groupOrdersByDate(orders: Order[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups: Record<string, Order[]> = {};
  for (const o of orders) {
    const d = new Date(o.createdAt);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else {
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff < 7) label = 'This Week';
      else label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(o);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

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
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const doneCount = orders.filter((o) => DONE_STATUSES.includes(o.status)).length;
  const sections = groupOrdersByDate(filtered);

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

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Ionicons name="time-outline" size={14} color="#3b82f6" />
          <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#0c8a57" />
          <Text style={[styles.summaryValue, { color: '#0c8a57' }]}>{doneCount}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
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
              {t === 'active' ? `Active (${activeCount})` : `Completed (${doneCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && sections.length === 0 ? (
        <ActivityIndicator color="#0c8a57" style={{ marginTop: 60 }} />
      ) : sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No {tab} orders</Text>
          <Text style={styles.emptyText}>
            {tab === 'active' ? 'Post a request to get started' : 'Completed orders appear here'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchOrders} tintColor="#0c8a57" />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
                    <Ionicons name="chevron-forward" size={18} color="#73897a" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0faf4' },
  header: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#182a1e' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#e6f4ec',
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  toggleActive: { backgroundColor: '#0c8a57' },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#73897a' },
  toggleTextActive: { color: '#fff' },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
    gap: 0,
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' },
  summaryValue: { fontSize: 15, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: '#73897a', fontWeight: '500' },
  statDivider: { width: 1, height: 20, backgroundColor: '#d4e8da' },
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
  tabActive: { backgroundColor: '#e0f5ec' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#73897a' },
  tabTextActive: { color: '#0c8a57' },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0faf4',
  },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', color: '#73897a', textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { padding: 16, flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#182a1e' },
  emptyText: { fontSize: 13, color: '#73897a', textAlign: 'center' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: { flex: 1, gap: 4 },
  orderDesc: { fontSize: 13, fontWeight: '600', color: '#182a1e' },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 13, fontWeight: '700', color: '#0c8a57' },
  orderTime: { fontSize: 11, color: '#73897a' },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Order, CATEGORY_META, STATUS_META } from '@/types';
import { timeAgo, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface RequestCardProps {
  order: Order;
}

export function RequestCard({ order }: RequestCardProps) {
  const router = useRouter();
  const categoryMeta = CATEGORY_META[order.category];
  const statusMeta = STATUS_META[order.status];

  return (
    <TouchableOpacity
      onPress={() => router.push(`/orders/${order._id}`)}
      activeOpacity={0.85}
    >
      <Card shadow style={styles.card}>
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              {order.urgency === 'asap' && (
                <Badge
                  label="⚡ ASAP"
                  color="#fb923c"
                  bg="rgba(249,115,22,0.15)"
                />
              )}
              <Badge
                label={statusMeta.label}
                color={statusMeta.color}
                bg={statusMeta.bg}
              />
              {order.mode === 'bidding' && (
                <Badge
                  label="Bidding"
                  color="#60a5fa"
                  bg="rgba(59,130,246,0.15)"
                />
              )}
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {order.description}
            </Text>
          </View>
          <View style={[styles.categoryIcon, { backgroundColor: categoryMeta.bg }]}>
            <Ionicons name={categoryMeta.icon as any} size={22} color={categoryMeta.color} />
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.meta}>
          {order.budget ? (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={13} color="#0c8a57" />
              <Text style={[styles.metaText, styles.priceText]}>
                {formatCurrency(order.budget)}
              </Text>
            </View>
          ) : (
            <Text style={styles.openBid}>Open bid</Text>
          )}
          {order.location?.address && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color="#73897a" />
              <Text style={styles.metaText} numberOfLines={1}>
                {order.location.address.split(',')[0]}
              </Text>
            </View>
          )}
          <View style={[styles.metaItem, styles.metaRight]}>
            <Ionicons name="time-outline" size={13} color="#73897a" />
            <Text style={styles.metaText}>{timeAgo(order.createdAt)}</Text>
          </View>
        </View>

        {/* Requester */}
        <View style={styles.requester}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(order.userId as { name?: string })?.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.requesterName}>
            {(order.userId as { name?: string })?.name || 'Anonymous'}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerLeft: { flex: 1, gap: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  description: { fontSize: 14, fontWeight: '500', color: '#182a1e', lineHeight: 20 },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRight: { marginLeft: 'auto' },
  metaText: { fontSize: 12, color: '#73897a' },
  priceText: { color: '#0c8a57', fontWeight: '700' },
  openBid: { fontSize: 12, color: '#73897a', fontStyle: 'italic' },
  requester: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#d4e8da',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0c8a57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  requesterName: { fontSize: 12, color: '#73897a' },
});

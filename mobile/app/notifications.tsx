import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '@/store/notificationStore';
import { timeAgo } from '@/lib/utils';

const NOTIF_ICON: Record<string, string> = {
  new_order: 'cube-outline',
  new_bid: 'cash-outline',
  bid_accepted: 'checkmark-circle-outline',
  order_accepted: 'checkmark-circle-outline',
  status_update: 'refresh-circle-outline',
  new_message: 'chatbubble-outline',
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotificationStore();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.actions}>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.actionBtn}>Mark all read</Text>
          </TouchableOpacity>
        )}
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={[styles.actionBtn, { color: '#f87171' }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => markRead(item.id)}
              style={[styles.notifItem, !item.read && styles.notifUnread]}
            >
              <View
                style={[
                  styles.iconWrap,
                  !item.read && { backgroundColor: 'rgba(139,92,246,0.15)' },
                ]}
              >
                <Ionicons
                  name={(NOTIF_ICON[item.type] || 'notifications-outline') as any}
                  size={20}
                  color={item.read ? 'rgba(255,255,255,0.4)' : '#a78bfa'}
                />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifMessage}>{item.message}</Text>
                <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d14' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  actionBtn: { fontSize: 12, color: '#a78bfa', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  notifUnread: { backgroundColor: 'rgba(139,92,246,0.04)' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#13131f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  notifTitleUnread: { color: '#fff' },
  notifMessage: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  notifTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
    marginTop: 4,
  },
});

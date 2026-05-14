import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/lib/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import Toast from 'react-native-toast-message';

export default function ProviderScreen() {
  const { user, updateUser } = useAuthStore();
  const { coordinates, getLocation, isLoading: geoLoading } = useGeolocation();
  const [isToggling, setIsToggling] = useState(false);

  const toggleAvailability = async () => {
    if (!user) return;
    const newStatus = !user.isAvailable;

    if (newStatus && !coordinates) {
      Alert.alert(
        'Location Required',
        'We need your location to show you to nearby customers.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable Location',
            onPress: async () => {
              await getLocation();
              doToggle(newStatus);
            },
          },
        ]
      );
      return;
    }

    doToggle(newStatus);
  };

  const doToggle = async (newStatus: boolean) => {
    setIsToggling(true);
    try {
      const { data } = await usersAPI.toggleAvailability(
        newStatus,
        coordinates ? { coordinates } : undefined
      );
      updateUser(data.user);
      Toast.show({
        type: 'success',
        text1: newStatus ? '✅ You are now available!' : '🔴 Marked as unavailable',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update availability' });
    }
    setIsToggling(false);
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Provider status card */}
      <Card shadow style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Avatar name={user.name} size={52} online={user.isAvailable} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusName}>{user.name}</Text>
            <Badge
              label={user.isAvailable ? '🟢 Available' : '🔴 Offline'}
              color={user.isAvailable ? '#4ade80' : '#f87171'}
              bg={user.isAvailable ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}
            />
          </View>
        </View>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Available for Orders</Text>
            <Text style={styles.toggleDesc}>
              {user.isAvailable
                ? 'Customers can see and assign orders to you'
                : 'You are currently hidden from customers'}
            </Text>
          </View>
          <Switch
            value={user.isAvailable}
            onValueChange={toggleAvailability}
            disabled={isToggling || geoLoading}
            thumbColor="#fff"
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#16a34a' }}
          />
        </View>
      </Card>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#4ade80" />
          <Text style={styles.statValue}>{user.completedOrders}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="star-outline" size={22} color="#fbbf24" />
          <Text style={styles.statValue}>{user.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </Card>
        <Card style={styles.statCard}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#60a5fa" />
          <Text style={styles.statValue}>{user.reliabilityScore}%</Text>
          <Text style={styles.statLabel}>Reliability</Text>
        </Card>
      </View>

      {/* Tips */}
      <Card>
        <Text style={styles.tipsTitle}>💡 Provider Tips</Text>
        {[
          'Stay available during peak hours (8-10am, 12-2pm, 6-9pm)',
          'Respond quickly to increase your reliability score',
          'Keep your location updated for better order matching',
          'Maintain a 4.5+ rating to get priority orders',
        ].map((tip, i) => (
          <View key={i} style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0d0d14' },
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  statusCard: { gap: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusInfo: { flex: 1, gap: 6 },
  statusName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
  toggleDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, maxWidth: '80%' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, padding: 14 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  tip: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tipBullet: { color: '#a78bfa', fontWeight: '700', fontSize: 14 },
  tipText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
});

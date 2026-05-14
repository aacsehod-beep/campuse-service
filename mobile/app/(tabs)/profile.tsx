import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, getRatingStars } from '@/lib/utils';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [stats, setStats] = useState<{
    ordersAsCustomer: number;
    ordersAsProvider: number;
    totalEarnings: number;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    hostel: user?.hostel || '',
    phone: user?.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    usersAPI.getMyStats().then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await usersAPI.updateProfile({
        name: form.name,
        hostel: form.hostel,
        phone: form.phone,
      });
      updateUser(data.user);
      setEditing(false);
      Toast.show({ type: 'success', text1: 'Profile updated!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile card */}
        <Card shadow style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar name={user.name} src={user.avatar} size={72} online={user.isAvailable} />
            <View style={styles.profileInfo}>
              {editing ? (
                <TextInput
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              ) : (
                <Text style={styles.profileName}>{user.name}</Text>
              )}
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>{getRatingStars(user.rating)}</Text>
                <Text style={styles.ratingText}>{user.rating.toFixed(1)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
              <Ionicons name={editing ? 'close' : 'pencil'} size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          {editing && (
            <View style={styles.editFields}>
              <Input
                label="Hostel"
                value={form.hostel}
                onChangeText={(v) => setForm((f) => ({ ...f, hostel: v }))}
                placeholder="e.g. Block A"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="+91 9XXXXXXXXX"
                keyboardType="phone-pad"
              />
              <Button
                title={isSaving ? 'Saving…' : 'Save Changes'}
                onPress={handleSave}
                loading={isSaving}
                fullWidth
              />
            </View>
          )}

          {/* Badges */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeValue}>{user.rating.toFixed(1)} ⭐</Text>
              <Text style={styles.badgeLabel}>Rating</Text>
            </View>
            <View style={styles.badgeDivider} />
            <View style={styles.badge}>
              <Text style={styles.badgeValue}>{user.reliabilityScore}%</Text>
              <Text style={styles.badgeLabel}>Reliability</Text>
            </View>
            <View style={styles.badgeDivider} />
            <View style={styles.badge}>
              <Text style={styles.badgeValue}>{user.completedOrders}</Text>
              <Text style={styles.badgeLabel}>Completed</Text>
            </View>
          </View>
        </Card>

        {/* Wallet quick view */}
        <TouchableOpacity onPress={() => router.push('/wallet')} activeOpacity={0.85}>
          <Card shadow style={styles.walletCard}>
            <View style={styles.walletRow}>
              <View>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={styles.walletBalance}>{formatCurrency(user.walletBalance)}</Text>
              </View>
              <View style={styles.walletIcon}>
                <Ionicons name="wallet-outline" size={24} color="#a78bfa" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Stats */}
        {stats && (
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.ordersAsCustomer}</Text>
              <Text style={styles.statLabel}>Orders Placed</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.ordersAsProvider}</Text>
              <Text style={styles.statLabel}>Fulfilled</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(stats.totalEarnings)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{user.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Card>
          </View>
        )}

        {/* Actions */}
        <Card>
          {[
            { icon: 'bicycle-outline', label: 'Provider Mode', path: '/provider' },
            { icon: 'notifications-outline', label: 'Notifications', path: '/notifications' },
          ].map((item) => (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as any)}
              style={styles.actionItem}
            >
              <Ionicons name={item.icon as any} size={20} color="#a78bfa" />
              <Text style={styles.actionLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Sign out */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="secondary"
          fullWidth
          size="lg"
          icon={<Ionicons name="log-out-outline" size={18} color="#f87171" />}
          textStyle={{ color: '#f87171' }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d14' },
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  profileCard: { gap: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  nameInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#7c3aed',
    paddingBottom: 2,
  },
  profileEmail: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { fontSize: 12, color: '#fbbf24' },
  ratingText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFields: { gap: 10 },
  badges: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  badge: { flex: 1, alignItems: 'center', gap: 2 },
  badgeValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  badgeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  badgeDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  walletCard: { padding: 14 },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  walletBalance: { fontSize: 22, fontWeight: '800', color: '#fff' },
  walletIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', alignItems: 'center', gap: 4, padding: 14 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#a78bfa' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

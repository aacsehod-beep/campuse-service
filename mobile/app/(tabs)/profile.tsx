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

  const handleToggleAvailability = async () => {
    if (!user) return;
    try {
      const newVal = !user.isAvailable;
      await usersAPI.toggleAvailability(newVal);
      updateUser({ isAvailable: newVal });
      Toast.show({
        type: 'success',
        text1: newVal ? "You're now available! 🟢" : "You're now unavailable",
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update availability' });
    }
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
                  placeholderTextColor="#73897a"
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
              <Ionicons name={editing ? 'close' : 'pencil'} size={18} color="#73897a" />
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
                <Ionicons name="wallet-outline" size={24} color="#0c8a57" />
              </View>
              <Ionicons name="chevron-forward" size={20} color="#73897a" />
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

        {/* Availability toggle */}
        <TouchableOpacity
          onPress={handleToggleAvailability}
          activeOpacity={0.8}
          style={[
            styles.availCard,
            user.isAvailable && styles.availCardOn,
          ]}
        >
          <View style={[styles.availIcon, user.isAvailable && styles.availIconOn]}>
            <Ionicons name="flash" size={18} color={user.isAvailable ? '#fff' : '#73897a'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.availTitle, user.isAvailable && styles.availTitleOn]}>
              {user.isAvailable ? 'Available for Orders' : 'Go Online to Earn'}
            </Text>
            <Text style={styles.availSub}>
              {user.isAvailable ? 'Tap to go offline' : 'Tap to start accepting requests'}
            </Text>
          </View>
          <View style={[styles.toggleTrack, user.isAvailable && styles.toggleTrackOn]}>
            <View style={[styles.toggleThumb, user.isAvailable && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <Card>
          {[
            { icon: 'bicycle-outline', label: 'Provider Mode', path: '/provider' },
            { icon: 'briefcase-outline', label: 'My Services', path: '/provider' },
            { icon: 'star-outline', label: 'Browse Services', path: '/(tabs)/feed' },
            { icon: 'notifications-outline', label: 'Notifications', path: '/notifications' },
          ].map((item) => (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as any)}
              style={styles.actionItem}
            >
              <Ionicons name={item.icon as any} size={20} color="#0c8a57" />
              <Text style={styles.actionLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#73897a" style={{ marginLeft: 'auto' }} />
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
  safe: { flex: 1, backgroundColor: '#f0faf4' },
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  profileCard: { gap: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#182a1e' },
  nameInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#182a1e',
    borderBottomWidth: 1,
    borderBottomColor: '#0c8a57',
    paddingBottom: 2,
  },
  profileEmail: { fontSize: 12, color: '#73897a' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { fontSize: 12, color: '#fbbf24' },
  ratingText: { fontSize: 12, color: '#73897a', fontWeight: '600' },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#e6f4ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFields: { gap: 10 },
  badges: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d4e8da',
  },
  badge: { flex: 1, alignItems: 'center', gap: 2 },
  badgeValue: { fontSize: 16, fontWeight: '800', color: '#182a1e' },
  badgeLabel: { fontSize: 10, color: '#73897a', fontWeight: '600' },
  badgeDivider: { width: 1, backgroundColor: '#d4e8da' },
  walletCard: { padding: 14 },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletLabel: { fontSize: 11, color: '#73897a', fontWeight: '500' },
  walletBalance: { fontSize: 22, fontWeight: '800', color: '#182a1e' },
  walletIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#e0f5ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', alignItems: 'center', gap: 4, padding: 14 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0c8a57' },
  statLabel: { fontSize: 11, color: '#73897a', fontWeight: '600' },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#182a1e' },

  // Availability toggle card
  availCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d4e8da',
    padding: 14,
  },
  availCardOn: { backgroundColor: '#e0f5ec', borderColor: '#0c8a57' },
  availIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e6f4ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availIconOn: { backgroundColor: '#0c8a57' },
  availTitle: { fontSize: 14, fontWeight: '700', color: '#182a1e' },
  availTitleOn: { color: '#0c8a57' },
  availSub: { fontSize: 11, color: '#73897a', marginTop: 1 },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d4e8da',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: { backgroundColor: '#0c8a57' },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
});

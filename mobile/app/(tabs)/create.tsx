import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderStore } from '@/store/orderStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { OrderCategory } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const CATEGORIES: { id: OrderCategory; label: string; emoji: string }[] = [
  { id: 'food', label: 'Food', emoji: '🍱' },
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

export default function CreateScreen() {
  const router = useRouter();
  const { createOrder } = useOrderStore();
  const { coordinates, address, isLoading: geoLoading, getLocation } = useGeolocation();

  const [form, setForm] = useState({
    category: '' as OrderCategory | '',
    description: '',
    mode: 'fixed' as 'fixed' | 'bidding',
    budget: '',
    urgency: 'normal' as 'normal' | 'asap',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.category) {
      Toast.show({ type: 'error', text1: 'Please select a category' });
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      Toast.show({ type: 'error', text1: 'Describe your request (min 10 chars)' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        category: form.category,
        description: form.description.trim(),
        mode: form.mode,
        urgency: form.urgency,
      };
      if (form.budget && form.mode === 'fixed') {
        payload.budget = parseFloat(form.budget);
      }
      if (coordinates) {
        payload.location = {
          type: 'Point',
          coordinates,
          address,
        };
      }

      const order = await createOrder(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Request posted! 🚀' });
      router.push(`/orders/${order._id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to post request';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Post a Request 🚀</Text>
          <Text style={styles.subheading}>Tell campus what you need</Text>

          {/* Category selector */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Category *</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => update('category', cat.id)}
                  style={[styles.catItem, form.category === cat.id && styles.catItemActive]}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, form.category === cat.id && styles.catLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Description */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Description *</Text>
            <TextInput
              value={form.description}
              onChangeText={(v) => update('description', v)}
              placeholder="Describe what you need in detail…"
              placeholderTextColor="#73897a"
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.textarea}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{form.description.length}/500</Text>
          </Card>

          {/* Pricing mode */}
          <Card style={styles.section}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.sectionLabel}>Bidding Mode</Text>
                <Text style={styles.rowDesc}>Let providers offer their price</Text>
              </View>
              <Switch
                value={form.mode === 'bidding'}
                onValueChange={(v) => update('mode', v ? 'bidding' : 'fixed')}
                thumbColor="#fff"
                trackColor={{ false: '#d4e8da', true: '#0c8a57' }}
              />
            </View>
            {form.mode === 'fixed' && (
              <Input
                label="Budget (₹)"
                value={form.budget}
                onChangeText={(v) => update('budget', v)}
                placeholder="Enter amount"
                keyboardType="numeric"
                leftIcon={<Ionicons name="cash-outline" size={18} color="#73897a" />}
                containerStyle={{ marginTop: 12 }}
              />
            )}
          </Card>

          {/* Urgency */}
          <Card style={styles.section}>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.sectionLabel}>⚡ Urgent (ASAP)</Text>
                <Text style={styles.rowDesc}>Get priority placement</Text>
              </View>
              <Switch
                value={form.urgency === 'asap'}
                onValueChange={(v) => update('urgency', v ? 'asap' : 'normal')}
                thumbColor="#fff"
                trackColor={{ false: '#d4e8da', true: '#f97316' }}
              />
            </View>
          </Card>

          {/* Location */}
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>Location</Text>
            {address ? (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#0c8a57" />
                <Text style={styles.locationText} numberOfLines={2}>{address}</Text>
                <TouchableOpacity onPress={getLocation}>
                  <Ionicons name="refresh-outline" size={16} color="#73897a" />
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title={geoLoading ? 'Getting location…' : '📍 Use My Location'}
                onPress={getLocation}
                loading={geoLoading}
                variant="secondary"
                fullWidth
                size="sm"
              />
            )}
          </Card>

          <Button
            title={isSubmitting ? 'Posting…' : 'Post Request →'}
            onPress={handleSubmit}
            loading={isSubmitting}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0faf4' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: '#182a1e' },
  subheading: { fontSize: 13, color: '#73897a', marginTop: -8 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#182a1e' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4e8da',
  },
  catItemActive: { backgroundColor: '#e0f5ec', borderColor: '#0c8a57' },
  catEmoji: { fontSize: 18 },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#73897a' },
  catLabelActive: { color: '#0c8a57' },
  textarea: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e8da',
    color: '#182a1e',
    fontSize: 14,
    padding: 12,
    minHeight: 100,
  },
  charCount: { fontSize: 11, color: '#73897a', textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowInfo: { flex: 1, marginRight: 12 },
  rowDesc: { fontSize: 11, color: '#73897a', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { flex: 1, fontSize: 13, color: '#182a1e' },
  submitBtn: { marginTop: 6 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

const CATEGORIES: { id: OrderCategory; label: string; icon: string }[] = [
  { id: 'food',        label: 'Food',        icon: 'fast-food-outline' },
  { id: 'print',       label: 'Prints',      icon: 'print-outline' },
  { id: 'notes',       label: 'Notes',       icon: 'document-text-outline' },
  { id: 'ride',        label: 'Ride',        icon: 'bicycle-outline' },
  { id: 'assessment',  label: 'Assessment',  icon: 'clipboard-outline' },
  { id: 'project',     label: 'Project',     icon: 'laptop-outline' },
  { id: 'coaching',    label: 'Coaching',    icon: 'school-outline' },
  { id: 'design',      label: 'Design',      icon: 'color-palette-outline' },
  { id: 'event',       label: 'Event',       icon: 'calendar-outline' },
  { id: 'marketplace', label: 'Marketplace', icon: 'cart-outline' },
  { id: 'others',      label: 'Others',      icon: 'cube-outline' },
];

const STEPS = ['Category', 'Details', 'Budget', 'Options'];

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
        {/* Sticky header with step progress */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#182a1e" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.heading}>New Request</Text>
            <Text style={styles.subheading}>Tell your campus what you need</Text>
          </View>
        </View>

        {/* Step progress bar */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => {
            const filled =
              i === 0 ? true :
              i === 1 ? form.description.trim().length > 0 :
              i === 2 ? !!form.budget :
              true;
            return (
              <View key={step} style={styles.stepItem}>
                <View style={[styles.stepBar, filled && styles.stepBarFilled]} />
                <Text style={[styles.stepLabel, filled && styles.stepLabelFilled]}>{step}</Text>
              </View>
            );
          })}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
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
                  <View style={[styles.catIconWrap, form.category === cat.id && styles.catIconWrapActive]}>
                    <Ionicons
                      name={cat.icon as any}
                      size={18}
                      color={form.category === cat.id ? '#0c8a57' : '#73897a'}
                    />
                  </View>
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
            <Text style={styles.sectionLabel}>Pricing Mode</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, form.mode === 'fixed' && styles.modeBtnActive]}
                onPress={() => update('mode', 'fixed')}
              >
                <Text style={[styles.modeBtnText, form.mode === 'fixed' && styles.modeBtnTextActive]}>
                  Fixed Price
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, form.mode === 'bidding' && styles.modeBtnActive]}
                onPress={() => update('mode', 'bidding')}
              >
                <Text style={[styles.modeBtnText, form.mode === 'bidding' && styles.modeBtnTextActive]}>
                  Open Bidding
                </Text>
              </TouchableOpacity>
            </View>
            {form.mode === 'fixed' && (
              <>
                {/* Quick preset chips */}
                <View style={styles.presetsRow}>
                  {['50', '100', '200', '500'].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.presetChip, form.budget === amt && styles.presetChipActive]}
                      onPress={() => update('budget', form.budget === amt ? '' : amt)}
                    >
                      <Text style={[styles.presetChipText, form.budget === amt && styles.presetChipTextActive]}>
                        ₹{amt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Input
                  label="Budget (₹)"
                  value={form.budget}
                  onChangeText={(v) => update('budget', v)}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="cash-outline" size={18} color="#73897a" />}
                  containerStyle={{ marginTop: 4 }}
                />
              </>
            )}
          </Card>

          {/* Urgency */}
          <Card style={styles.section}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => update('urgency', form.urgency === 'asap' ? 'normal' : 'asap')}
              activeOpacity={0.7}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.sectionLabel}>⚡ Urgent (ASAP)</Text>
                <Text style={styles.rowDesc}>Get priority placement</Text>
              </View>
              <View style={[styles.toggleTrack, form.urgency === 'asap' && styles.toggleTrackOn]}>
                <View style={[styles.toggleThumb, form.urgency === 'asap' && styles.toggleThumbOn]} />
              </View>
            </TouchableOpacity>
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

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
    backgroundColor: '#f0faf4',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4e8da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  heading: { fontSize: 17, fontWeight: '800', color: '#182a1e' },
  subheading: { fontSize: 11, color: '#73897a', marginTop: 1 },

  // Step progress
  stepsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#f0faf4',
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8da',
  },
  stepItem: { flex: 1, alignItems: 'center', gap: 3 },
  stepBar: { height: 3, width: '100%', borderRadius: 3, backgroundColor: '#d4e8da' },
  stepBarFilled: { backgroundColor: '#0c8a57' },
  stepLabel: { fontSize: 9, color: '#73897a', fontWeight: '600' },
  stepLabelFilled: { color: '#0c8a57' },

  // Sections
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#182a1e' },

  // Categories
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
  catEmoji: { fontSize: 18 },  // kept for compat
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f0faf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconWrapActive: { backgroundColor: '#dcfce7' },
  catLabel: { fontSize: 12, fontWeight: '600', color: '#73897a' },
  catLabelActive: { color: '#0c8a57' },

  // Description
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

  // Pricing mode
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e8da',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#0c8a57',
    borderColor: '#0c8a57',
    shadowColor: '#0c8a57',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#73897a' },
  modeBtnTextActive: { color: '#ffffff' },

  // Budget presets
  presetsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4e8da',
  },
  presetChipActive: { backgroundColor: '#e0f5ec', borderColor: '#0c8a57' },
  presetChipText: { fontSize: 12, fontWeight: '600', color: '#73897a' },
  presetChipTextActive: { color: '#0c8a57' },

  // Misc
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowInfo: { flex: 1, marginRight: 12 },
  rowDesc: { fontSize: 11, color: '#73897a', marginTop: 2 },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d4e8da',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: { backgroundColor: '#f97316' },
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
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { flex: 1, fontSize: 13, color: '#182a1e' },
  submitBtn: { marginTop: 6 },
});

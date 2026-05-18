import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    hostel: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Toast.show({ type: 'error', text1: 'Name, email and password are required' });
      return;
    }
    if (form.password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        hostel: form.hostel.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'Account created! 🎉' });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>
          <Text style={styles.appName}>CampusHub</Text>
        </View>

        <Card shadow style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join your campus community</Text>

          <View style={styles.fields}>
            <Input
              label="Full Name *"
              value={form.name}
              onChangeText={(v) => update('name', v)}
              placeholder="Your name"
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={18} color="#73897a" />}
            />
            <Input
              label="College Email *"
              value={form.email}
              onChangeText={(v) => update('email', v)}
              placeholder="you@college.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color="#73897a" />}
            />
            <Input
              label="Password *"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              placeholder="Min. 6 characters"
              secureTextEntry={!showPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#73897a" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#73897a"
                  />
                </TouchableOpacity>
              }
            />
            <Input
              label="Hostel (optional)"
              value={form.hostel}
              onChangeText={(v) => update('hostel', v)}
              placeholder="e.g. Block A"
              leftIcon={<Ionicons name="home-outline" size={18} color="#73897a" />}
            />
            <Input
              label="Phone (optional)"
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
              placeholder="+91 9XXXXXXXXX"
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color="#73897a" />}
            />
          </View>

          <Button
            title={isLoading ? 'Creating account…' : 'Create Account →'}
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
            size="lg"
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0faf4' },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoWrap: { alignItems: 'center', gap: 8 },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0c8a57',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 32 },
  appName: { fontSize: 24, fontWeight: '800', color: '#0c8a57' },
  card: { gap: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#182a1e' },
  subtitle: { fontSize: 13, color: '#73897a', marginTop: -12 },
  fields: { gap: 12 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: { fontSize: 13, color: '#73897a' },
  loginLink: { fontSize: 13, color: '#0c8a57', fontWeight: '700' },
});

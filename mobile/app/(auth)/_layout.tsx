import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) return null;
  if (isAuthenticated) return <Redirect href="/(tabs)/feed" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0d0d14' },
      }}
    />
  );
}

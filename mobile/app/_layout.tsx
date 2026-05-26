import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="orders/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Order Details',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="wallet"
            options={{
              headerShown: true,
              headerTitle: 'Wallet',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              headerTitle: 'Notifications',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="provider"
            options={{
              headerShown: true,
              headerTitle: 'Provider Mode',
              headerStyle: { backgroundColor: '#0d0d14' },
              headerTintColor: '#ffffff',
            }}
          />
        </Stack>
        <StatusBar style="light" />
        <Toast />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

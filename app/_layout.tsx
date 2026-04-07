import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { useStore } from '@/store';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const { token, user } = useStore();
  const segments = useSegments();
  const inAuthGroup = segments[0] === '(auth)';
  const inOnboarding = segments[0] === 'onboarding';

  if (!token && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect to onboarding if new user hasn't set their goal yet
  if (token && user && !user.onboardingDone && !inOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (token && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { appTheme } = useStore();

  const colorScheme = appTheme === 'system' ? systemColorScheme : appTheme;

  // React hook dependency
  const { useEffect } = require('react');
  
  useEffect(() => {
    scheduleDailyReminder();
  }, []);

  const scheduleDailyReminder = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasReminder = scheduled.some(n => n.content.data?.type === 'daily_reminder');

    if (!hasReminder) {
      // Need type cast because of expo-notifications differences in TS, but 'any' works
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Keep your streak alive! 🔥",
          body: "Don't forget to log your meals or workout today.",
          data: { type: 'daily_reminder' },
        },
        trigger: {
          type: 'daily',
          hour: 20,
          minute: 0,
        } as any,
      });
    }
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="index" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <AuthGate />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}


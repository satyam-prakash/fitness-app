/**
 * Central hook for reading the active theme.
 * Respects the user's manual toggle in Zustand (appTheme),
 * falling back to the OS scheme when set to 'system'.
 */
import { useColorScheme } from 'react-native';
import { useStore } from '@/store';
import Colors from '@/constants/Colors';

export function useAppTheme() {
  const { appTheme } = useStore();
  const systemScheme = useColorScheme();
  const activeScheme = appTheme === 'system' ? (systemScheme ?? 'dark') : appTheme;
  const theme = Colors[activeScheme];
  return { theme, colorScheme: activeScheme };
}

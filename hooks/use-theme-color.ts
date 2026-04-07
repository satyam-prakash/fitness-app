/**
 * Reads color from the active theme (Zustand-aware).
 */

import Colors from '@/constants/Colors';
import { useAppTheme } from '@/hooks/use-app-theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { colorScheme } = useAppTheme();
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorScheme][colorName];
  }
}

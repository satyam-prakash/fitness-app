import * as Haptics from 'expo-haptics';
import { useStore } from '@/store';

export const useHaptics = () => {
  const hapticsEnabled = useStore(state => state.hapticsEnabled);

  const light = () => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const medium = () => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  const heavy = () => { if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); };
  const success = () => { if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  const error = () => { if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); };
  const warning = () => { if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); };
  const selection = () => { if (hapticsEnabled) Haptics.selectionAsync(); };

  return { light, medium, heavy, success, error, warning, selection };
};

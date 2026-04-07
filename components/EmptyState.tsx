import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/hooks/use-app-theme';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.tint + '15' }]}>
        {icon}
      </View>
      <ThemedText type="subtitle" style={{ marginTop: 16, textAlign: 'center' }}>{title}</ThemedText>
      {subtitle && (
        <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', marginTop: 8 }}>
          {subtitle}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.tint }]} 
          onPress={onAction}
        >
          <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>{actionLabel}</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  }
});

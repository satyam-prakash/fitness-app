import React from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStore } from '@/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { LogOut, Moon, Sun, User } from 'lucide-react-native';

export default function ProfileScreen() {
  const { appTheme, toggleTheme, user, logout } = useStore();
  const { theme, colorScheme } = useAppTheme();
  const isDarkMode = colorScheme === 'dark';

  const handleLogout = () => {
    logout();
  };

  const toggleSwitch = () => {
    toggleTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.border }]}>
          <View style={styles.avatar}>
            <User color="#fff" size={40} />
          </View>
          <ThemedText type="subtitle" style={{ marginTop: 16 }}>{user?.name || 'Fitness User'}</ThemedText>
          <ThemedText style={{ color: theme.tabIconDefault }}>{user?.email || 'user@example.com'}</ThemedText>
        </View>

        <ThemedText type="subtitle" style={{ marginVertical: 16 }}>Settings</ThemedText>

        <View style={[styles.settingRow, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isDarkMode ? <Moon color={theme.text} size={20} /> : <Sun color={theme.text} size={20} />}
            <ThemedText style={{ marginLeft: 12 }}>Dark Mode</ThemedText>
          </View>
          <Switch
            trackColor={{ false: '#767577', true: theme.tint }}
            thumbColor={'#fff'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isDarkMode}
          />
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: theme.accent3 }]}
          onPress={handleLogout}
        >
          <LogOut color={theme.accent3} size={20} />
          <ThemedText type="defaultSemiBold" style={{ marginLeft: 10, color: theme.accent3 }}>Log Out</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  content: { padding: 20 },
  card: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  }
});

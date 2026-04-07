import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStore } from '@/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Link, useRouter } from 'expo-router';
import axios from 'axios';

// Replace with your actual local machine IP if testing on physical device, e.g. 192.168.1.100
const API_URL = 'http://localhost:5000/api';

export default function LoginScreen() {
  const { setUser } = useStore();
  const { theme } = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/users/login`, { email, password });
      setUser(data, data.token);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={{ fontSize: 32, marginBottom: 10 }}>Welcome Back</ThemedText>
        <ThemedText style={{ color: theme.tabIconDefault, marginBottom: 40 }}>Sign in to continue tracking your fitness.</ThemedText>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email address"
            placeholderTextColor={theme.tabIconDefault}
            style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.tabIconDefault}
            style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, { backgroundColor: theme.tint }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Sign In</ThemedText>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText style={{ color: theme.tabIconDefault }}>Don't have an account? </ThemedText>
          <Link href="/(auth)/signup">
            <ThemedText type="defaultSemiBold" style={{ color: theme.tint }}>Sign Up</ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 30,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  loginBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  }
});

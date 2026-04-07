import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStore } from '@/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Link, useRouter } from 'expo-router';
import { signupApi } from '@/services/api';

export default function SignupScreen() {
  const { setUser } = useStore();
  const { theme } = useAppTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name) return;
    setLoading(true);
    try {
      const { data } = await signupApi(name, email, password);
      setUser(data, data.token);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Signup Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={{ fontSize: 32, marginBottom: 10 }}>Create Account</ThemedText>
        <ThemedText style={{ color: theme.tabIconDefault, marginBottom: 40 }}>Start your personalized fitness journey.</ThemedText>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={theme.tabIconDefault}
            style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
            value={name}
            onChangeText={setName}
          />
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
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Sign Up</ThemedText>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <ThemedText style={{ color: theme.tabIconDefault }}>Already have an account? </ThemedText>
          <Link href="/(auth)/login">
            <ThemedText type="defaultSemiBold" style={{ color: theme.tint }}>Sign In</ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  inputContainer: { gap: 16, marginBottom: 30 },
  input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16 },
  loginBtn: { height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 }
});

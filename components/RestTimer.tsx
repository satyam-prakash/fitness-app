import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RestTimerProps {
  initialSeconds?: number;
  onDismiss: () => void;
}

export default function RestTimer({ initialSeconds = 90, onDismiss }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Load persisted time
    AsyncStorage.getItem('restDuration').then((val) => {
      if (val) setSeconds(parseInt(val, 10));
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
      if (seconds === 10) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else if (isActive && seconds === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsActive(false);
      onDismiss();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, onDismiss]);

  const addTime = () => setSeconds((s) => s + 30);
  const setPersistedTime = (time: number) => {
    setSeconds(time);
    AsyncStorage.setItem('restDuration', time.toString());
  };

  return (
    <View style={[styles.container, seconds <= 10 && styles.warningContainer]}>
      <Text style={styles.time}>{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setPersistedTime(60)} style={styles.btn}><Text style={styles.btnText}>60s</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPersistedTime(90)} style={styles.btn}><Text style={styles.btnText}>90s</Text></TouchableOpacity>
        <TouchableOpacity onPress={addTime} style={styles.btn}><Text style={styles.btnText}>+30s</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} style={styles.btn}><Text style={styles.btnText}>Skip</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#333', borderRadius: 10, alignItems: 'center' },
  warningContainer: { backgroundColor: '#8a6d3b' },
  time: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  controls: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { padding: 10, backgroundColor: '#555', borderRadius: 5 },
  btnText: { color: '#fff' }
});
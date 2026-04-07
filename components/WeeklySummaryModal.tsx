import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getWeeklySummaryApi } from '@/services/api';
import { X, Share2, Award, Flame, Target } from 'lucide-react-native';

export function WeeklySummaryModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadSummary();
    }
  }, [visible]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await getWeeklySummaryApi();
      setData(res.data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!data) return;
    const msg = `This week I completed ${data.workouts} workouts, hit my protein goal ${data.proteinGoalDaysHit} times, and averaged ${data.avgCalories} cals a day! 🚀 #FitnessJourney`;
    try {
      await Share.share({ message: msg });
    } catch (error) {
      console.error(error);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.header}>
            <ThemedText type="title" style={{ fontSize: 24 }}>Weekly Summary</ThemedText>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.background }]}>
              <X size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.tint} />
            </View>
          ) : data ? (
            <View style={styles.content}>
              <ThemedText style={{ color: theme.tabIconDefault, fontSize: 16, marginBottom: 20 }}>
                {data.workouts > 3 
                  ? "Incredible week! You're crushing it." 
                  : "Great effort this week. Let's aim even higher next week!"}
              </ThemedText>

              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <Award color={theme.accent2} size={24} />
                  <ThemedText type="title" style={{ fontSize: 28, marginTop: 8 }}>{data.workouts}</ThemedText>
                  <ThemedText style={{ color: theme.tabIconDefault }}>Workouts</ThemedText>
                </View>
                
                <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <Flame color={theme.tint} size={24} />
                  <ThemedText type="title" style={{ fontSize: 28, marginTop: 8 }}>{data.avgCalories}</ThemedText>
                  <ThemedText style={{ color: theme.tabIconDefault }}>Avg Cals</ThemedText>
                </View>

                <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: theme.background, width: '100%' }]}>
                  <Target color={theme.accent3} size={24} />
                  <ThemedText type="title" style={{ fontSize: 28, marginTop: 8 }}>{data.proteinGoalDaysHit}/7</ThemedText>
                  <ThemedText style={{ color: theme.tabIconDefault }}>Days hitting Protein Goal</ThemedText>
                </View>
              </View>

              <TouchableOpacity style={[styles.shareBtn, { backgroundColor: theme.tint }]} onPress={handleShare}>
                <Share2 color="#fff" size={20} />
                <ThemedText type="defaultSemiBold" style={{ color: '#fff', marginLeft: 8 }}>Share Progress</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ThemedText>Failed to load summary</ThemedText>
            </View>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    width: '47%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  }
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useStore } from '@/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Activity, Flame, Droplet, Plus, BrainCircuit, RefreshCw, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklySummaryModal } from '@/components/WeeklySummaryModal';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useHaptics } from '@/hooks/useHaptics';

export default function DashboardScreen() {
  const { theme, colorScheme } = useAppTheme();
  const { dailyGoal, consumed, fetchTodayLog, coachInsight, fetchCoachInsight, streaks, fetchStreaks, waterMl, addWaterMl } = useStore();
  
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [refreshingCoach, setRefreshingCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        fetchTodayLog(),
        fetchCoachInsight(),
        fetchStreaks(),
        checkWeeklySummary()
      ]);
      setLoading(false);
    }
    init();
  }, []);

  const onRefresh = async () => {
    haptics.light();
    setRefreshing(true);
    await Promise.all([
      fetchTodayLog(),
      fetchCoachInsight(true),
      fetchStreaks(),
      checkWeeklySummary()
    ]);
    setRefreshing(false);
  };

  const checkWeeklySummary = async () => {
    const today = new Date();
    if (today.getDay() === 1) { // 1 is Monday
      const lastShown = await AsyncStorage.getItem('lastSummaryShown');
      const dateStr = today.toISOString().split('T')[0];
      if (lastShown !== dateStr) {
        setShowSummaryModal(true);
        await AsyncStorage.setItem('lastSummaryShown', dateStr);
      }
    }
  };

  const manuallyRefreshCoach = async () => {
    setRefreshingCoach(true);
    await fetchCoachInsight(true);
    setRefreshingCoach(false);
  };



  const calsLeft = Math.max(0, dailyGoal.calories - consumed.calories);
  const calsProgress = Math.min(1, consumed.calories / dailyGoal.calories) * 100;
  const calsColor = calsProgress > 100 ? theme.accent3 : theme.tint;

  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="subtitle" style={{ color: theme.tabIconDefault }}>Today</ThemedText>
          <ThemedText type="title" style={{ fontSize: 28 }}>Overview</ThemedText>
        </View>
        <TouchableOpacity style={[styles.profileIcon, { backgroundColor: theme.cardBackground }]}>
          <Activity color={theme.tint} size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <>
          <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Flame color={theme.tint} size={20} />
              <ThemedText type="subtitle" style={{ marginLeft: 8 }}>Calories</ThemedText>
            </View>
            <View style={styles.ringContainer}>
              <SkeletonLoader type="chart" style={{ width: 160, height: 160, borderRadius: 80 }} />
            </View>
            <View style={styles.macrosRow}>
              <SkeletonLoader type="list-item" style={{ flex: 1, marginHorizontal: 4, height: 80 }} />
              <SkeletonLoader type="list-item" style={{ flex: 1, marginHorizontal: 4, height: 80 }} />
              <SkeletonLoader type="list-item" style={{ flex: 1, marginHorizontal: 4, height: 80 }} />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.border, marginTop: 20 }]}>
            <SkeletonLoader type="card" />
          </View>
        </>
      ) : (
        <>
          {/* Main Calorie Ring Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Flame color={theme.tint} size={20} />
              <ThemedText type="subtitle" style={{ marginLeft: 8 }}>Calories</ThemedText>
            </View>
            
            <View style={styles.ringContainer}>
              {/* Simple ring representation using border radius */}
              <View style={[styles.outerRing, { borderColor: theme.border }]}>
                 <View style={[styles.innerRing, { 
                    borderColor: calsColor, 
                    borderBottomColor: calsProgress > 25 ? calsColor : theme.border,
                    borderLeftColor: calsProgress > 50 ? calsColor : theme.border,
                    borderTopColor: calsProgress > 75 ? calsColor : theme.border,
                    transform: [{ rotate: '45deg' }]
                 }]}>
                   <View style={{ transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center' }}>
                      <ThemedText type="title" style={{ fontSize: 32 }}>{calsLeft}</ThemedText>
                      <ThemedText style={{ color: theme.tabIconDefault }}>Remaining</ThemedText>
                   </View>
                 </View>
              </View>
            </View>

            {/* Streaks Row */}
            {streaks && (
              <TouchableOpacity 
                style={[styles.streaksRow, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => Alert.alert('Longest Streak', `Your longest logging streak is ${streaks.longestLoggingStreak} days!`)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Zap color={theme.accent1} size={16} />
                  <ThemedText style={{ marginLeft: 6, fontSize: 13, fontWeight: '600' }}>
                    {streaks.loggingStreak} Day{streaks.loggingStreak !== 1 && 's'} Log Streak
                  </ThemedText>
                </View>
                <View style={{ width: 1, height: 16, backgroundColor: theme.border, marginHorizontal: 16 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame color={theme.accent2} size={16} />
                  <ThemedText style={{ marginLeft: 6, fontSize: 13, fontWeight: '600' }}>
                    {streaks.workoutStreak} Day{streaks.workoutStreak !== 1 && 's'} Workout Streak
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}

            {/* Macros */}
            <View style={styles.macrosRow}>
              <MacroPill 
                label="Protein" 
                value={consumed.protein} 
                total={dailyGoal.protein} 
                color={theme.tint} 
                theme={theme} 
              />
              <MacroPill 
                label="Carbs" 
                value={consumed.carbs} 
                total={dailyGoal.carbs} 
                color={theme.accent2} 
                theme={theme} 
              />
              <MacroPill 
                label="Fat" 
                value={consumed.fats} 
                total={dailyGoal.fats} 
                color={theme.accent3} 
                theme={theme} 
              />
            </View>
          </View>

          {/* AI Insights Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.border, marginTop: 20 }]}>
            <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BrainCircuit color={theme.accent1} size={20} />
                <ThemedText type="subtitle" style={{ marginLeft: 8 }}>Smart Coach</ThemedText>
              </View>
              <TouchableOpacity onPress={manuallyRefreshCoach} disabled={refreshingCoach}>
                <RefreshCw color={theme.tint} size={18} opacity={refreshingCoach ? 0.4 : 1} />
              </TouchableOpacity>
            </View>
            <View style={[styles.insightBox, { backgroundColor: colorScheme === 'dark' ? '#1e3a8a22' : '#eff6ff' }]}>
               {!coachInsight?.text || refreshingCoach ? (
                 <View style={{ marginVertical: 8 }}>
                   <SkeletonLoader type="list-item" />
                 </View>
               ) : (
                 <ThemedText style={{ color: theme.text, lineHeight: 22 }}>
                   {coachInsight.text}
                 </ThemedText>
               )}
            </View>
          </View>
          
          {/* Water Tracker */}
          <WaterTrackerCard 
            theme={theme} 
            waterMl={waterMl} 
            addWaterMl={addWaterMl} 
            haptics={haptics} 
          />
        </>
      )}


      {/* Quick Add Actions */}
      <ThemedText type="subtitle" style={{ marginTop: 24, marginBottom: 12 }}>Quick Log</ThemedText>
      <View style={styles.quickAddGrid}>
        <QuickAddBtn icon={<Plus color={theme.tint} size={24} />} label="Log Meal" subLabel="Food DB" theme={theme} />
        <QuickAddBtn icon={<Activity color={theme.accent2} size={24} />} label="Workout" subLabel="Strength" theme={theme} />
      </View>

    </ScrollView>
      
      <WeeklySummaryModal visible={showSummaryModal} onClose={() => setShowSummaryModal(false)} />
    </>
  );
}

function MacroPill({ label, value, total, color, theme }: any) {
  const percent = Math.min(100, (value / total) * 100);
  return (
    <View style={styles.macroPill}>
      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 13, marginBottom: 4 }}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold" style={{ marginBottom: 6 }}>{value} / {total}g</ThemedText>
      <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
        <View style={[styles.progressBarFill, { backgroundColor: color, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

function QuickAddBtn({ icon, label, subLabel, theme }: any) {
  return (
    <TouchableOpacity style={[styles.quickBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={[styles.iconWrapper, { backgroundColor: theme.background }]}>
        {icon}
      </View>
      <View style={{ marginLeft: 12 }}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
        <ThemedText style={{ color: theme.tabIconDefault, fontSize: 12 }}>{subLabel}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

function WaterTrackerCard({ theme, waterMl, addWaterMl, haptics }: any) {
  const [showWaterModal, setShowWaterModal] = useState(false);
  const targetWater = 3000; // 3 Liters
  const progress = Math.min(waterMl / targetWater, 1);

  const addWater = (amount: number) => {
    haptics.success();
    addWaterMl(amount);
    setShowWaterModal(false);
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.border, marginTop: 20 }]}>
        <View style={[styles.cardHeader, { justifyContent: 'space-between', marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Droplet color={theme.accent1} size={20} />
            <ThemedText type="subtitle" style={{ marginLeft: 8 }}>Hydration</ThemedText>
          </View>
          <TouchableOpacity onPress={() => { haptics.light(); setShowWaterModal(true); }}>
            <Plus color={theme.tint} size={20} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <ThemedText type="title" style={{ fontSize: 24 }}>{waterMl} <ThemedText style={{ fontSize: 16, color: theme.tabIconDefault }}>ml</ThemedText></ThemedText>
            <ThemedText style={{ color: theme.tabIconDefault, fontSize: 13 }}>of {targetWater} ml daily goal</ThemedText>
          </View>
          <Droplet color={progress >= 1 ? theme.accent1 : theme.tabIconDefault} fill={progress >= 1 ? theme.accent1 : 'transparent'} size={32} />
        </View>

        {/* Progress bar */}
        <View style={[styles.progressBarBg, { backgroundColor: theme.border, height: 12, borderRadius: 6, marginTop: 16 }]}>
          <View style={[styles.progressBarFill, { backgroundColor: theme.accent1, width: `${progress * 100}%`, height: 12, borderRadius: 6 }]} />
        </View>
      </View>

      {/* Add Water Modal */}
      <Modal visible={showWaterModal} transparent animationType="slide" onRequestClose={() => setShowWaterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.waterModalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <ThemedText type="title" style={{ fontSize: 20 }}>Log Water</ThemedText>
              <TouchableOpacity onPress={() => setShowWaterModal(false)}>
                <ThemedText style={{ color: theme.tint }}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={{ gap: 12 }}>
              <TouchableOpacity style={[styles.waterOptionBtn, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={() => addWater(250)}>
                <Droplet color={theme.accent1} size={24} />
                <ThemedText style={{ paddingLeft: 12, flex: 1, fontSize: 16 }}>Glass</ThemedText>
                <ThemedText style={{ color: theme.tabIconDefault }}>250 ml</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.waterOptionBtn, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={() => addWater(500)}>
                <Droplet color={theme.accent1} size={28} />
                <ThemedText style={{ paddingLeft: 12, flex: 1, fontSize: 16 }}>Small Bottle</ThemedText>
                <ThemedText style={{ color: theme.tabIconDefault }}>500 ml</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.waterOptionBtn, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={() => addWater(1000)}>
                <Droplet color={theme.accent1} size={32} />
                <ThemedText style={{ paddingLeft: 12, flex: 1, fontSize: 16 }}>Large Bottle</ThemedText>
                <ThemedText style={{ color: theme.tabIconDefault }}>1000 ml</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 15,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroPill: {
    flex: 1,
    marginHorizontal: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightBox: {
    padding: 16,
    borderRadius: 16,
  },
  quickAddGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streaksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    marginTop: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  waterModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  waterOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  }
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  getWeeklyDietApi,
  getWeeklyWorkoutsApi,
  logBodyWeightApi,
  getBodyHistoryApi,
  getCorrelationApi,
  getMuscleGroupsApi,
  getDietByMealApi,
  getProfileApi
} from '@/services/api';
import { TrendingUp, Flame, Dumbbell, Target, Scale, Activity, PieChart, Info, Check } from 'lucide-react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import { useHaptics } from '@/hooks/useHaptics';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;
const MAX_BAR_HEIGHT = 120;

interface DayData {
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface WorkoutDay {
  day: string;
  count: number;
  duration: number;
}

function BarChart({ data, valueKey, color, maxVal, goal }: {
  data: any[];
  valueKey: string;
  color: string;
  maxVal: number;
  goal?: number;
}) {
  const { theme } = useAppTheme();
  const adjustedMax = goal ? Math.max(maxVal, goal) : maxVal;
  const goalHeight = goal ? (goal / adjustedMax) * MAX_BAR_HEIGHT : 0;

  return (
    <View style={styles.barChart}>
      {goal && (
        <View style={[styles.goalLine, { bottom: goalHeight + 20, borderColor: theme.accent3 }]} />
      )}
      {data.map((item, i) => {
        const val = item[valueKey] || 0;
        const height = adjustedMax > 0 ? Math.max(2, (val / adjustedMax) * MAX_BAR_HEIGHT) : 2;
        return (
          <View key={i} style={styles.barWrapper}>
            <ThemedText style={[styles.barValue, { color: theme.tabIconDefault }]}>
              {val > 0 ? Math.round(val) : ''}
            </ThemedText>
            <View style={[styles.barBg, { backgroundColor: theme.border, height: MAX_BAR_HEIGHT }]}>
              <View style={[styles.barFill, { backgroundColor: color, height }]} />
            </View>
            <ThemedText style={[styles.barLabel, { color: theme.tabIconDefault }]}>
              {item.day ? String(item.day).slice(0, 3) : ''}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function StatCard({ icon, label, value, sub, color, theme }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>{icon}</View>
      <ThemedText type="title" style={{ fontSize: 24, marginTop: 8 }}>{value}</ThemedText>
      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 13 }}>{label}</ThemedText>
      {sub && <ThemedText style={{ color: theme.tint, fontSize: 12, marginTop: 2 }}>{sub}</ThemedText>}
    </View>
  );
}

export default function AnalyticsScreen() {
  const { theme } = useAppTheme();
  const [days, setDays] = useState<number>(7);
  const [dietData, setDietData] = useState<DayData[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutDay[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  
  // New section states
  const [weightHistory, setWeightHistory] = useState<any[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);
  
  const [muscleGroups, setMuscleGroups] = useState<any>({});
  const [correlationData, setCorrelationData] = useState<any>(null);
  const [dietByMeal, setDietByMeal] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        dietRes,
        workoutRes,
        profileRes,
        weightRes,
        muscleRes,
        corrRes,
        mealRes
      ] = await Promise.all([
        getWeeklyDietApi(days),
        getWeeklyWorkoutsApi(days),
        getProfileApi(),
        getBodyHistoryApi(days),
        getMuscleGroupsApi(days),
        getCorrelationApi(),
        getDietByMealApi(days)
      ]);
      
      const diet = dietRes.data.data || [];
      setDietData(diet);
      setWorkoutData(workoutRes.data.data || []);
      setUser(profileRes.data);
      setWeightHistory(weightRes.data || []);
      setMuscleGroups(muscleRes.data || {});
      setCorrelationData(corrRes.data);
      setDietByMeal(mealRes.data || {});

      const avg = diet.reduce(
        (acc, d) => ({
          calories: acc.calories + d.calories,
          protein: acc.protein + d.protein,
        }),
        { calories: 0, protein: 0 }
      );
      setTotals({
        avgCals: Math.round(avg.calories / (diet.length || 1)),
        totalProtein: Math.round(avg.protein),
        totalWorkouts: workoutRes.data.total || 0,
        activeDays: diet.filter(d => d.calories > 0).length,
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    haptics.light();
    setRefreshing(true);
    loadData();
  };

  const handleLogWeight = async () => {
    if (!newWeight || isNaN(Number(newWeight))) return;
    setIsSubmittingWeight(true);
    try {
      await logBodyWeightApi(Number(newWeight));
      setNewWeight('');
      const weightRes = await getBodyHistoryApi(days);
      setWeightHistory(weightRes.data || []);
    } catch(e) {
      console.error(e);
    }
    setIsSubmittingWeight(false);
  };

  const maxCals = dietData && dietData.length > 0 ? Math.max(...dietData.map(d => d.calories || 0), 1) : 1;
  const maxProtein = dietData && dietData.length > 0 ? Math.max(...dietData.map(d => d.protein || 0), 1) : 1;
  const targetCals = user?.goal_config?.target_calories;

  let weightDiffText = "No previous data";
  let weightDiffColor = theme.tabIconDefault;
  if(weightHistory.length >= 2) {
    const oldest = weightHistory[weightHistory.length - 1].weight;
    const latest = weightHistory[0].weight;
    const diff = latest - oldest;
    if(diff > 0) {
      weightDiffText = `+${diff.toFixed(1)} kg over period`;
      weightDiffColor = theme.accent2; // gained
    } else if (diff < 0) {
      weightDiffText = `${diff.toFixed(1)} kg over period`;
      weightDiffColor = theme.accent1; // lost
    } else {
      weightDiffText = "Maintained weight";
    }
  }

  // Calculate highest muscle volume for charts
  const muscleVals = Object.values(muscleGroups).map((v: any) => Number(v));
  const maxMuscleVol = Math.max(...muscleVals, 1);

  // Meal breakdown percentages
  const mealTotalCals = Object.values(dietByMeal).reduce((acc: number, val: any) => acc + (val.calories || 0), 0) as number || 1;

  if (loading && dietData.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingHorizontal: 20, paddingTop: 60 }]}>
          <TrendingUp color={theme.tint} size={24} />
          <ThemedText type="title" style={{ marginLeft: 10, fontSize: 26, flex: 1 }}>Analytics</ThemedText>
        </View>
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <View style={styles.statsGrid}>
            <SkeletonLoader type="card" style={{ flex: 1 }} />
            <SkeletonLoader type="card" style={{ flex: 1 }} />
          </View>
          <View style={styles.statsGrid}>
            <SkeletonLoader type="card" style={{ flex: 1 }} />
            <SkeletonLoader type="card" style={{ flex: 1 }} />
          </View>
          <SkeletonLoader type="chart" />
        </View>
      </ThemedView>
    );
  }

  const isCompletelyEmpty = !loading && totals.activeDays === 0 && totals.totalWorkouts === 0 && weightHistory.length === 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TrendingUp color={theme.tint} size={24} />
          <ThemedText type="title" style={{ marginLeft: 10, fontSize: 26, flex: 1 }}>Analytics</ThemedText>
          <View style={styles.timeToggle}>
            {[7, 30, 90].map(d => (
              <TouchableOpacity 
                key={d} 
                style={[styles.toggleBtn, days === d && { backgroundColor: theme.tint, borderColor: theme.tint }]}
                onPress={() => setDays(d)}
              >
                <ThemedText style={[styles.toggleText, days === d && { color: '#fff' }]}>{d}D</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isCompletelyEmpty ? (
          <EmptyState 
            icon={<PieChart size={40} color={theme.tabIconDefault} />}
            title="No data yet"
            subtitle="Log your diet or workouts to see analytics."
          />
        ) : (
          <>
            {/* Summary Stats */}
            <View style={styles.statsGrid}>
              <StatCard icon={<Flame color={theme.tint} size={20} />} label="Avg Daily Cals" value={totals.avgCals || 0} sub="kcal / day" color={theme.tint} theme={theme} />
              <StatCard icon={<Target color={theme.accent1} size={20} />} label="Total Protein" value={`${totals.totalProtein || 0}g`} sub="this period" color={theme.accent1} theme={theme} />
              <StatCard icon={<Dumbbell color={theme.accent2} size={20} />} label="Workouts" value={totals.totalWorkouts || 0} sub="sessions" color={theme.accent2} theme={theme} />
              <StatCard icon={<TrendingUp color={theme.accent3} size={20} />} label="Active Days" value={totals.activeDays || 0} sub={`out of ${days}`} color={theme.accent3} theme={theme} />
            </View>

            {/* Weight Tracking */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <Scale color={theme.accent1} size={18} />
            <ThemedText type="defaultSemiBold" style={{ marginLeft: 8, flex: 1 }}>Weight Tracking</ThemedText>
          </View>
          
          <View style={styles.weightInputRow}>
            <TextInput
              style={[styles.weightInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Enter today's weight (kg)"
              placeholderTextColor={theme.tabIconDefault}
              keyboardType="numeric"
              value={newWeight}
              onChangeText={setNewWeight}
            />
            <TouchableOpacity 
              style={[styles.weightSubmit, { backgroundColor: theme.accent1 }]} 
              onPress={handleLogWeight}
              disabled={isSubmittingWeight}
            >
              {isSubmittingWeight ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Check color="#fff" size={20} />
              )}
            </TouchableOpacity>
          </View>

          {weightHistory.length > 0 && (
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <ThemedText type="title" style={{ fontSize: 32 }}>{weightHistory[0].weight} kg</ThemedText>
              <ThemedText style={{ color: weightDiffColor, fontWeight: 'bold', marginTop: 4 }}>{weightDiffText}</ThemedText>
            </View>
          )}
        </View>

        {/* Calorie Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <Flame color={theme.tint} size={18} />
            <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>Daily Calories</ThemedText>
          </View>
          {dietData && dietData.length > 0 ? (
            <BarChart data={dietData} valueKey="calories" color={theme.tint} maxVal={maxCals} goal={targetCals} />
          ) : (
            <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', paddingVertical: 24 }}>
              No data yet. Start logging meals!
            </ThemedText>
          )}
        </View>

        {/* Protein Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <Target color={theme.accent3} size={18} />
            <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>Daily Protein (g)</ThemedText>
          </View>
          {dietData && dietData.length > 0 ? (
            <BarChart data={dietData} valueKey="protein" color={theme.accent3} maxVal={maxProtein} />
          ) : (
            <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', paddingVertical: 24 }}>No data yet.</ThemedText>
          )}
        </View>

        {/* Workout Activity */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <Dumbbell color={theme.accent2} size={18} />
            <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>Workout Duration (min)</ThemedText>
          </View>
          {workoutData && workoutData.length > 0 ? (
            <BarChart data={workoutData} valueKey="duration" color={theme.accent2} maxVal={Math.max(...workoutData.map(d => d.duration || 0), 1)} />
          ) : (
            <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', paddingVertical: 24 }}>No workout data yet.</ThemedText>
          )}
        </View>

        {/* Muscle Group Volume */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <Activity color={theme.accent1} size={18} />
            <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>Muscle Group Volume</ThemedText>
          </View>
          {Object.keys(muscleGroups).length > 0 ? (
            <View style={{ marginTop: 10 }}>
              {Object.entries(muscleGroups)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 8) // show top 8
                .map(([muscle, vol]: any) => {
                const pct = Math.max(2, (vol / maxMuscleVol) * 100);
                return (
                  <View key={muscle} style={{ marginBottom: 12 }}>
                    <View style={styles.macroLabelRow}>
                      <ThemedText style={{ fontSize: 13, textTransform: 'capitalize' }}>{muscle}</ThemedText>
                      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 12 }}>{vol} reps*kg</ThemedText>
                    </View>
                    <View style={[styles.progressBg, { backgroundColor: theme.border, height: 6 }]}>
                      <View style={[styles.progressFill, { backgroundColor: theme.accent1, width: `${pct}%`, height: 6 }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', paddingVertical: 24 }}>No muscle volume data.</ThemedText>
          )}
        </View>

        {/* Meal Breakdown */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <PieChart color={theme.accent3} size={18} />
            <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>Meal Breakdown</ThemedText>
          </View>
          {Object.keys(dietByMeal).length > 0 ? (
            <View style={{ marginTop: 10 }}>
              {Object.entries(dietByMeal).map(([meal, data]: any) => {
                const pct = Math.round(((data.calories || 0) / mealTotalCals) * 100);
                return (
                  <View key={meal} style={{ marginBottom: 12 }}>
                    <View style={styles.macroLabelRow}>
                      <ThemedText style={{ fontSize: 13, textTransform: 'capitalize' }}>{meal}</ThemedText>
                      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 12 }}>{Math.round(data.calories || 0)} kcal ({pct}%)</ThemedText>
                    </View>
                    <View style={[styles.progressBg, { backgroundColor: theme.border, height: 6 }]}>
                      <View style={[styles.progressFill, { backgroundColor: theme.accent3, width: `${pct}%`, height: 6 }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', paddingVertical: 24 }}>No meal data.</ThemedText>
          )}
        </View>

        {/* Scatter Plot - Correlation */}
        {correlationData && correlationData.scatter && correlationData.scatter.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.chartHeader}>
              <Info color={theme.tint} size={18} />
              <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>Calories vs Workout Volume</ThemedText>
            </View>
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <Svg height="200" width={CHART_WIDTH}>
                {/* Axes */}
                <Line x1="40" y1="180" x2={CHART_WIDTH - 10} y2="180" stroke={theme.border} strokeWidth="2" />
                <Line x1="40" y1="10" x2="40" y2="180" stroke={theme.border} strokeWidth="2" />
                
                {/* Points */}
                {correlationData.scatter.map((pt: any, i: number) => {
                  const maxCalsLine = Math.max(...correlationData.scatter.map((p: any) => p.calories), 1) * 1.1;
                  const maxVolLine = Math.max(...correlationData.scatter.map((p: any) => p.volume), 1) * 1.1;
                  
                  const cx = 40 + (pt.calories / maxCalsLine) * (CHART_WIDTH - 50);
                  const cy = 180 - (pt.volume / maxVolLine) * 170;
                  
                  return (
                    <Circle key={i} cx={cx} cy={cy} r="4" fill={theme.accent2} opacity={0.6} />
                  );
                })}
              </Svg>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              <ThemedText style={{ color: theme.tabIconDefault, fontSize: 11 }}>X: Calories</ThemedText>
              <ThemedText style={{ color: theme.tabIconDefault, fontSize: 11 }}>Y: Volume</ThemedText>
            </View>
          </View>
        )}
          </>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  timeToggle: { flexDirection: 'row', gap: 8, marginTop: 10 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#444' },
  toggleText: { fontSize: 12, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    width: (width - 52) / 2,
    padding: 16, borderRadius: 20, borderWidth: 1,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chartCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: MAX_BAR_HEIGHT + 50 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 2 },
  barValue: { fontSize: 9, marginBottom: 2, height: 12 },
  barBg: { width: '70%', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10, marginTop: 6 },
  goalLine: { position: 'absolute', left: 0, right: 0, borderWidth: 1, borderStyle: 'dashed', zIndex: 0, opacity: 0.5 },
  macroLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  weightInputRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  weightInput: { flex: 1, height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  weightSubmit: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});

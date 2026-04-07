import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStore } from '@/store';
import { saveGoalApi } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Target, Activity, User, Bell } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

type Goal = 'loss' | 'maintenance' | 'gain';
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
type Gender = 'male' | 'female' | 'other';

const GOALS: { id: Goal; label: string; desc: string; emoji: string }[] = [
  { id: 'loss', label: 'Lose Weight', desc: 'Calorie deficit for fat loss', emoji: '🔥' },
  { id: 'maintenance', label: 'Maintain', desc: 'Sustain your current physique', emoji: '⚖️' },
  { id: 'gain', label: 'Gain Muscle', desc: 'Calorie surplus for building', emoji: '💪' },
];

const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; desc: string }[] = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
  { id: 'lightly_active', label: 'Light', desc: '1–3 days/week' },
  { id: 'moderately_active', label: 'Moderate', desc: '3–5 days/week' },
  { id: 'very_active', label: 'Very Active', desc: '6–7 days/week' },
];

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const { setDailyGoal, user } = useStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('70');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age);

    if (!h || !w || !a || h < 100 || w < 30 || a < 10) {
      Alert.alert('Invalid Input', 'Please check your height, weight, and age values.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await saveGoalApi({
        goalType: goal,
        height: h,
        weight: w,
        age: a,
        gender,
        activityLevel,
      });

      // Update local Zustand goal from calculated server TDEE
      setDailyGoal({
        calories: data.calculatedMacros.calories,
        protein: data.calculatedMacros.protein,
        carbs: data.calculatedMacros.carbs,
        fats: data.calculatedMacros.fats,
      });

      // FIX: Update user object in store to reflect onboardingDone = true
      // This prevents AuthGate from redirecting back to onboarding
      const updatedUser = {
        ...user,
        onboardingDone: true,
        goal_config: {
          type: goal,
          target_calories: data.calculatedMacros.calories,
          target_protein: data.calculatedMacros.protein,
          target_carbs: data.calculatedMacros.carbs,
          target_fats: data.calculatedMacros.fats,
        },
        personal_info: {
          height: h,
          weight: w,
          age: a,
          gender,
          activity_level: activityLevel,
        }
      };
      
      // Update both AsyncStorage and Zustand store
      await AsyncStorage.setItem('onboardingDone', 'true');
      useStore.setState({ user: updatedUser });
      
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const STEP_LABELS = ['Your Goal', 'Body Stats', 'Activity', 'Alerts'];
  const STEP_ICONS = [
    <Target color={theme.tint} size={24} />,
    <User color={theme.tint} size={24} />,
    <Activity color={theme.tint} size={24} />,
    <Bell color={theme.tint} size={24} />,
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {STEP_LABELS.map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              { backgroundColor: i <= step ? theme.tint : theme.border }
            ]}>
              <ThemedText style={{ color: i <= step ? '#fff' : theme.tabIconDefault, fontSize: 12 }}>
                {i + 1}
              </ThemedText>
            </View>
            <ThemedText style={{ color: i === step ? theme.text : theme.tabIconDefault, fontSize: 11, marginTop: 4 }}>
              {label}
            </ThemedText>
            {i < 3 && (
              <View style={[styles.progressLine, { backgroundColor: i < step ? theme.tint : theme.border }]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step 0: Goal */}
        {step === 0 && (
          <View>
            <View style={styles.stepHeader}>
              {STEP_ICONS[0]}
              <ThemedText type="title" style={styles.stepTitle}>What's your goal?</ThemedText>
              <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', marginTop: 8 }}>
                We'll calculate your personal calorie target using the Mifflin-St Jeor formula.
              </ThemedText>
            </View>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: goal === g.id ? theme.tint + '22' : theme.cardBackground,
                    borderColor: goal === g.id ? theme.tint : theme.border,
                  }
                ]}
                onPress={() => setGoal(g.id)}
              >
                <ThemedText style={{ fontSize: 32 }}>{g.emoji}</ThemedText>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>{g.label}</ThemedText>
                  <ThemedText style={{ color: theme.tabIconDefault, marginTop: 4 }}>{g.desc}</ThemedText>
                </View>
                <View style={[
                  styles.radio,
                  { borderColor: goal === g.id ? theme.tint : theme.border }
                ]}>
                  {goal === g.id && <View style={[styles.radioDot, { backgroundColor: theme.tint }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 1: Body Stats */}
        {step === 1 && (
          <View>
            <View style={styles.stepHeader}>
              {STEP_ICONS[1]}
              <ThemedText type="title" style={styles.stepTitle}>Body Stats</ThemedText>
              <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', marginTop: 8 }}>
                Used only to calculate your Personal TDEE. Never shared.
              </ThemedText>
            </View>

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>Gender</ThemedText>
            <View style={styles.pillRow}>
              {(['male', 'female', 'other'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.pill, { backgroundColor: gender === g ? theme.tint : theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => setGender(g)}
                >
                  <ThemedText style={{ color: gender === g ? '#fff' : theme.text, textTransform: 'capitalize' }}>
                    {g}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>Height (cm)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 175"
              placeholderTextColor={theme.tabIconDefault}
            />

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>Weight (kg)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 72"
              placeholderTextColor={theme.tabIconDefault}
            />

            <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>Age (years)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="e.g. 24"
              placeholderTextColor={theme.tabIconDefault}
            />
          </View>
        )}

        {/* Step 2: Activity Level */}
        {step === 2 && (
          <View>
            <View style={styles.stepHeader}>
              {STEP_ICONS[2]}
              <ThemedText type="title" style={styles.stepTitle}>Activity Level</ThemedText>
              <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', marginTop: 8 }}>
                How active are you on a typical week?
              </ThemedText>
            </View>
            {ACTIVITY_LEVELS.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: activityLevel === a.id ? theme.tint + '22' : theme.cardBackground,
                    borderColor: activityLevel === a.id ? theme.tint : theme.border,
                  }
                ]}
                onPress={() => setActivityLevel(a.id)}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>{a.label}</ThemedText>
                  <ThemedText style={{ color: theme.tabIconDefault, marginTop: 4 }}>{a.desc}</ThemedText>
                </View>
                <View style={[styles.radio, { borderColor: activityLevel === a.id ? theme.tint : theme.border }]}>
                  {activityLevel === a.id && <View style={[styles.radioDot, { backgroundColor: theme.tint }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3: Notifications */}
        {step === 3 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <View style={[styles.stepHeader, { marginBottom: 20 }]}>
              {STEP_ICONS[3]}
              <ThemedText type="title" style={styles.stepTitle}>Stay on Track!</ThemedText>
            </View>
            <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', fontSize: 16, marginBottom: 40 }}>
              Allow notifications so we can send you motivational reminders to log your meals and keep your streaks alive! 🔥
            </ThemedText>
            <TouchableOpacity 
              style={[styles.nextBtn, { backgroundColor: theme.tint, width: '100%', marginBottom: 12 }]}
              onPress={async () => {
                await Notifications.requestPermissionsAsync();
                handleFinish();
              }}
            >
              <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>Enable Notifications</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ padding: 16 }}
              onPress={handleFinish}
            >
              <ThemedText style={{ color: theme.tabIconDefault }}>Skip for now</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        {step > 0 && (
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: theme.border }]}
            onPress={() => setStep(s => s - 1)}
          >
            <ThemedText>← Back</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.tint, flex: step > 0 ? 1 : undefined, minWidth: 160 }]}
          onPress={() => {
            if (step < 3) setStep(s => s + 1);
            else handleFinish();
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={{ color: '#fff' }}>
              {step < 3 ? 'Continue →' : '🎯 Get My Plan'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 4,
  },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  progressLine: {
    position: 'absolute', top: 14, left: '50%',
    width: '100%', height: 2,
  },
  content: { padding: 24, paddingBottom: 40 },
  stepHeader: { alignItems: 'center', marginBottom: 32 },
  stepTitle: { marginTop: 12, fontSize: 26, textAlign: 'center' },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 20, borderWidth: 2, marginBottom: 16,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  fieldLabel: { marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    fontSize: 16, marginBottom: 4,
  },
  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  pill: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row', gap: 12, padding: 24,
    paddingBottom: 40, borderTopWidth: 0,
  },
  backBtn: {
    paddingVertical: 16, paddingHorizontal: 20,
    borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
});

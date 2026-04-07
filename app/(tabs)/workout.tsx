import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList, RefreshControl
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useStore } from '@/store';
import { 
  logWorkoutApi, getWorkoutHistoryApi, getTemplatesApi, setActiveTemplateApi, getLastSessionApi 
} from '@/services/api';
import { Plus, Trash2, Dumbbell, Clock, ChevronDown, ChevronUp, Trophy, Timer, Play } from 'lucide-react-native';
import RestTimer from '@/components/RestTimer';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import { useHaptics } from '@/hooks/useHaptics';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

const PRESET_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Shoulder Press',
  'Bicep Curl', 'Tricep Dips', 'Plank', 'Running', 'Cycling'
];

export default function WorkoutScreen() {
  const { theme } = useAppTheme();
  const { setWorkouts, workouts } = useStore();

  const [activeTab, setActiveTab] = useState<'logger' | 'templates'>('logger');
  
  const [workoutName, setWorkoutName] = useState('');
  const [category, setCategory] = useState<'strength' | 'cardio'>('strength');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: '', sets: '3', reps: '10', weight: '' }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Features state
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [prData, setPrData] = useState<any[]>([]);
  const [showPrModal, setShowPrModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    loadHistory();
    loadTemplates();
  }, []);

  const onRefresh = async () => {
    haptics.light();
    setRefreshing(true);
    if (activeTab === 'logger') {
      await loadHistory();
    } else {
      await loadTemplates();
    }
    setRefreshing(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await getWorkoutHistoryApi();
      setWorkouts(data);
    } catch (_) {}
    setHistoryLoading(false);
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const { data } = await getTemplatesApi();
      setTemplates(data);
    } catch (_) {}
    setTemplatesLoading(false);
  };

  const handleUseTemplate = async (templateId: string, template: any) => {
    try {
      await setActiveTemplateApi(templateId);
      setWorkoutName(template.name || '');
      setCategory(template.category || 'strength');
      if (template.exercises && template.exercises.length > 0) {
        setExercises(template.exercises.map((e: any) => ({
          name: e.name,
          sets: String(e.targetSets || 3),
          reps: String(e.targetReps || 10),
          weight: ''
        })));
      }
      setActiveTab('logger');
      haptics.success();
    } catch (err) {
      haptics.error();
      Alert.alert('Error', 'Could not apply template');
    }
  };

  const addExercise = () => {
    haptics.light();
    setExercises([...exercises, { name: '', sets: '3', reps: '10', weight: '' }]);
  };

  const removeExercise = (index: number) => {
    haptics.medium();
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const loadLastSession = async (exerciseName: string, index: number) => {
    if (!exerciseName) return;
    try {
      const { data } = await getLastSessionApi(exerciseName);
      if (data && data.weight) {
        updateExercise(index, 'weight', String(data.weight));
        updateExercise(index, 'sets', String(data.sets || 3));
        updateExercise(index, 'reps', String(data.reps || 10));
      }
    } catch (e) {
      // No last session
    }
  };

  const handleLog = async () => {
    if (!workoutName.trim() || !duration) {
      Alert.alert('Missing Info', 'Please enter a workout name and duration.');
      return;
    }
    setLoading(true);
    try {
      const res = await logWorkoutApi({
        name: workoutName,
        category,
        duration: parseInt(duration),
        exercises: exercises
          .filter(e => e.name.trim())
          .map(e => ({
            name: e.name,
            sets: parseInt(e.sets) || 0,
            reps: parseInt(e.reps) || 0,
            weight: parseFloat(e.weight) || 0,
          })),
        notes,
      });
      
      Alert.alert('✅ Logged!', `${workoutName} saved successfully.`);
      haptics.success();
      setWorkoutName('');
      setDuration('');
      setExercises([{ name: '', sets: '3', reps: '10', weight: '' }]);
      setNotes('');
      loadHistory();
      
      if (res.data?.prs && res.data.prs.length > 0) {
        setPrData(res.data.prs);
        setShowPrModal(true);
      }
    } catch (err: any) {
      haptics.error();
      Alert.alert('Error', err.response?.data?.message || 'Failed to log workout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topTabs}>
        <TouchableOpacity 
          style={[styles.topTab, activeTab === 'logger' && { borderBottomColor: theme.tint, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('logger')}
        >
          <ThemedText style={{ color: activeTab === 'logger' ? theme.tint : theme.tabIconDefault, fontWeight: 'bold' }}>Logger</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topTab, activeTab === 'templates' && { borderBottomColor: theme.tint, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('templates')}
        >
          <ThemedText style={{ color: activeTab === 'templates' ? theme.tint : theme.tabIconDefault, fontWeight: 'bold' }}>Templates</ThemedText>
        </TouchableOpacity>
      </View>

      {activeTab === 'templates' ? (
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
        >
          <ThemedText type="title" style={{ marginBottom: 16 }}>Workout Templates</ThemedText>
          {templatesLoading ? (
            <View style={{ gap: 16 }}>
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
            </View>
          ) : templates.length === 0 ? (
              <EmptyState 
                icon={<Dumbbell size={40} color={theme.tint} />}
                title="No templates yet"
                subtitle="Create your first template to get started."
              />
            ) : (
              templates.map((tpl: any) => (
                <View key={tpl._id} style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>{tpl.name}</ThemedText>
                  <ThemedText style={{ color: theme.tabIconDefault, marginTop: 4 }}>{tpl.description}</ThemedText>
                  <ThemedText style={{ color: theme.tint, marginTop: 8, fontSize: 13 }}>
                    {tpl.exercises?.length || 0} exercises • {tpl.duration || 45} mins
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: theme.tint }]}
                    onPress={() => handleUseTemplate(tpl._id, tpl)}
                  >
                    <Play color="#fff" size={16} />
                    <ThemedText style={{ color: '#fff', marginLeft: 6, fontWeight: 'bold' }}>Start</ThemedText>
                  </TouchableOpacity>
                </View>
              ))
          )}
        </ScrollView>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
        >
          <View style={styles.header}>
            <Dumbbell color={theme.tint} size={24} />
            <ThemedText type="title" style={{ marginLeft: 10, fontSize: 26 }}>Workout Logger</ThemedText>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setShowRestTimer(true)} style={[styles.addBtn, { backgroundColor: theme.tint + '33', width: 40, height: 40 }]}>
              <Timer color={theme.tint} size={22} />
            </TouchableOpacity>
          </View>

          {/* Workout Name & Category */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Workout Name</ThemedText>
            <TextInput
              placeholder="e.g. Push Day, Leg Day..."
              placeholderTextColor={theme.tabIconDefault}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={workoutName}
              onChangeText={setWorkoutName}
            />

            <ThemedText type="defaultSemiBold" style={[styles.label, { marginTop: 16 }]}>Category</ThemedText>
            <View style={styles.categoryRow}>
              {(['strength', 'cardio'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, {
                    backgroundColor: category === cat ? theme.tint : theme.background,
                    borderColor: theme.border,
                  }]}
                  onPress={() => setCategory(cat)}
                >
                  <ThemedText style={{ color: category === cat ? '#fff' : theme.text, textTransform: 'capitalize' }}>
                    {cat}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText type="defaultSemiBold" style={[styles.label, { marginTop: 16 }]}>Duration (minutes)</ThemedText>
            <TextInput
              placeholder="45"
              placeholderTextColor={theme.tabIconDefault}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>

          {/* Exercises */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Exercises</ThemedText>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.tint }]}
                onPress={addExercise}
              >
                <Plus color="#fff" size={18} />
              </TouchableOpacity>
            </View>

            {exercises.map((ex, i) => (
              <View key={i} style={[styles.exerciseRow, { borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Exercise name"
                    placeholderTextColor={theme.tabIconDefault}
                    style={[styles.inputSm, { color: theme.text, borderBottomColor: theme.border }]}
                    value={ex.name}
                    onChangeText={v => updateExercise(i, 'name', v)}
                    onBlur={() => loadLastSession(ex.name, i)}
                  />
                  <View style={styles.exerciseMeta}>
                    <View style={styles.metaField}>
                      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 11 }}>Sets</ThemedText>
                      <TextInput
                        style={[styles.metaInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        value={ex.sets}
                        onChangeText={v => updateExercise(i, 'sets', v)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.metaField}>
                      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 11 }}>Reps</ThemedText>
                      <TextInput
                        style={[styles.metaInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        value={ex.reps}
                        onChangeText={v => updateExercise(i, 'reps', v)}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.metaField}>
                      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 11 }}>Kg</ThemedText>
                      <TextInput
                        style={[styles.metaInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        value={ex.weight}
                        placeholder="0"
                        placeholderTextColor={theme.tabIconDefault}
                        onChangeText={v => updateExercise(i, 'weight', v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>
                {exercises.length > 1 && (
                  <TouchableOpacity onPress={() => removeExercise(i)} style={styles.deleteBtn}>
                    <Trash2 color={theme.accent3} size={18} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Preset quick-add */}
            <ThemedText style={{ color: theme.tabIconDefault, marginTop: 12, fontSize: 13 }}>Quick Add:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {PRESET_EXERCISES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => {
                    const last = exercises[exercises.length - 1];
                    if (!last.name) {
                      updateExercise(exercises.length - 1, 'name', p);
                      loadLastSession(p, exercises.length - 1);
                    }
                    else {
                      addExercise();
                      const nextI = exercises.length;
                      setTimeout(() => {
                         updateExercise(nextI, 'name', p);
                         loadLastSession(p, nextI);
                      }, 0);
                    }
                  }}
                >
                  <ThemedText style={{ fontSize: 12 }}>{p}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Notes */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.label}>Notes (optional)</ThemedText>
            <TextInput
              placeholder="How did it feel?"
              placeholderTextColor={theme.tabIconDefault}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Log Button */}
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: theme.tint }]}
            onPress={handleLog}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Dumbbell color="#fff" size={20} />
                <ThemedText type="defaultSemiBold" style={{ color: '#fff', marginLeft: 8 }}>Log Workout</ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* Recent History */}
          <TouchableOpacity
            style={[styles.historyHeader, { borderColor: theme.border }]}
            onPress={() => setShowHistory(!showHistory)}
          >
            <ThemedText type="subtitle">Recent Workouts</ThemedText>
            {showHistory ? <ChevronUp color={theme.text} size={20} /> : <ChevronDown color={theme.text} size={20} />}
          </TouchableOpacity>

          {showHistory && (
            historyLoading ? (
              <View style={{ marginTop: 16, gap: 10 }}>
                <SkeletonLoader type="list-item" />
                <SkeletonLoader type="list-item" />
              </View>
            ) : workouts.length === 0 ? (
              <EmptyState 
                icon={<Timer size={40} color={theme.tabIconDefault} />}
                title="No workouts yet"
                subtitle="Log your first one! 💪"
              />
            ) : (
              workouts.slice(0, 8).map((w: any, i: number) => (
                <View key={i} style={[styles.historyCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold">{w.name}</ThemedText>
                    <ThemedText style={{ color: theme.tabIconDefault, fontSize: 13, marginTop: 2 }}>
                      {new Date(w.date).toLocaleDateString()} • {w.exercises?.length || 0} exercises
                    </ThemedText>
                  </View>
                  <View style={[styles.durationBadge, { backgroundColor: theme.tint + '22' }]}>
                    <Clock color={theme.tint} size={14} />
                    <ThemedText style={{ color: theme.tint, fontSize: 13, marginLeft: 4 }}>{w.duration}m</ThemedText>
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}

      {showRestTimer && (
        <View style={styles.floatingTimer}>
          <RestTimer onDismiss={() => setShowRestTimer(false)} initialSeconds={90} />
        </View>
      )}

      {/* PR Modal */}
      <Modal visible={showPrModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.cardBackground, borderColor: theme.tint }]}>
            <Trophy color="#FFD700" size={48} style={{ marginBottom: 16 }} />
            <ThemedText type="title" style={{ marginBottom: 16, textAlign: 'center' }}>New Personal Records!</ThemedText>
            {prData.map((pr: any, i: number) => (
              <View key={i} style={styles.prRow}>
                <ThemedText type="defaultSemiBold">{pr.exerciseName}</ThemedText>
                <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>{pr.newWeight} kg</ThemedText>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: theme.tint, marginTop: 24, width: '100%', marginBottom: 0 }]}
              onPress={() => setShowPrModal(false)}
            >
              <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Awesome!</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topTabs: { flexDirection: 'row', paddingTop: 60, paddingHorizontal: 20 },
  topTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  content: { padding: 20, paddingTop: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 16 },
  label: { marginBottom: 8, fontSize: 14 },
  input: {
    borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15,
  },
  categoryRow: { flexDirection: 'row', gap: 12 },
  categoryBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  exerciseRow: { borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  inputSm: { fontSize: 15, paddingBottom: 6, borderBottomWidth: 1, marginBottom: 8 },
  exerciseMeta: { flexDirection: 'row', gap: 12 },
  metaField: { alignItems: 'center' },
  metaInput: { borderWidth: 1, borderRadius: 8, padding: 6, width: 52, textAlign: 'center', fontSize: 14 },
  deleteBtn: { padding: 8, marginLeft: 8, marginTop: 4 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  logBtn: {
    height: 56, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderTopWidth: 1, marginBottom: 12,
  },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1, marginBottom: 10,
  },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  playBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginTop: 12, alignSelf: 'flex-start' },
  floatingTimer: { position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 100 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 24, borderRadius: 24, alignItems: 'center', borderWidth: 2 },
  prRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff22' },
});

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayLogApi, logFoodApi, getProfileApi, getCoachInsightApi, getStreaksApi, logWaterApi } from '@/services/api';

interface MacroTotals { calories: number; protein: number; carbs: number; fats: number; }

interface UserState {
  user: any;
  token: string | null;
  appTheme: 'light' | 'dark' | 'system';
  setUser: (user: any, token?: string) => void;
  logout: () => void;
  toggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  loadToken: () => Promise<void>;

  dailyGoal: MacroTotals;
  setDailyGoal: (goal: MacroTotals) => void;
  consumed: MacroTotals;
  addConsumed: (macros: MacroTotals & { mealType?: string }) => Promise<void>;
  waterMl: number;
  addWaterMl: (amount: number) => Promise<void>;
  fetchTodayLog: () => Promise<void>;

  workouts: any[];
  setWorkouts: (workouts: any[]) => void;

  streaks: { loggingStreak: number; workoutStreak: number; longestLoggingStreak: number } | null;
  fetchStreaks: () => Promise<void>;

  coachInsight: { text: string; timestamp: number } | null;
  fetchCoachInsight: (force?: boolean) => Promise<void>;
}

export const useStore = create<UserState>((set, get) => ({
  user: null,
  token: null,
  appTheme: 'system',

  setUser: (user, token) => {
    if (token) AsyncStorage.setItem('token', token);
    // Set goal from user profile if available
    const goal = user?.goal_config;
    if (goal?.target_calories) {
      set({
        user,
        token: token || get().token,
        dailyGoal: {
          calories: goal.target_calories,
          protein: goal.target_protein || 140,
          carbs: goal.target_carbs || 250,
          fats: goal.target_fats || 70,
        }
      });
    } else {
      set({ user, token: token || get().token });
    }
  },

  logout: () => {
    AsyncStorage.removeItem('token');
    set({
      user: null, token: null,
      consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 }
    });
  },
  toggleTheme: (theme) => set({ appTheme: theme }),
  hapticsEnabled: true,
  setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

  // On app start: restore token and re-fetch profile
  loadToken: async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    set({ token });
    try {
      const { data: profile } = await getProfileApi();
      get().setUser(profile, undefined);
    } catch (_) {}
  },

  dailyGoal: { calories: 2200, protein: 140, carbs: 250, fats: 70 },
  setDailyGoal: (dailyGoal) => set({ dailyGoal }),

  consumed: { calories: 0, protein: 0, carbs: 0, fats: 0 },
  addConsumed: async (macros) => {
    // Optimistic update
    set((state) => ({
      consumed: {
        calories: state.consumed.calories + macros.calories,
        protein: state.consumed.protein + macros.protein,
        carbs: state.consumed.carbs + macros.carbs,
        fats: state.consumed.fats + macros.fats,
      }
    }));
    try {
      await logFoodApi({
        name: 'custom',
        ...macros,
        mealType: macros.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other' | undefined,
      });
    } catch (_) {}
  },

  waterMl: 0,
  addWaterMl: async (amount) => {
    set((state) => ({ waterMl: state.waterMl + amount }));
    try { await logWaterApi(amount); } catch (_) {}
  },

  fetchTodayLog: async () => {
    try {
      const { data } = await getTodayLogApi();
      if (data?.totals) set({ consumed: data.totals });
      if (data?.waterMl !== undefined) set({ waterMl: data.waterMl });
    } catch (_) {}
  },

  workouts: [],
  setWorkouts: (workouts) => set({ workouts }),

  streaks: null,
  fetchStreaks: async () => {
    try {
      const { data } = await getStreaksApi();
      set({ streaks: data });
    } catch (_) {}
  },

  coachInsight: null,
  fetchCoachInsight: async (force = false) => {
    const current = get().coachInsight;
    const now = Date.now();
    // Cache for 30 minutes unless forced
    if (!force && current && (now - current.timestamp < 30 * 60 * 1000)) {
      return;
    }
    
    // Optimistic / clear state slightly if forced to show shimmer
    if (force) {
      set({ coachInsight: null });
    }

    try {
      const { data } = await getCoachInsightApi();
      if (data?.insight) {
        set({ coachInsight: { text: data.insight, timestamp: Date.now() } });
      }
    } catch (_) {}
  }
}));

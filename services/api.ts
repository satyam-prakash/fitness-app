import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginApi = (email: string, password: string) =>
  api.post('/users/login', { email, password });

export const signupApi = (name: string, email: string, password: string) =>
  api.post('/users/signup', { name, email, password });

export const getProfileApi = () => api.get('/users/profile');

// FIX 1: TDEE-based goal setup
export const saveGoalApi = (payload: {
  goalType: 'loss' | 'maintenance' | 'gain';
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
}) => api.put('/users/goal', payload);

// ─── Diet ─────────────────────────────────────────────────────────────────────
export const searchFoodsApi = (q: string, category?: string) =>
  api.get('/diet/foods/search', { params: { q, ...(category && { category }) } });

export const logFoodApi = (item: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
}) => api.post('/diet/log', item);

export const deleteFoodLogApi = (logItemId: string) =>
  api.delete(`/diet/log/${logItemId}`);

export const logWaterApi = (amount: number) => api.patch('/diet/water', { amount });

export const getTodayLogApi = () => api.get('/diet/today');

export const getWeeklyDietApi = (days: number = 7) => api.get(`/diet/analytics/weekly?days=${days}`);

// FEATURE 3: Recent foods
export const getRecentFoodsApi = () => api.get('/diet/recent');

// FEATURE 4: Recipes
export const createRecipeApi = (recipe: {
  name: string;
  ingredients: Array<{
    foodId: string;
    foodName: string;
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
  servings?: number;
}) => api.post('/diet/recipes', recipe);

export const getRecipesApi = () => api.get('/diet/recipes');

export const searchAllFoodsApi = (q: string) =>
  api.get('/diet/search-all', { params: { q } });

// ─── Workouts ─────────────────────────────────────────────────────────────────
export const logWorkoutApi = (workout: {
  name: string;
  category: 'strength' | 'cardio';
  duration: number;
  exercises: Array<{ name: string; sets?: number; reps?: number; weight?: number }>;
  notes?: string;
}) => api.post('/workouts/log', workout);

export const getWorkoutHistoryApi = () => api.get('/workouts/history');

export const getWeeklyWorkoutsApi = (days: number = 7) => api.get(`/workouts/analytics/weekly?days=${days}`);

// NEW ANALYTICS ENDPOINTS
export const logBodyWeightApi = (weight: number) => api.post('/analytics/body/log', { weight, unit: 'kg' });
export const getBodyHistoryApi = (days: number = 90) => api.get(`/analytics/body/history?days=${days}`);
export const getCorrelationApi = () => api.get('/analytics/correlation');
export const getMuscleGroupsApi = (days: number = 7) => api.get(`/analytics/muscle-groups?days=${days}`);
export const getDietByMealApi = (days: number = 7) => api.get(`/analytics/diet/by-meal?days=${days}`);

// FEATURE 2: Progressive Overload Engine
export const getLastSessionApi = (exerciseName: string) => 
  api.get(`/workouts/last-session/${encodeURIComponent(exerciseName)}`);

// FEATURE 4: Workout plan templates
export const getTemplatesApi = () => api.get('/workouts/templates');
export const setActiveTemplateApi = (templateId: string, startDate?: string) => 
  api.post('/users/active-template', { templateId, startDate });

// FEATURE 5: ExerciseDB API
export const fetchExercises = async (muscle?: string) => {
  const url = muscle 
    ? `https://exercisedb.p.rapidapi.com/exercises/target/${muscle}` 
    : 'https://exercisedb.p.rapidapi.com/exercises';
    
  try {
    const response = await axios.get(url, {
      headers: {
        'X-RapidAPI-Key': 'd861ebd29amsh23e7422f254fdcbp10526djsnad30f40fb176', // MOCKED OR REPLACE WITH ENV
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      },
      params: { limit: '50' }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    // return mock fallback list
    return [
      { name: 'Bench Press', target: 'pectorals', equipment: 'barbell', gifUrl: '' },
      { name: 'Squat', target: 'quads', equipment: 'barbell', gifUrl: '' },
      { name: 'Deadlift', target: 'glutes', equipment: 'barbell', gifUrl: '' },
      { name: 'Pull Up', target: 'lats', equipment: 'body weight', gifUrl: '' },
      { name: 'Overhead Press', target: 'delts', equipment: 'barbell', gifUrl: '' }
    ];
  }
};

// ─── AI Coach & Streaks ────────────────────────────────────────────────────────
export const getCoachInsightApi = () => api.post('/coach/insight');
export const getStreaksApi = () => api.get('/streaks');
export const getWeeklySummaryApi = () => api.get('/analytics/weekly-summary');

export default api;


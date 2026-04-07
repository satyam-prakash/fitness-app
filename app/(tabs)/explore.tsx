import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Plus, Search, Trash2, Camera, X } from 'lucide-react-native';
import { useStore } from '@/store';
import { 
  deleteFoodLogApi, 
  getTodayLogApi, 
  searchAllFoodsApi,
  getRecentFoodsApi 
} from '@/services/api';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
// import { BarCodeScanner } from 'expo-barcode-scanner'; // Temporarily disabled for build
import axios from 'axios';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import { useHaptics } from '@/hooks/useHaptics';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_SLOTS: { id: MealType; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙' },
  { id: 'snack', label: 'Snack', emoji: '🍎' },
];

export default function DietScreen() {
  const { theme } = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [todayItems, setTodayItems] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentFoods, setRecentFoods] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedFood, setScannedFood] = useState<any>(null);
  const [showFoodConfirm, setShowFoodConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addConsumed } = useStore();
  const haptics = useHaptics();

  useEffect(() => {
    loadTodayLog();
    loadRecentFoods();
    requestCameraPermission();
  }, []);

  useEffect(() => {
    if (search.length > 1) {
      searchFoods();
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const requestCameraPermission = async () => {
    // const { status } = await BarCodeScanner.requestPermissionsAsync();
    // setHasPermission(status === 'granted');
    setHasPermission(false); // Temporarily disabled
  };

  const loadTodayLog = async () => {
    try {
      const { data } = await getTodayLogApi();
      setTodayItems(data?.consumed_items || []);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    haptics.light();
    setRefreshing(true);
    setLoading(true);
    loadTodayLog();
    loadRecentFoods();
  };

  // FEATURE 3: Load recent foods
  const loadRecentFoods = async () => {
    try {
      const { data } = await getRecentFoodsApi();
      setRecentFoods(data || []);
    } catch (_) {}
  };

  // FEATURE 1: Search with 200+ database + recipes
  const searchFoods = async () => {
    try {
      const { data } = await searchAllFoodsApi(search);
      setSearchResults(data || []);
    } catch (_) {
      setSearchResults([]);
    }
  };

  const handleAdd = (food: any) => {
    haptics.light();
    addConsumed({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      mealType: selectedMeal,
    } as any);
    setTimeout(() => {
      loadTodayLog();
      loadRecentFoods(); // Refresh recent foods
      haptics.success();
    }, 500);
  };

  const handleDelete = async (itemId: string, item: any, skipConfirm = false) => {
    const performDelete = async () => {
      setTodayItems(prev => prev.filter((i: any) => i._id !== itemId));
      try {
        await deleteFoodLogApi(itemId);
        loadTodayLog();
      } catch (_) {
        loadTodayLog();
      }
    };

    if (skipConfirm) {
      performDelete();
    } else {
      haptics.medium();
      Alert.alert(
        'Remove Item',
        `Remove ${item.name} from your log?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const renderRightActions = (itemId: string, item: any) => (
    <TouchableOpacity
      style={styles.swipeDeleteBtn}
      onPress={() => handleDelete(itemId, item, true)}
    >
      <Trash2 color="#fff" size={22} />
      <ThemedText style={{ color: '#fff', fontWeight: '600', marginTop: 4 }}>Delete</ThemedText>
    </TouchableOpacity>
  );

  // FEATURE 2: Barcode scanner
  const handleBarCodeScanned = async ({ type, data }: any) => {
    setShowScanner(false);
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`
      );
      
      if (response.data.status === 1) {
        const product = response.data.product;
        const nutrients = product.nutriments;
        
        const foodData = {
          name: product.product_name || 'Scanned Product',
          calories: Math.round(nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0),
          protein: Math.round(nutrients.proteins_100g || nutrients.proteins || 0),
          carbs: Math.round(nutrients.carbohydrates_100g || nutrients.carbohydrates || 0),
          fats: Math.round(nutrients.fat_100g || nutrients.fat || 0),
          servingSize: 100,
          servingUnit: 'g',
        };

        setScannedFood(foodData);
        setShowFoodConfirm(true);
      } else {
        Alert.alert('Not Found', 'This product is not in our database.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not fetch product information.');
    }
  };

  const handleAddScannedFood = () => {
    if (scannedFood) {
      handleAdd(scannedFood);
      setShowFoodConfirm(false);
      setScannedFood(null);
    }
  };

  const itemsByMeal = todayItems.filter((i: any) => i.mealType === selectedMeal);
  const displayFoods = search ? searchResults : [];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
      >
        <View style={styles.header}>
          <ThemedText type="title">Diet Logger</ThemedText>
        </View>

        {/* Meal Slot Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealRow} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
          {MEAL_SLOTS.map(slot => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.mealPill,
                {
                  backgroundColor: selectedMeal === slot.id ? theme.tint : theme.cardBackground,
                  borderColor: selectedMeal === slot.id ? theme.tint : theme.border,
                }
              ]}
              onPress={() => {
                haptics.selection();
                setSelectedMeal(slot.id);
              }}
            >
              <ThemedText style={{ fontSize: 16 }}>{slot.emoji}</ThemedText>
              <ThemedText style={{ color: selectedMeal === slot.id ? '#fff' : theme.text, marginLeft: 6, fontSize: 14 }}>
                {slot.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's log with swipe-to-delete */}
        {loading ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 8, gap: 10 }}>
            <SkeletonLoader type="list-item" />
            <SkeletonLoader type="list-item" />
            <SkeletonLoader type="list-item" />
          </View>
        ) : itemsByMeal.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
            <ThemedText style={{ color: theme.tabIconDefault, fontSize: 13, marginBottom: 6 }}>
              Logged today — swipe left to delete
            </ThemedText>
            {itemsByMeal.map((item: any) => (
              <Swipeable
                key={item._id}
                renderRightActions={() => renderRightActions(item._id, item)}
                overshootRight={false}
                friction={2}
                rightThreshold={40}
              >
                <View style={[styles.loggedItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                    <ThemedText style={{ color: theme.tabIconDefault, fontSize: 12 }}>
                      {Math.round(item.calories)} kcal • {Math.round(item.protein)}g P
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item._id, item)} style={styles.deleteBtn}>
                    <Trash2 color={theme.accent3 || '#ef4444'} size={18} />
                  </TouchableOpacity>
                </View>
              </Swipeable>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState 
              icon={<Plus size={40} color={theme.tint} />}
              title="Nothing logged yet"
              subtitle={`Tap + to add your first ${selectedMeal}`}
            />
          </View>
        )}

        {/* Search Bar with Camera Button */}
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Search color={theme.tabIconDefault} size={20} />
          <TextInput
            placeholder={`Add to ${selectedMeal}...`}
            placeholderTextColor={theme.tabIconDefault}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
          />
          {/* FEATURE 2: Barcode Scanner Button - Temporarily Disabled */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Coming Soon', 'Barcode scanner will be available in a future update!');
            }}
            style={styles.cameraBtn}
          >
            <Camera color={theme.tabIconDefault} size={22} />
          </TouchableOpacity>
        </View>

        {/* FEATURE 3: Recent Foods */}
        {!search && recentFoods.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <ThemedText style={{ color: theme.tabIconDefault, fontSize: 13, marginBottom: 8 }}>
              Quick Add (Recent)
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {recentFoods.map((food, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.recentChip, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => handleAdd(food)}
                >
                  <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>{food.name}</ThemedText>
                  <ThemedText style={{ color: theme.tabIconDefault, fontSize: 11 }}>
                    {food.calories} kcal
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView style={styles.list}>
          {search && (
            <>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Search Results
              </ThemedText>
              {displayFoods.length === 0 && (
                <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', marginTop: 20 }}>
                  No foods found. Try a different search.
                </ThemedText>
              )}
              {displayFoods.map((food: any, idx) => (
                <View key={idx} style={[styles.foodCard, { backgroundColor: theme.cardBackground, shadowColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
                      {food.name}
                      {food.isRecipe && <ThemedText style={{ color: theme.accent1 }}> (Recipe)</ThemedText>}
                    </ThemedText>
                    <ThemedText style={{ color: theme.tabIconDefault, fontSize: 13, marginTop: 4 }}>
                      {food.calories} kcal • {food.protein}g P • {food.carbs}g C • {food.fats}g F
                    </ThemedText>
                    {food.category && (
                      <ThemedText style={{ color: theme.tabIconDefault, fontSize: 11, marginTop: 2 }}>
                        {food.category}
                      </ThemedText>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.tint }]}
                    onPress={() => handleAdd(food)}
                  >
                    <Plus color="#fff" size={20} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {/* FEATURE 2: Barcode Scanner Modal - Temporarily Disabled */}
        {/* {showScanner && (
          <Modal visible={showScanner} animationType="slide">
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <BarCodeScanner
                onBarCodeScanned={handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
              />
              <TouchableOpacity
                style={styles.closeScanner}
                onPress={() => setShowScanner(false)}
              >
                <X color="#fff" size={32} />
              </TouchableOpacity>
              <View style={styles.scannerOverlay}>
                <ThemedText style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>
                  Point camera at barcode
                </ThemedText>
              </View>
            </View>
          </Modal>
        )} */}

        {/* FEATURE 2: Scanned Food Confirmation */}
        {showFoodConfirm && scannedFood && (
          <Modal visible={showFoodConfirm} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.confirmCard, { backgroundColor: theme.cardBackground }]}>
                <ThemedText type="title" style={{ marginBottom: 16 }}>Add This Food?</ThemedText>
                <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 8 }}>
                  {scannedFood.name}
                </ThemedText>
                <ThemedText style={{ color: theme.tabIconDefault, marginBottom: 16 }}>
                  {scannedFood.calories} kcal • {scannedFood.protein}g P • {scannedFood.carbs}g C • {scannedFood.fats}g F
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { borderColor: theme.border, borderWidth: 1, flex: 1 }]}
                    onPress={() => {
                      setShowFoodConfirm(false);
                      setScannedFood(null);
                    }}
                  >
                    <ThemedText>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: theme.tint, flex: 1 }]}
                    onPress={handleAddScannedFood}
                  >
                    <ThemedText style={{ color: '#fff' }}>Add to {selectedMeal}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  mealRow: { marginBottom: 16 },
  mealPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1.5,
  },
  loggedItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  deleteBtn: { padding: 8 },
  swipeDeleteBtn: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, paddingHorizontal: 16,
    height: 50, borderRadius: 25, borderWidth: 1, marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  cameraBtn: { padding: 8 },
  recentChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1,
    minWidth: 100,
  },
  list: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { marginBottom: 16 },
  foodCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 12,
    elevation: 2, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  addButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: 16,
  },
  closeScanner: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    padding: 24,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});

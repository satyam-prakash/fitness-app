import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Plus, Search, Trash2, Save, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { searchAllFoodsApi, createRecipeApi } from '@/services/api';

type Ingredient = {
  foodId?: string;
  foodName: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export default function RecipeBuilderScreen() {
  const { theme } = useAppTheme();
  const [recipeName, setRecipeName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [quantities, setQuantities] = useState<{ [key: number]: string }>({});

  const searchFoods = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await searchAllFoodsApi(query);
      setSearchResults(data || []);
    } catch (_) {
      setSearchResults([]);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    searchFoods(text);
  };

  const addIngredient = (food: any) => {
    const newIngredient: Ingredient = {
      foodId: food._id,
      foodName: food.name,
      quantity: 100, // default 100g
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    };
    setIngredients([...ingredients, newIngredient]);
    setQuantities({ ...quantities, [ingredients.length]: '100' });
    setSearch('');
    setSearchResults([]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    const newQuantities = { ...quantities };
    delete newQuantities[index];
    setQuantities(newQuantities);
  };

  const updateQuantity = (index: number, value: string) => {
    const numValue = parseFloat(value) || 100;
    const newQuantities = { ...quantities, [index]: value };
    setQuantities(newQuantities);
    
    // Update ingredient with proportional macros
    const ingredient = ingredients[index];
    const ratio = numValue / 100;
    const updated = [...ingredients];
    updated[index] = {
      ...ingredient,
      quantity: numValue,
    };
    setIngredients(updated);
  };

  const calculateTotals = () => {
    const totals = ingredients.reduce(
      (acc, ing) => {
        const ratio = ing.quantity / 100;
        return {
          calories: acc.calories + ing.calories * ratio,
          protein: acc.protein + ing.protein * ratio,
          carbs: acc.carbs + ing.carbs * ratio,
          fats: acc.fats + ing.fats * ratio,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fats: Math.round(totals.fats),
    };
  };

  const handleSave = async () => {
    if (!recipeName.trim()) {
      Alert.alert('Error', 'Please enter a recipe name.');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient.');
      return;
    }

    try {
      const ingredientsData = ingredients.map(ing => ({
        foodId: ing.foodId || '',
        foodName: ing.foodName,
        quantity: ing.quantity,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fats: ing.fats,
      }));

      await createRecipeApi({
        name: recipeName,
        ingredients: ingredientsData,
        servings: 1,
      });

      Alert.alert('Success', 'Recipe saved! You can now search for it in the Diet screen.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not save recipe. Please try again.');
    }
  };

  const totals = calculateTotals();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <ThemedText type="title">Recipe Builder</ThemedText>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Save color={theme.tint} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Recipe Name */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recipe Name</ThemedText>
          <TextInput
            placeholder="e.g., My Protein Bowl"
            placeholderTextColor={theme.tabIconDefault}
            style={[styles.input, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
            value={recipeName}
            onChangeText={setRecipeName}
          />
        </View>

        {/* Total Macros Summary */}
        {ingredients.length > 0 && (
          <View style={[styles.totalsCard, { backgroundColor: theme.tint + '20', borderColor: theme.tint }]}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, marginBottom: 8 }}>
              Total Macros
            </ThemedText>
            <ThemedText style={{ fontSize: 14 }}>
              {totals.calories} kcal • {totals.protein}g P • {totals.carbs}g C • {totals.fats}g F
            </ThemedText>
          </View>
        )}

        {/* Ingredients List */}
        {ingredients.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredients ({ingredients.length})</ThemedText>
            {ingredients.map((ing, idx) => (
              <View key={idx} style={[styles.ingredientCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="defaultSemiBold">{ing.foodName}</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <TextInput
                      placeholder="100"
                      placeholderTextColor={theme.tabIconDefault}
                      style={[styles.quantityInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                      value={quantities[idx]}
                      onChangeText={(val) => updateQuantity(idx, val)}
                      keyboardType="numeric"
                    />
                    <ThemedText style={{ marginLeft: 8, color: theme.tabIconDefault, fontSize: 13 }}>grams</ThemedText>
                  </View>
                  <ThemedText style={{ color: theme.tabIconDefault, fontSize: 12, marginTop: 4 }}>
                    {Math.round(ing.calories * (ing.quantity / 100))} kcal • 
                    {Math.round(ing.protein * (ing.quantity / 100))}g P
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(idx)} style={styles.removeBtn}>
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Search to Add Ingredients */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Add Ingredient</ThemedText>
          <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Search color={theme.tabIconDefault} size={20} />
            <TextInput
              placeholder="Search foods..."
              placeholderTextColor={theme.tabIconDefault}
              style={[styles.searchInput, { color: theme.text }]}
              value={search}
              onChangeText={handleSearchChange}
            />
          </View>

          {search && searchResults.length === 0 && (
            <ThemedText style={{ color: theme.tabIconDefault, textAlign: 'center', marginTop: 20 }}>
              No foods found. Try a different search.
            </ThemedText>
          )}

          {searchResults.map((food, idx) => (
            <View key={idx} style={[styles.foodCard, { backgroundColor: theme.cardBackground, shadowColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">{food.name}</ThemedText>
                <ThemedText style={{ color: theme.tabIconDefault, fontSize: 12, marginTop: 2 }}>
                  {food.calories} kcal • {food.protein}g P (per 100g)
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.tint }]}
                onPress={() => addIngredient(food)}
              >
                <Plus color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backBtn: { padding: 8 },
  saveBtn: { padding: 8 },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  totalsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  quantityInput: {
    width: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  removeBtn: { padding: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

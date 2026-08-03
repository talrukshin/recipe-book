import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadRecipes, saveRecipes, loadCategories, saveCategories, makeId } from "../lib/storage.js";

const RecipesContext = createContext(null);

export function RecipesProvider({ children }) {
  const [recipes, setRecipes] = useState(() => loadRecipes());
  const [categories, setCategories] = useState(() => loadCategories());

  useEffect(() => {
    saveRecipes(recipes);
  }, [recipes]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  const api = useMemo(
    () => ({
      recipes,
      categories,

      addRecipe(data) {
        const recipe = {
          id: makeId(),
          title: "",
          image: "",
          time: "",
          servings: "",
          ingredients: [],
          steps: [],
          notes: "",
          source: "",
          sourceUrl: "",
          category: categories[0] || "אחר",
          favorite: false,
          createdAt: Date.now(),
          ...data,
        };
        setRecipes((prev) => [recipe, ...prev]);
        return recipe;
      },

      updateRecipe(id, patch) {
        setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      },

      deleteRecipe(id) {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
      },

      toggleFavorite(id) {
        setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)));
      },

      addCategory(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      },

      renameCategory(oldName, newName) {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName) return;
        setCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)));
        setRecipes((prev) => prev.map((r) => (r.category === oldName ? { ...r, category: trimmed } : r)));
      },

      deleteCategory(name) {
        setCategories((prev) => prev.filter((c) => c !== name));
        setRecipes((prev) => prev.map((r) => (r.category === name ? { ...r, category: "אחר" } : r)));
      },
    }),
    [recipes, categories]
  );

  return <RecipesContext.Provider value={api}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error("useRecipes must be used within RecipesProvider");
  return ctx;
}

import { useMemo, useState, useEffect } from "react";
import { RecipesProvider, useRecipes } from "./context/RecipesContext.jsx";
import Header from "./components/Header.jsx";
import SearchBar from "./components/SearchBar.jsx";
import CategoryTabs from "./components/CategoryTabs.jsx";
import CategoryManager from "./components/CategoryManager.jsx";
import RecipeGrid from "./components/RecipeGrid.jsx";
import RecipeDetail from "./components/RecipeDetail.jsx";
import RecipeForm from "./components/RecipeForm.jsx";
import "./App.css";

function AppShell() {
  const { recipes, categories, addRecipe, updateRecipe, deleteRecipe, toggleFavorite, addCategory, renameCategory, deleteCategory } =
    useRecipes();

  const [view, setView] = useState({ name: "grid" });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (favoritesOnly && !r.favorite) return false;
      if (!query) return true;
      const haystack = [r.title, ...(r.ingredients || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [recipes, search, activeCategory, favoritesOnly]);

  const selectedRecipe = view.name === "detail" || view.name === "edit" ? recipes.find((r) => r.id === view.id) : null;

  function goHome() {
    setView({ name: "grid" });
  }

  function openRecipe(id) {
    setView({ name: "detail", id });
  }

  function startAdd() {
    setView({ name: "add" });
  }

  function startEdit(id) {
    setView({ name: "edit", id });
  }

  function handleSaveNew(data) {
    addRecipe(data);
    setToast("✓ נוסף לספר");
    goHome();
  }

  function handleSaveEdit(data) {
    if (selectedRecipe) updateRecipe(selectedRecipe.id, data);
    openRecipe(selectedRecipe.id);
  }

  function handleDelete(id) {
    deleteRecipe(id);
    goHome();
  }

  return (
    <>
      <Header onHome={goHome} onAdd={startAdd} />

      <main className="app-main">
        {view.name === "grid" && (
          <div className="app-main__inner">
            <div className="toolbar">
              <SearchBar value={search} onChange={setSearch} />
              <button
                type="button"
                className={`fav-filter${favoritesOnly ? " fav-filter--on" : ""}`}
                onClick={() => setFavoritesOnly((v) => !v)}
                aria-pressed={favoritesOnly}
              >
                ♥ רק מועדפים
              </button>
            </div>
            <CategoryTabs
              categories={categories}
              active={activeCategory}
              onSelect={setActiveCategory}
              onManage={() => setShowCategoryManager(true)}
            />
            <RecipeGrid
              recipes={filteredRecipes}
              onOpen={openRecipe}
              onToggleFavorite={toggleFavorite}
              emptyMessage={
                recipes.length
                  ? "לא נמצאו מתכונים תואמים. נסו לשנות את החיפוש או הסינון."
                  : "עוד לא נוספו מתכונים לספר. לחצו על “מתכון חדש” כדי להתחיל!"
              }
            />
          </div>
        )}

        {view.name === "detail" && selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onBack={goHome}
            onEdit={startEdit}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {view.name === "add" && (
          <RecipeForm mode="add" categories={categories} onSave={handleSaveNew} onCancel={goHome} />
        )}

        {view.name === "edit" && selectedRecipe && (
          <RecipeForm
            mode="edit"
            initialRecipe={selectedRecipe}
            categories={categories}
            onSave={handleSaveEdit}
            onCancel={() => openRecipe(selectedRecipe.id)}
          />
        )}
      </main>

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span className="stamp stamp-pop toast__stamp">{toast}</span>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <RecipesProvider>
      <AppShell />
    </RecipesProvider>
  );
}

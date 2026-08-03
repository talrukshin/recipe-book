import RecipeCard from "./RecipeCard.jsx";
import EmptyState from "./EmptyState.jsx";
import "./RecipeGrid.css";

export default function RecipeGrid({ recipes, onOpen, onToggleFavorite, emptyMessage }) {
  if (!recipes.length) {
    return <EmptyState message={emptyMessage} />;
  }
  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}

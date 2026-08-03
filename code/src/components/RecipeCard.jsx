import "./RecipeCard.css";

export default function RecipeCard({ recipe, onOpen, onToggleFavorite }) {
  return (
    <article className="recipe-card torn-edge">
      <button
        type="button"
        className="recipe-card__fav"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(recipe.id);
        }}
        aria-pressed={recipe.favorite}
        aria-label={recipe.favorite ? "הסר ממועדפים" : "הוסף למועדפים"}
      >
        <span className={`stamp recipe-card__stamp${recipe.favorite ? " recipe-card__stamp--on" : ""}`}>♥</span>
      </button>

      <button type="button" className="recipe-card__body" onClick={() => onOpen(recipe.id)}>
        <div className="recipe-card__image-wrap">
          {recipe.image ? (
            <img src={recipe.image} alt="" className="recipe-card__image" />
          ) : (
            <div className="recipe-card__placeholder" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                <path
                  d="M14 6c0 6-4 8-4 14a10 10 0 0 0 20 0c0-6-4-8-4-14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M24 6v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="recipe-card__content">
          <span className="recipe-card__category">{recipe.category}</span>
          <h3 className="recipe-card__title">{recipe.title || "מתכון ללא שם"}</h3>
          <div className="recipe-card__meta">
            {recipe.time && <span>⏱ {recipe.time}</span>}
            {recipe.servings && <span>🍽 {recipe.servings}</span>}
          </div>
        </div>
      </button>
    </article>
  );
}

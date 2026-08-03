import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";
import "./RecipeDetail.css";

function toggleInSet(set, index) {
  const next = new Set(set);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
}

export default function RecipeDetail({ recipe, onBack, onEdit, onDelete, onToggleFavorite }) {
  const [confirming, setConfirming] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState(() => new Set());

  return (
    <div className="recipe-detail">
      <div className="recipe-detail__toolbar">
        <button type="button" className="link-btn" onClick={onBack}>
          → חזרה לספר
        </button>
        <div className="recipe-detail__actions">
          <button type="button" className="link-btn" onClick={() => window.print()}>
            🖨 הדפס מתכון
          </button>
          <button type="button" className="link-btn" onClick={() => onEdit(recipe.id)}>
            עריכה
          </button>
          <button type="button" className="link-btn link-btn--danger" onClick={() => setConfirming(true)}>
            מחיקה
          </button>
        </div>
      </div>

      <article className="recipe-page torn-edge">
        <button
          type="button"
          className="recipe-detail__fav"
          onClick={() => onToggleFavorite(recipe.id)}
          aria-pressed={recipe.favorite}
          aria-label={recipe.favorite ? "הסר ממועדפים" : "הוסף למועדפים"}
        >
          <span className={`stamp recipe-detail__stamp${recipe.favorite ? " recipe-detail__stamp--on" : ""}`}>♥</span>
        </button>

        {recipe.image && (
          <div className="recipe-detail__image-wrap">
            <img src={recipe.image} alt={recipe.title} className="recipe-detail__image" />
          </div>
        )}

        <header className="recipe-detail__header">
          <span className="recipe-detail__category">{recipe.category}</span>
          <h1>{recipe.title || "מתכון ללא שם"}</h1>
          <div className="recipe-detail__meta">
            {recipe.time && <span>⏱ {recipe.time}</span>}
            {recipe.servings && <span>🍽 {recipe.servings}</span>}
            {recipe.source && <span>מקור: {recipe.source}</span>}
          </div>
          {recipe.sourceUrl && (
            <a className="recipe-detail__link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              לצפייה במקור המקורי ↗
            </a>
          )}
        </header>

        <div className="recipe-detail__columns">
          <section className="recipe-detail__ingredients">
            <h2>מרכיבים</h2>
            {recipe.ingredients.length ? (
              <ul>
                {recipe.ingredients.map((item, i) => (
                  <li key={i} className={checkedIngredients.has(i) ? "is-checked" : ""}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checkedIngredients.has(i)}
                        onChange={() => setCheckedIngredients((prev) => toggleInSet(prev, i))}
                      />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="recipe-detail__muted">לא הוזנו מרכיבים.</p>
            )}
          </section>

          <section className="recipe-detail__steps">
            <h2>אופן ההכנה</h2>
            {recipe.steps.length ? (
              <ol>
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="recipe-detail__muted">לא הוזנו שלבי הכנה.</p>
            )}
          </section>
        </div>

        {recipe.notes && (
          <section className="recipe-detail__notes">
            <h2>הערות</h2>
            <p>{recipe.notes}</p>
          </section>
        )}

      </article>

      {confirming && (
        <ConfirmDialog
          title="מחיקת מתכון"
          message={`למחוק את "${recipe.title || "המתכון"}" מהספר? לא ניתן לשחזר פעולה זו.`}
          confirmLabel="מחיקה"
          onConfirm={() => {
            setConfirming(false);
            onDelete(recipe.id);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { parseRecipeInput } from "../lib/parser.js";
import "./RecipeForm.css";

// Photos straight off an iPhone can be several MB, which both chokes the UI and
// blows past the browser's localStorage quota (~5MB) once stringified. Downscale
// and re-encode as JPEG before it ever reaches state/storage.
function resizeImageToDataUrl(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale) || 1;
        canvas.height = Math.round(img.height * scale) || 1;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const emptyFields = {
  title: "",
  image: "",
  time: "",
  servings: "",
  ingredients: "",
  steps: "",
  notes: "",
  source: "",
  sourceUrl: "",
  category: "",
};

function recipeToFields(recipe, defaultCategory) {
  return {
    title: recipe?.title || "",
    image: recipe?.image || "",
    time: recipe?.time || "",
    servings: recipe?.servings || "",
    ingredients: (recipe?.ingredients || []).join("\n"),
    steps: (recipe?.steps || []).join("\n"),
    notes: recipe?.notes || "",
    source: recipe?.source || "",
    sourceUrl: recipe?.sourceUrl || "",
    category: recipe?.category || defaultCategory,
  };
}

export default function RecipeForm({ mode, initialRecipe, categories, onSave, onCancel }) {
  const isEdit = mode === "edit";
  const [step, setStep] = useState(isEdit ? "review" : "paste");
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [fields, setFields] = useState(() =>
    isEdit ? recipeToFields(initialRecipe, categories[0] || "אחר") : { ...emptyFields, category: categories[0] || "אחר" }
  );

  function updateField(name, value) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function runAnalysis() {
    const parsed = parseRecipeInput(pasteText);
    setFields((prev) => ({
      ...prev,
      title: parsed.title || prev.title,
      image: parsed.image || prev.image,
      time: parsed.time || prev.time,
      servings: parsed.servings || prev.servings,
      ingredients: parsed.ingredients.length ? parsed.ingredients.join("\n") : prev.ingredients,
      steps: parsed.steps.length ? parsed.steps.join("\n") : prev.steps,
      source: parsed.source || prev.source,
      sourceUrl: pasteUrl || prev.sourceUrl,
    }));
    setStep("review");
  }

  function skipToManual() {
    setFields((prev) => ({ ...prev, sourceUrl: pasteUrl || prev.sourceUrl }));
    setStep("review");
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    resizeImageToDataUrl(file, 1600, 0.85)
      .then((dataUrl) => updateField("image", dataUrl))
      .catch(() => {
        alert("לא הצלחנו לעבד את התמונה שנבחרה. אפשר לנסות תמונה אחרת.");
      });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      title: fields.title.trim(),
      image: fields.image.trim(),
      time: fields.time.trim(),
      servings: fields.servings.trim(),
      ingredients: fields.ingredients.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean),
      steps: fields.steps.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean),
      notes: fields.notes.trim(),
      source: fields.source.trim(),
      sourceUrl: fields.sourceUrl.trim(),
      category: fields.category || categories[0] || "אחר",
    });
  }

  if (step === "paste") {
    return (
      <div className="recipe-form-page">
        <div className="recipe-page torn-edge">
          <h1>הוספת מתכון חדש</h1>
          <p className="recipe-form__intro">
            הדביקו קישור למתכון וגם את תוכן העמוד (טקסט או HTML), ואנסה לזהות אוטומטית שם, תמונה, מרכיבים ושלבי הכנה.
            אין צורך בדיוק מוחלט — תמיד אפשר לתקן הכל במסך הבא לפני השמירה.
          </p>

          <label className="field">
            <span>קישור מקורי (אופציונלי)</span>
            <input
              type="url"
              inputMode="url"
              placeholder="https://example.com/recipe"
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
            />
          </label>

          <label className="field">
            <span>הדביקו כאן את טקסט המתכון (או את קוד ה-HTML של העמוד)</span>
            <textarea
              rows={10}
              placeholder={"לדוגמה:\nעוגת שוקולד\n\nמצרכים:\n2 כוסות קמח\n...\n\nהכנה:\n1. מחממים תנור...\n"}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
          </label>

          <div className="recipe-form__actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              ביטול
            </button>
            <button type="button" className="btn btn--ghost" onClick={skipToManual}>
              דילוג — הזנה ידנית
            </button>
            <button type="button" className="btn btn--accent" onClick={runAnalysis} disabled={!pasteText.trim()}>
              ניתוח אוטומטי ←
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-form-page">
      <form className="recipe-page torn-edge" onSubmit={handleSubmit}>
        <h1>{isEdit ? "עריכת מתכון" : "בדיקה והשלמת פרטים"}</h1>
        {!isEdit && (
          <p className="recipe-form__intro">
            אלה הפרטים שזוהו. אפשר לתקן כל שדה לפני שהמתכון נכנס לספר.
          </p>
        )}

        <label className="field">
          <span>שם המתכון</span>
          <input
            required
            value={fields.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="למשל: עוגת שוקולד קרמלית"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>תמונה — קישור</span>
            <input
              type="url"
              value={fields.image}
              onChange={(e) => updateField("image", e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="field field--file">
            <span>או העלאה מהמחשב</span>
            <input type="file" accept="image/*" onChange={handleImageFile} />
          </label>
        </div>

        {fields.image && (
          <div className="recipe-form__preview">
            <img src={fields.image} alt="תצוגה מקדימה" />
          </div>
        )}

        <div className="field-row">
          <label className="field">
            <span>זמן הכנה</span>
            <input
              value={fields.time}
              onChange={(e) => updateField("time", e.target.value)}
              placeholder="למשל: 45 דקות"
            />
          </label>
          <label className="field">
            <span>כמות מנות</span>
            <input
              value={fields.servings}
              onChange={(e) => updateField("servings", e.target.value)}
              placeholder="למשל: 4 מנות"
            />
          </label>
        </div>

        <label className="field">
          <span>קטגוריה</span>
          <select value={fields.category} onChange={(e) => updateField("category", e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>מרכיבים — שורה לכל מרכיב</span>
          <textarea
            rows={6}
            value={fields.ingredients}
            onChange={(e) => updateField("ingredients", e.target.value)}
            placeholder={"2 כוסות קמח\nכפית אבקת אפייה\n..."}
          />
        </label>

        <label className="field">
          <span>אופן ההכנה — שורה לכל שלב</span>
          <textarea
            rows={8}
            value={fields.steps}
            onChange={(e) => updateField("steps", e.target.value)}
            placeholder={"מחממים תנור ל-180 מעלות\nמערבבים את היבשים...\n..."}
          />
        </label>

        <label className="field">
          <span>הערות אישיות (אופציונלי)</span>
          <textarea
            rows={3}
            value={fields.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder={"למשל: להכפיל כמות לשבת, אפשר להחליף חמאה בשמן קוקוס..."}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>מקור (שם האתר)</span>
            <input value={fields.source} onChange={(e) => updateField("source", e.target.value)} placeholder="למשל: mako-אוכל" />
          </label>
          <label className="field">
            <span>קישור למקור</span>
            <input
              type="url"
              value={fields.sourceUrl}
              onChange={(e) => updateField("sourceUrl", e.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="recipe-form__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            ביטול
          </button>
          {!isEdit && (
            <button type="button" className="btn btn--ghost" onClick={() => setStep("paste")}>
              → חזרה להדבקה
            </button>
          )}
          <button type="submit" className="btn btn--primary">
            {isEdit ? "שמירת שינויים" : "הוספה לספר"}
          </button>
        </div>
      </form>
    </div>
  );
}

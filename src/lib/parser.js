// Best-effort extraction of recipe fields from pasted HTML or plain text.
// Nothing here needs to be perfect — the app always routes the result
// through an editable review screen before it's saved to the book.

function isoDurationToHebrew(iso) {
  if (!iso) return "";
  const match = /P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  if (!match) return "";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  if (!hours && !minutes) return "";
  const parts = [];
  if (hours) parts.push(`${hours} ${hours === 1 ? "שעה" : "שעות"}`);
  if (minutes) parts.push(`${minutes} דקות`);
  return parts.join(" ו-");
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(", ");
  if (typeof value === "object") return value.name || value.text || value.description || "";
  return "";
}

function findRecipeNode(node) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const type = node["@type"];
  const isRecipe = type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
  if (isRecipe) return node;
  if (node["@graph"]) return findRecipeNode(node["@graph"]);
  return null;
}

function extractJsonLdRecipe(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const recipe = findRecipeNode(data);
      if (recipe) return recipe;
    } catch {
      // ignore malformed JSON-LD blocks and keep looking
    }
  }
  return null;
}

function instructionsToSteps(instructions) {
  if (!instructions) return [];
  if (typeof instructions === "string") {
    return instructions
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  if (Array.isArray(instructions)) {
    return instructions
      .flatMap((item) => {
        if (typeof item === "string") return [item];
        if (item.itemListElement) return instructionsToSteps(item.itemListElement);
        return [item.text || item.name || ""];
      })
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function imageFromJsonLd(image) {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return imageFromJsonLd(image[0]);
  if (typeof image === "object") return image.url || "";
  return "";
}

// Elements that never contain real recipe content: navigation chrome, ads,
// social widgets, newsletter prompts and — critically — the comments thread,
// which on a page with hundreds of replies would otherwise dwarf and pollute
// the plain-text fallback extraction.
const NOISY_SELECTOR = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "iframe",
  "form",
  "button",
  "aside",
  '[id*="comment" i]',
  '[class*="comment" i]',
  "#respond",
  ".respond",
  '[id*="disqus" i]',
  '[class*="disqus" i]',
  '[class*="advert" i]',
  '[id*="advert" i]',
  '[class*="sponsor" i]',
  '[class*="banner" i]',
  '[class*="popup" i]',
  '[class*="newsletter" i]',
  '[class*="social" i]',
  '[class*="share" i]',
  '[class*="sidebar" i]',
  '[class*="related" i]',
  '[class*="cookie" i]',
].join(", ");

function stripNoisyElements(doc) {
  let removed = 0;
  doc.querySelectorAll(NOISY_SELECTOR).forEach((el) => {
    el.remove();
    removed += 1;
  });
  return removed;
}

// element.textContent joins text nodes with no separator — sibling <p>/<div>
// tags only read as separate lines if the source markup happens to have
// whitespace between them, which minified pages won't have. Many no-schema
// recipe sites also dump a whole ingredient list into one paragraph split
// only by <br>. Inserting explicit newlines around block elements and <br>
// makes line-splitting reliable regardless of source formatting.
const BLOCK_SELECTOR = "p, div, li, h1, h2, h3, h4, h5, h6, tr, section, article, blockquote";

function domToText(root) {
  const clone = root.cloneNode(true);
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  clone.querySelectorAll(BLOCK_SELECTOR).forEach((el) => {
    el.insertAdjacentText("beforebegin", "\n");
    el.insertAdjacentText("afterend", "\n");
  });
  return clone.textContent || "";
}

function parseFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const recipe = extractJsonLdRecipe(doc);
  const result = {
    title: "",
    image: "",
    time: "",
    servings: "",
    ingredients: [],
    steps: [],
    source: "",
  };

  if (recipe) {
    result.title = textOf(recipe.name);
    result.image = imageFromJsonLd(recipe.image);
    result.time = isoDurationToHebrew(recipe.totalTime || recipe.cookTime || recipe.prepTime);
    result.servings = textOf(recipe.recipeYield);
    result.ingredients = (recipe.recipeIngredient || recipe.ingredients || []).map(textOf).filter(Boolean);
    result.steps = instructionsToSteps(recipe.recipeInstructions);
    result.source = textOf(recipe.author) || textOf(recipe.publisher);
  }

  if (!result.title) {
    result.title = doc.querySelector("title")?.textContent?.trim() || "";
  }
  if (!result.image) {
    result.image = doc.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";
  }
  if (!result.image) {
    result.image = doc.querySelector("img")?.getAttribute("src") || "";
  }
  if (!result.source) {
    result.source = doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "";
  }

  if (!result.ingredients.length || !result.steps.length) {
    // Strip nav/ads/comments *before* reading textContent so a 300-reply
    // comment thread never leaks into the ingredients/steps fallback.
    stripNoisyElements(doc);
    const bodyText = doc.body ? domToText(doc.body) : "";
    const fallback = parseFromText(bodyText);
    if (!result.ingredients.length) result.ingredients = fallback.ingredients;
    if (!result.steps.length) result.steps = fallback.steps;
    if (!result.time) result.time = fallback.time;
    if (!result.servings) result.servings = fallback.servings;
  }

  return result;
}

// Strips bullet chars ("- ", "• ") or numbered-list markers ("1. ", "2) ")
// but leaves bare leading quantities ("2 כוסות קמח", "550-600 מ״ל") untouched.
function stripListMarker(line) {
  return line.replace(/^(?:[-•*‣○]\s*|\d+[.)]\s+)/, "");
}

// Core heading words, optionally preceded by "רשימת" and followed by a
// qualifier like "למתכון" / "לבצק" — real sites often write "מצרכים למתכון:"
// or "אופן ההכנה:" as bolded inline text rather than a semantic <h*> tag,
// so this only ever runs against already-split text lines.
const INGREDIENT_HEADINGS =
  /^(?:רשימת\s+)?(מצרכים|מרכיבים|רכיבים|חומרים|מה\s+צריך)(?:\s+(?:למתכון|לבצק|לעוגה|למילוי|לציפוי|לרוטב|להגשה|לקישוט|לבלילה|לבלוטים))?\s*[:?]?\s*$/i;
const STEP_HEADINGS =
  /^(הוראות(?:\s+הכנה)?|אופן\s+ה?הכנה|דרך\s+ה?הכנה|צעדי\s+ה?הכנה|שלבי\s+ה?הכנה|שלבי\s+ביצוע|אופן\s+הביצוע|הוראות\s+ביצוע|איך\s+(?:מכינים|להכין)|instructions?|directions?|method)(?:\s+(?:למתכון|לבצק|לעוגה))?\s*[:?]?\s*$/i;

// Common Hebrew measurement words. Used to recognize ingredient-shaped
// lines even without an explicit heading (e.g. a bare list with no label).
const UNIT_WORDS =
  "כוס|כוסות|כפית|כפיות|כף|כפות|גרם|גר['׳]|ק\"ג|קילו|מ\"ל|מיליליטר|ליטר|יחידה|יחידות|חבילה|חבילות|קופסה|קופסת|שקית|קורט|קמצוץ|פרוסה|פרוסות|ביצה|ביצים|שן|שיניים|חופן|מארז|בקבוק|קילוגרם";

const QUANTITY_START_RE = /^[\d½¼¾⅓⅔⅛]/;
const UNIT_WORD_RE = new RegExp(`\\b(?:${UNIT_WORDS})\\b`);

function looksLikeIngredientLine(line) {
  if (QUANTITY_START_RE.test(line)) return true;
  const firstWords = line.split(/\s+/).slice(0, 4).join(" ");
  return UNIT_WORD_RE.test(firstWords);
}

// Present-tense plural Hebrew instruction verbs ("מוסיפים", "מערבבים"...)
// plus a small whitelist of imperative infinitives ("לשים", "לערבב"...).
const STEP_VERB_RE =
  /^(?:מ[א-ת]{2,8}(?:ים|ות)|ל(?:שים|הוסיף|ערבב|חמם|קצוץ|טגן|אפות|בשל|הקציף|סנן|הגיש|יצוק|נפות|כסות|גלגל|קלוע))\b/;

// Noise commonly found near recipe text on real sites: share prompts,
// comment CTAs, newsletter signups, ads, footers. Filtered line-by-line so
// it can't leak into ingredients/steps even mid-section.
const NOISE_LINE_RE =
  /^(תגובות(\s+גולשים)?|תגובה\s+אחת|השאירו\s+תגובה|כתבו\s+תגובה|הוסיפו\s+תגובה|הוסף\s+תגובה|הוספת\s+תגובה|כתיבת\s+תגובה|הגיבו\s+למתכון|כתבו\s+לנו\s+מה\s+דעתכם|מה\s+דעתכם\?|דרגו\s+את\s+המתכון|דירוג\s+המתכון|שתפו(\s+את\s+המתכון)?:?|שיתוף|עקבו\s+אחרינו|הירשמו\s+ל(עדכונים|ניוזלטר)|הרשמה\s+לניוזלטר|פרסומת|מודעה|advertisement|sponsored|cookies?|כל\s+הזכויות\s+שמורות|תפריט\s+ראשי|קרא\s+עוד|מתכונים\s+נוספים|מתכונים\s+קשורים|אולי\s+(יתחשק\s+לכם|תאהבו\s+גם)|לחצו\s+כאן|הדפיסו?\s+מתכון|הדפסת\s+מתכון|שמרו\s+מתכון|שלחו\s+לחבר|print\s+friendly|whatsapp|facebook|pinterest|instagram|twitter|טוויטר)\s*[:.]?\s*$/i;

// A comments thread boundary ("353 תגובות גולשים", "השאירו תגובה") — once
// hit, everything after is assumed to be user replies, not recipe content,
// so parsing stops entirely rather than filtering line by line.
const COMMENTS_BOUNDARY_RE =
  /^\d+\s*(תגובות(\s+גולשים)?|תגובה)\s*$|^(תגובות(\s+גולשים)?|השאירו\s+תגובה|כתבו\s+תגובה|הוסיפו\s+תגובה|הגיבו\s+למתכון)\s*[:.]?\s*$/i;

function isNoiseLine(line) {
  return NOISE_LINE_RE.test(line);
}

// Splits a bare list of lines (no recognizable headings at all) into an
// ingredients block followed by a steps block, using quantity/unit words to
// spot ingredients and instructional verbs to spot the start of the method —
// mirrors how virtually every recipe is actually written.
function heuristicSplit(lines) {
  const ingredients = [];
  const steps = [];
  let inSteps = false;
  for (const line of lines) {
    if (!inSteps && STEP_VERB_RE.test(line) && !looksLikeIngredientLine(line)) {
      inSteps = true;
    }
    if (inSteps) steps.push(stripListMarker(line));
    else ingredients.push(stripListMarker(line));
  }
  return { ingredients, steps };
}

// Ranges ("25-35 דקות", "550-600 מ״ל") are captured whole instead of only
// the trailing number.
const TIME_RE = /(\d+(?:[-–]\d+)?)\s*(דקות|שעות|min|hours?)/i;
const SERVINGS_RE = /(\d+(?:[-–]\d+)?)\s*(מנות|servings?)/i;

function parseFromText(text) {
  const rawLines = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const lines = [];
  for (const line of rawLines) {
    if (COMMENTS_BOUNDARY_RE.test(line)) break; // stop before the comments thread
    if (isNoiseLine(line)) continue;
    lines.push(line);
  }

  const hasHeadings = lines.some((l) => INGREDIENT_HEADINGS.test(l) || STEP_HEADINGS.test(l));
  const title = lines.length && !INGREDIENT_HEADINGS.test(lines[0]) && !STEP_HEADINGS.test(lines[0]) ? lines[0] : "";

  let ingredients = [];
  let steps = [];

  if (hasHeadings) {
    let section = null;
    for (const line of lines) {
      if (INGREDIENT_HEADINGS.test(line)) {
        section = "ingredients";
        continue;
      }
      if (STEP_HEADINGS.test(line)) {
        section = "steps";
        continue;
      }
      if (section === "ingredients") ingredients.push(stripListMarker(line));
      else if (section === "steps") steps.push(stripListMarker(line));
    }
  } else {
    const rest = title ? lines.slice(1) : lines;
    ({ ingredients, steps } = heuristicSplit(rest));
  }

  const timeMatch = text.match(TIME_RE);
  const servingsMatch = text.match(SERVINGS_RE);

  return {
    title,
    image: "",
    time: timeMatch ? timeMatch[0] : "",
    servings: servingsMatch ? servingsMatch[0] : "",
    ingredients,
    steps,
    source: "",
  };
}

export function parseRecipeInput(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return { title: "", image: "", time: "", servings: "", ingredients: [], steps: [], source: "" };
  }
  const looksLikeHtml = /<\s*(html|body|div|p|script|meta)[\s>]/i.test(trimmed);
  return looksLikeHtml ? parseFromHtml(trimmed) : parseFromText(trimmed);
}

import "./CategoryTabs.css";

export default function CategoryTabs({ categories, active, onSelect, onManage }) {
  return (
    <div className="cat-tabs" role="tablist" aria-label="סינון לפי קטגוריה">
      <button
        type="button"
        role="tab"
        aria-selected={active === "all"}
        className={`cat-tabs__tab${active === "all" ? " cat-tabs__tab--active" : ""}`}
        onClick={() => onSelect("all")}
      >
        הכל
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={active === cat}
          className={`cat-tabs__tab${active === cat ? " cat-tabs__tab--active" : ""}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
      <button type="button" className="cat-tabs__manage" onClick={onManage} title="ניהול קטגוריות">
        ⚙ קטגוריות
      </button>
    </div>
  );
}

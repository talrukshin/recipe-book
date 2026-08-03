import "./Header.css";

export default function Header({ onHome, onAdd }) {
  return (
    <header className="app-header">
      <button className="app-header__brand" onClick={onHome} type="button">
        <span className="app-header__titles">
          <span className="app-header__title">ספר המתכונים שלי</span>
          <span className="app-header__subtitle">אוסף אישי, מוגש בהנאה</span>
        </span>
      </button>
      <button className="app-header__add" onClick={onAdd} type="button">
        <span aria-hidden="true">+</span> מתכון חדש
      </button>
    </header>
  );
}

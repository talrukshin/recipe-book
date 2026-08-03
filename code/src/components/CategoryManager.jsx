import { useState } from "react";
import "./CategoryManager.css";

export default function CategoryManager({ categories, onAdd, onRename, onDelete, onClose }) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");

  function submitNew(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName);
    setNewName("");
  }

  function submitRename(e) {
    e.preventDefault();
    onRename(editing, editValue);
    setEditing(null);
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog cat-manager" onClick={(e) => e.stopPropagation()}>
        <h2>ניהול קטגוריות</h2>
        <ul className="cat-manager__list">
          {categories.map((cat) => (
            <li key={cat}>
              {editing === cat ? (
                <form className="cat-manager__edit-row" onSubmit={submitRename}>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    aria-label={`שם חדש לקטגוריה ${cat}`}
                  />
                  <button type="submit" className="btn btn--accent">
                    שמירה
                  </button>
                </form>
              ) : (
                <>
                  <span>{cat}</span>
                  <span className="cat-manager__row-actions">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setEditing(cat);
                        setEditValue(cat);
                      }}
                    >
                      עריכה
                    </button>
                    <button type="button" className="link-btn link-btn--danger" onClick={() => onDelete(cat)}>
                      מחיקה
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        <form className="cat-manager__new-row" onSubmit={submitNew}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="קטגוריה חדשה…"
            aria-label="שם קטגוריה חדשה"
          />
          <button type="submit" className="btn btn--accent">
            הוספה
          </button>
        </form>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}

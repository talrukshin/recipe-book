import "./EmptyState.css";

export default function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <p>{message || "עוד לא נוספו מתכונים לספר. הגיע הזמן להתחיל לבשל!"}</p>
    </div>
  );
}

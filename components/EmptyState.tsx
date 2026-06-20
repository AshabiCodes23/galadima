export default function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-text">{text}</p>
    </div>
  );
}
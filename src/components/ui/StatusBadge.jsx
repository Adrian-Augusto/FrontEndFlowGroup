import "./StatusBadge.css";

const LABELS = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Negado",
};

export function StatusBadge({ status }) {
  const key = String(status ?? "").toLowerCase();
  return (
    <span className={`status-badge status-badge--${key}`}>
      {LABELS[key] ?? status}
    </span>
  );
}

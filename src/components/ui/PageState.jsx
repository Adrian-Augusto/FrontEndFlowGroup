import "./PageState.css";

export function LoadingState({ label = "Carregando…" }) {
  return (
    <p className="page-state page-state--loading" role="status">
      {label}
    </p>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="page-state page-state--empty">
      <p className="page-state__title">{title}</p>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="page-state page-state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="page-state__btn" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

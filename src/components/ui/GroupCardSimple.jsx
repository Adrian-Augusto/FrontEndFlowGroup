import { StatusBadge } from "./StatusBadge";
import "./GroupCardSimple.css";

export function GroupCardSimple({ group, showStatus = false }) {
  const title = group.title ?? group.name ?? "Sem nome";

  return (
    <article className="group-card-simple">
      <div className="group-card-simple__head">
        <h3 className="group-card-simple__title">{title}</h3>
        {showStatus && group.status && <StatusBadge status={group.status} />}
      </div>
      <p className="group-card-simple__desc">{group.description || "—"}</p>
      {group.rejectReason && group.status === "rejected" && (
        <p className="group-card-simple__reason">Motivo: {group.rejectReason}</p>
      )}
    </article>
  );
}

import { PLATFORM_MAP } from "../data/platforms";
import "./PlatformBadge.css";

export function PlatformBadge({ platformId }) {
  const platform = PLATFORM_MAP[platformId];
  if (!platform) return null;

  return (
    <span className="platform-badge" style={{ "--badge-color": platform.color }}>
      {platform.label}
    </span>
  );
}

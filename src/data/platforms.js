/** Plataformas onde o grupo existe (WhatsApp, Telegram, etc.) */
export const GROUP_PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { id: "telegram", label: "Telegram", color: "#229ED9" },
  { id: "discord", label: "Discord", color: "#5865F2" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "instagram", label: "Instagram", color: "#E4405F" },
  { id: "slack", label: "Slack", color: "#4A154B" },
  { id: "signal", label: "Signal", color: "#3A76F0" },
  { id: "outros", label: "Outro", color: "#6B7280" },
];

export const PLATFORM_MAP = Object.fromEntries(
  GROUP_PLATFORMS.map((p) => [p.id, p]),
);

export function getPlatformLabel(platformId) {
  return PLATFORM_MAP[platformId]?.label ?? platformId;
}

/**
 * Ilustração SVG do polvo — tentáculos conectam nós (grupos).
 */
export function OctopusIllustration({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="octopus-title octopus-desc"
    >
      <title id="octopus-title">Polvo conectando grupos</title>
      <desc id="octopus-desc">
        Ilustração de um polvo cujos tentáculos ligam círculos que representam grupos
      </desc>

      {/* Connection nodes */}
      <circle cx="48" cy="88" r="14" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2" />
      <circle cx="352" cy="72" r="14" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2" />
      <circle cx="368" cy="200" r="14" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2" />
      <circle cx="32" cy="220" r="14" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2" />
      <circle cx="200" cy="28" r="12" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />

      {/* Tentacles / connections */}
      <path
        d="M62 95 Q120 60 185 120"
        stroke="#A78BFA"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M338 82 Q280 50 215 115"
        stroke="#A78BFA"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M354 208 Q290 240 230 195"
        stroke="#A78BFA"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M46 212 Q100 250 175 200"
        stroke="#A78BFA"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M208 38 Q205 80 200 115"
        stroke="#C4B5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Body */}
      <ellipse cx="200" cy="155" rx="72" ry="68" fill="#7C3AED" />
      <ellipse cx="200" cy="148" rx="58" ry="52" fill="#8B5CF6" opacity="0.35" />

      {/* Eyes */}
      <ellipse cx="178" cy="142" rx="14" ry="16" fill="#fff" />
      <ellipse cx="222" cy="142" rx="14" ry="16" fill="#fff" />
      <circle cx="180" cy="144" r="6" fill="#1F1633" />
      <circle cx="224" cy="144" r="6" fill="#1F1633" />
      <circle cx="182" cy="142" r="2" fill="#fff" />
      <circle cx="226" cy="142" r="2" fill="#fff" />

      {/* Smile */}
      <path
        d="M185 168 Q200 178 215 168"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Lower tentacles */}
      <path
        d="M145 210 Q130 260 110 290"
        stroke="#6D28D9"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M175 218 Q170 270 165 300"
        stroke="#7C3AED"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M200 222 Q200 275 200 305"
        stroke="#7C3AED"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M225 218 Q230 270 235 300"
        stroke="#7C3AED"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M255 210 Q270 260 290 290"
        stroke="#6D28D9"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Suction cups hint */}
      <circle cx="112" cy="278" r="4" fill="#5B21B6" opacity="0.5" />
      <circle cx="168" cy="292" r="3.5" fill="#5B21B6" opacity="0.5" />
      <circle cx="200" cy="298" r="3.5" fill="#5B21B6" opacity="0.5" />
      <circle cx="232" cy="292" r="3.5" fill="#5B21B6" opacity="0.5" />
      <circle cx="288" cy="278" r="4" fill="#5B21B6" opacity="0.5" />
    </svg>
  );
}

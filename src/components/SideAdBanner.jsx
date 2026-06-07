import { useState } from "react";
import "./SideAdBanner.css";

export function SideAdBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <aside className="side-ad-banner">
      <button
        type="button"
        className="side-ad-banner__close"
        onClick={handleClose}
        aria-label="Fechar anúncio"
        title="Fechar"
      >
        ✕
      </button>

      <div className="side-ad-banner__content">
        {/* Google AdSense will be placed here */}
      </div>
    </aside>
  );
}

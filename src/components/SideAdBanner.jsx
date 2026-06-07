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
        <h3 className="side-ad-banner__title">Promova seu grupo!</h3>
        
        <p className="side-ad-banner__text">
          Aumente a visibilidade do seu grupo com nosso plano premium.
        </p>

        <div className="side-ad-banner__features">
          <div className="side-ad-banner__feature">
            ✓ Destaque especial
          </div>
          <div className="side-ad-banner__feature">
            ✓ Mais visibilidade
          </div>
          <div className="side-ad-banner__feature">
            ✓ Suporte prioritário
          </div>
        </div>

        <button className="side-ad-banner__cta">
          Saiba mais
        </button>
      </div>
    </aside>
  );
}

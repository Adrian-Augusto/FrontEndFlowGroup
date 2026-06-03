import { OctopusIllustration } from "./OctopusIllustration";
import "./Hero.css";

export function Hero() {
  return (
    <section className="hero" id="sobre" aria-labelledby="hero-heading">
      <div className="hero__inner">
        <div className="hero__visual">
          <OctopusIllustration className="hero__octopus" />
        </div>
        <div className="hero__content">
          <p className="hero__eyebrow">Catálogo de links</p>
          <h1 id="hero-heading" className="hero__title">
            Grupos do{" "}
            <span className="hero__highlight">WhatsApp, Telegram e mais</span>
          </h1>
          <p className="hero__text">
            Descubra e publique convites de grupos de outras plataformas — com foto,
            título, descrição e link direto para entrar.
          </p>
          <div className="hero__stats">
            <div className="hero__stat">
              <strong>💬</strong>
              <span>WhatsApp</span>
            </div>
            <div className="hero__stat">
              <strong>✈️</strong>
              <span>Telegram</span>
            </div>
            <div className="hero__stat">
              <strong>🎮</strong>
              <span>Discord</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

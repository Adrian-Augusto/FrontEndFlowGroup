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
            Criador de grupos online para equipes e comunidades
          </h1>
          <p className="hero__text">
            Organize grupos como no Discord ou Telegram. Gerencie membros, equipes e comunidades em um só lugar.
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

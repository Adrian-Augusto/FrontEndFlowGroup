import "./SEOContentSection.css";

export function SEOContentSection() {
  return (
    <section className="seo-content" aria-labelledby="seo-heading">
      <div className="seo-content__inner">
        <h2 id="seo-heading" className="seo-content__title">
          Como funciona o organizador de grupos
        </h2>
        
        <div className="seo-content__grid">
          <article className="seo-content__card">
            <h3 className="seo-content__card-title">Crie grupos online</h3>
            <p className="seo-content__card-text">
              Publique convites de grupos do WhatsApp, Telegram e Discord em um só lugar. 
              Gerencie suas comunidades com facilidade usando nosso organizador de grupos.
            </p>
          </article>

          <article className="seo-content__card">
            <h3 className="seo-content__card-title">Alternativa ao Discord</h3>
            <p className="seo-content__card-text">
              Uma alternativa ao Discord e Telegram para descobrir e compartilhar grupos. 
              Encontre comunidades de jogos, estudos, trabalho e muito mais.
            </p>
          </article>

          <article className="seo-content__card">
            <h3 className="seo-content__card-title">Gerencie comunidades</h3>
            <p className="seo-content__card-text">
              Gerencie membros e equipes facilmente. Nossa plataforma funciona como um 
              organizador de grupos completo para suas comunidades online.
            </p>
          </article>
        </div>

        <div className="seo-content__benefits">
          <h3 className="seo-content__benefits-title">Benefícios</h3>
          <ul className="seo-content__benefits-list">
            <li>Catálogo centralizado de grupos de múltiplas plataformas</li>
            <li>Busca e filtragem por categoria e plataforma</li>
            <li>Publicação de grupos com foto, título e descrição</li>
            <li>Gerenciamento simplificado de comunidades</li>
            <li>Alternativa prática ao Discord e Telegram para descoberta</li>
          </ul>
        </div>

        <div className="seo-content__use-cases">
          <h3 className="seo-content__use-cases-title">Casos de uso</h3>
          <ul className="seo-content__use-cases-list">
            <li>Grupos de estudo e educação</li>
            <li>Comunidades de jogos e entretenimento</li>
            <li>Equipes de trabalho e projetos</li>
            <li>Grupos de interesse e hobbies</li>
            <li>Networking profissional</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

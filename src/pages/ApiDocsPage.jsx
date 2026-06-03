import { API_BASE, API_ROUTE_DOCS } from "../api/routes";
import "./ApiDocsPage.css";

export function ApiDocsPage() {
  return (
    <div className="api-docs">
      <div className="api-docs__inner">
        <header className="api-docs__header">
          <p className="api-docs__eyebrow">Contrato REST</p>
          <h1>Rotas do backend</h1>
          <p>
            Especificação para integrar Node/Express, Nest ou outro servidor. Base:{" "}
            <code>{API_BASE}</code>
          </p>
          <p className="api-docs__env">
            Auth: cookies <code>HttpOnly</code> — frontend com{" "}
            <code>credentials: include</code>. Variáveis: <code>VITE_API_URL</code>,{" "}
            <code>VITE_USE_MOCK=false</code>.
          </p>
        </header>

        {API_ROUTE_DOCS.map((section) => (
          <section key={section.tag} className="api-docs__section">
            <h2>
              <span className="api-docs__tag">{section.tag}</span>
              {section.description}
            </h2>
            <ul className="api-docs__routes">
              {section.routes.map((route) => (
                <li key={`${route.method}-${route.path}`} className="api-route">
                  <div className="api-route__head">
                    <span className={`api-route__method api-route__method--${route.method.toLowerCase()}`}>
                      {route.method}
                    </span>
                    <code className="api-route__path">{route.path}</code>
                    {route.auth && (
                      <span className="api-route__auth">
                        {route.auth === true ? "JWT" : route.auth}
                      </span>
                    )}
                  </div>
                  {route.query && (
                    <p className="api-route__meta">
                      Query: <code>{route.query}</code>
                    </p>
                  )}
                  {route.body && (
                    <p className="api-route__meta">
                      Body: <code>{route.body}</code>
                    </p>
                  )}
                  {route.response && (
                    <p className="api-route__meta">
                      Response: <code>{route.response}</code>
                    </p>
                  )}
                  {route.note && <p className="api-route__note">{route.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

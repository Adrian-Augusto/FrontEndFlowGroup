import "./Footer.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__copy">
          © {year} FlowGroup. Todos os direitos reservados.
        </p>
        <p className="footer__tech">
          <a href="/termos" style={{ color: "inherit", textDecoration: "none", marginRight: "16px" }}>Termos</a>
          <a href="/termos" style={{ color: "inherit", textDecoration: "none" }}>Privacidade</a>
        </p>
      </div>
    </footer>
  );
}

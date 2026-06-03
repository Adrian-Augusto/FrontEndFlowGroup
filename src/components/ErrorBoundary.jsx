import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error" role="alert">
          <h1>Algo deu errado</h1>
          <p>{this.state.error?.message ?? "Erro inesperado na interface."}</p>
          <button type="button" onClick={() => window.location.assign("/")}>
            Voltar ao início
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

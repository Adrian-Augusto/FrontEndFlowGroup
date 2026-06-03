import { useState } from "react";
import { Link } from "react-router-dom";
import { groupsApi } from "../../api/groupsApi";
import "./groupsPages.css";

export function CreateGroupPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await groupsApi.create({
        name: name.trim(),
        description: description.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.message ?? "Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="groups-page groups-page--narrow">
        <div className="groups-page__success" role="status">
          <h1>Enviado!</h1>
          <p>
            Seu grupo está <strong>aguardando aprovação</strong>. Você será notificado quando
            for publicado no catálogo.
          </p>
          <div className="groups-page__success-actions">
            <Link to="/groups/my" className="groups-page__cta">
              Ver meus grupos
            </Link>
            <Link to="/groups" className="groups-page__link">
              Voltar ao catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="groups-page groups-page--narrow">
      <h1 className="groups-page__title">Criar grupo</h1>
      <p className="groups-page__subtitle">Preencha nome e descrição do seu grupo externo.</p>

      {error && (
        <p className="groups-page__error" role="alert">
          {error}
        </p>
      )}

      <form className="groups-form" onSubmit={handleSubmit}>
        <label className="groups-form__label" htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          className="groups-form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          disabled={loading}
          placeholder="Ex.: Ofertas Tech SP"
        />

        <label className="groups-form__label" htmlFor="description">
          Descrição
        </label>
        <textarea
          id="description"
          className="groups-form__textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          maxLength={2000}
          disabled={loading}
          placeholder="Descreva o grupo e o que os membros encontram…"
        />

        <button type="submit" className="groups-page__cta groups-page__cta--block" disabled={loading}>
          {loading ? "Enviando…" : "Publicar grupo"}
        </button>
      </form>

      <Link to="/groups" className="groups-page__back">
        ← Cancelar
      </Link>
    </div>
  );
}

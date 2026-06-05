import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { groupsApi } from "../../api/groupsApi";
import { CATEGORIES_SECTIONS } from "../../constants/categories";
import { GROUP_PLATFORMS } from "../../data/platforms";
import "./groupsPages.css";

export function CreateGroupPage() {
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target?.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const data = new FormData(e.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const link = String(data.get("link") ?? "").trim();
    const platform = String(data.get("platform") ?? "whatsapp");
    const photoFile = data.get("photo") instanceof File && data.get("photo").size > 0
      ? data.get("photo")
      : null;
    const categoryId = data.get("categoryId");

    if (!title) {
      titleRef.current?.focus();
      setError("Título é obrigatório");
      return;
    }
    if (!link) {
      e.currentTarget.querySelector("#group-link")?.focus();
      setError("Link é obrigatório");
      return;
    }
    if (!categoryId) {
      e.currentTarget.querySelector("#group-category")?.focus();
      setError("Por favor, selecione uma categoria");
      return;
    }
    if (!photoFile) {
      e.currentTarget.querySelector("#group-photo")?.focus();
      setError("Foto é obrigatória");
      return;
    }

    setLoading(true);
    try {
      await groupsApi.create({
        title,
        description,
        link,
        platform,
        photoFile,
        categoryId,
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.message ?? "Erro ao publicar grupo");
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
            <Link to="/meus-grupos" className="groups-page__cta">
              Ver meus grupos
            </Link>
            <Link to="/" className="groups-page__link">
              Voltar ao catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categories = CATEGORIES_SECTIONS.flatMap(section => section.categories);
  const platforms = GROUP_PLATFORMS || [];

  return (
    <div className="groups-page groups-page--narrow">
      <h1 className="groups-page__title">Publicar novo grupo</h1>
      <p className="groups-page__subtitle">Preencha todos os campos para publicar seu grupo.</p>

      {error && (
        <p className="groups-page__error" role="alert">
          {error}
        </p>
      )}

      <form className="groups-form" onSubmit={handleSubmit}>
        <label className="groups-form__label" htmlFor="title">
          Título <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          ref={titleRef}
          id="title"
          name="title"
          className="groups-form__input"
          required
          maxLength={120}
          disabled={loading}
          placeholder="Ex.: Ofertas Tech SP"
        />

        <label className="groups-form__label" htmlFor="description">
          Descrição <span style={{ color: 'red' }}>*</span>
        </label>
        <textarea
          id="description"
          name="description"
          className="groups-form__textarea"
          required
          rows={5}
          maxLength={2000}
          disabled={loading}
          placeholder="Descreva o grupo e o que os membros encontram…"
        />

        <label className="groups-form__label" htmlFor="group-link">
          Link do grupo <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          id="group-link"
          name="link"
          className="groups-form__input"
          type="url"
          required
          maxLength={500}
          disabled={loading}
          placeholder="https://whatsapp.com/... ou https://t.me/..."
        />

        <label className="groups-form__label" htmlFor="group-platform">
          Plataforma <span style={{ color: 'red' }}>*</span>
        </label>
        <select
          id="group-platform"
          name="platform"
          className="groups-form__input"
          required
          disabled={loading}
          defaultValue="whatsapp"
        >
          <option value="">Selecione uma plataforma</option>
          {platforms.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <label className="groups-form__label" htmlFor="group-category">
          Categoria <span style={{ color: 'red' }}>*</span>
        </label>
        <select
          id="group-category"
          name="categoryId"
          className="groups-form__input"
          required
          disabled={loading}
        >
          <option value="">Selecione uma categoria</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label className="groups-form__label" htmlFor="group-photo">
          Foto <span style={{ color: 'red' }}>*</span>
        </label>
        {preview && (
          <div style={{ marginBottom: '1rem' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
        )}
        <input
          id="group-photo"
          name="photo"
          type="file"
          className="groups-form__input"
          accept="image/*"
          required
          disabled={loading}
          onChange={handlePhotoChange}
        />

        <button type="submit" className="groups-page__cta groups-page__cta--block" disabled={loading}>
          {loading ? "Publicando…" : "Publicar grupo"}
        </button>
      </form>

      <Link to="/" className="groups-page__back">
        ← Cancelar
      </Link>
    </div>
  );
}

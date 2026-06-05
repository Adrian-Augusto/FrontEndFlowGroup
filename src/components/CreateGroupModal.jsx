import { useEffect, useId, useRef, useState } from "react";
import { CATEGORIES_SECTIONS } from "../constants/categories";
import { GROUP_PLATFORMS } from "../data/platforms";
import "./CreateGroupModal.css";

export function CreateGroupModal({ isOpen, onClose, onSubmit }) {
  const titleId = useId();
  const titleRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = requestAnimationFrame(() => titleRef.current?.focus());

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      setPreview(null);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const link = String(data.get("link") ?? "").trim();
    const platform = String(data.get("platform") ?? "whatsapp");
    const photoFile = data.get("photo") instanceof File && data.get("photo").size > 0
      ? data.get("photo")
      : null;
    const sponsorThisGroup = false;

    if (!title) {
      titleRef.current?.focus();
      return;
    }
    if (!link) {
      e.currentTarget.querySelector("#group-link")?.focus();
      return;
    }
    const categoryId = data.get("categoryId");
    if (!categoryId) {
      e.currentTarget.querySelector("#group-category")?.focus();
      alert("Por favor, selecione uma categoria para o grupo");
      return;
    }
    if (!photoFile) {
      e.currentTarget.querySelector("#group-photo")?.focus();
      alert("Por favor, selecione uma foto para o grupo");
      return;
    }

    onSubmit({
      title,
      name: title,
      description: description || "Sem descrição.",
      link,
      platform,
      categoryId,
      photoFile,
      sponsorThisGroup,
    });
    e.currentTarget.reset();
    setPreview(null);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho do arquivo (5MB = 5 * 1024 * 1024 bytes)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`A foto não pode exceder 5MB. Arquivo selecionado: ${sizeInMB}MB`);
        e.target.value = ""; // Limpar o input
        setPreview(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result || null);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleBackdropClick}>
      <div className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            Publicar grupo
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label htmlFor="group-title">Título do Grupo *</label>
            <input
              ref={titleRef}
              id="group-title"
              name="title"
              type="text"
              required
              maxLength={100}
              placeholder="Ex: Grupo de Tecnologia"
              autoComplete="off"
            />
          </div>

          <div className="modal__field">
            <label htmlFor="group-description">Descrição</label>
            <textarea
              id="group-description"
              name="description"
              rows={3}
              maxLength={300}
              placeholder="Sobre o que é o grupo e quem pode entrar..."
            />
          </div>

          <div className="modal__field">
            <label htmlFor="group-link">Link do grupo *</label>
            <input
              id="group-link"
              name="link"
              type="url"
              required
              placeholder="https://chat.whatsapp.com/... ou t.me/..."
            />
            <p className="modal__hint">WhatsApp, Telegram, Discord, etc. - Obrigatório</p>
          </div>

          <div className="modal__field">
            <label htmlFor="group-platform">Plataforma *</label>
            <select id="group-platform" name="platform" defaultValue="whatsapp" required>
              {GROUP_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="modal__hint">Selecione a plataforma - Obrigatório</p>
          </div>

          <div className="modal__field">
            <label htmlFor="group-category">Categoria *</label>
            <select id="group-category" name="categoryId" required>
              <option value="">Selecione uma categoria...</option>
              {CATEGORIES_SECTIONS.map((section) => (
                <optgroup key={section.title} label={section.title}>
                  {section.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="modal__hint">Opcional - ajuda na descoberta do seu grupo</p>
          </div>

          <div className="modal__field">
            <label htmlFor="group-photo">Foto de capa *</label>
            <input
              id="group-photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={handlePhotoChange}
            />
            <p className="modal__hint">Imagem (JPG, PNG, WebP) - Obrigatório</p>
            {preview && (
              <img
                src={preview}
                alt="Prévia da capa"
                className="modal__photo-preview"
              />
            )}
          </div>

          <p className="modal__note">
            <strong>POST /api/v1/groups</strong> — body: título, descrição, link, plataforma, categoria, foto. Status{" "}
            <em>pending</em> até moderação.
          </p>

          <footer className="modal__actions">
            <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal__btn modal__btn--primary">
              Enviar para aprovação
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

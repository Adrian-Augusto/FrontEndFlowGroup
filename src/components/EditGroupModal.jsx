import { useEffect, useId, useRef, useState } from "react";
import { CATEGORIES_SECTIONS } from "../constants/categories";
import { GROUP_PLATFORMS } from "../data/platforms";
import { DEFAULT_PHOTO } from "../data/groups";
import "./EditGroupModal.css";

export function EditGroupModal({ isOpen, onClose, group, onSubmit }) {
  const titleId = useId();
  const titleRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [platform, setPlatform] = useState("whatsapp");
  const [categoryId, setCategoryId] = useState("");
  const [preview, setPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (group && isOpen) {
      setTitle(group.title || "");
      setDescription(group.description || "");
      setLink(group.link || "");
      setPlatform(group.platform || "whatsapp");
      setCategoryId(group.categoryId || "");
      setPreview(group.photo || DEFAULT_PHOTO);
      setPhotoFile(null);
      setError("");
    }
  }, [group, isOpen]);

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
    };
  }, [isOpen, onClose]);

  if (!isOpen || !group) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    if (!link.trim()) {
      document.getElementById("edit-group-link")?.focus();
      return;
    }
    if (!categoryId) {
      document.getElementById("edit-group-category")?.focus();
      setError("Por favor, selecione uma categoria.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: group.id,
        title: title.trim(),
        name: title.trim(),
        description: description.trim(),
        link: link.trim(),
        platform,
        categoryId,
        photoFile,
        photoUrl: group.photo, // Pass old photo URL if not changing
      });
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao atualizar o grupo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`A foto não pode exceder 5MB. Arquivo selecionado: ${sizeInMB}MB`);
        e.target.value = "";
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result || null);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleBackdropClick}>
      <div className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            Editar Grupo
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar" disabled={isSubmitting}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <form className="modal__form" onSubmit={handleSubmit}>
          {error && (
            <div className="modal__alert modal__alert--warning" role="alert">
              <span>{error}</span>
            </div>
          )}

          <div className="modal__field">
            <label htmlFor="edit-group-title">Título do Grupo *</label>
            <input
              ref={titleRef}
              id="edit-group-title"
              type="text"
              required
              maxLength={100}
              placeholder="Ex: Grupo de Tecnologia"
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal__field">
            <label htmlFor="edit-group-description">Descrição</label>
            <textarea
              id="edit-group-description"
              rows={3}
              maxLength={300}
              placeholder="Sobre o que é o grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal__field">
            <label htmlFor="edit-group-link">Link do grupo *</label>
            <input
              id="edit-group-link"
              type="url"
              required
              placeholder="https://chat.whatsapp.com/... ou t.me/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal__field">
            <label htmlFor="edit-group-platform">Plataforma *</label>
            <select
              id="edit-group-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              required
              disabled={isSubmitting}
            >
              {GROUP_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal__field">
            <label htmlFor="edit-group-category">Categoria *</label>
            <select
              id="edit-group-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={isSubmitting}
            >
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
          </div>

          <div className="modal__field">
            <label htmlFor="edit-group-photo">Foto de capa (deixe em branco para manter a atual)</label>
            <input
              id="edit-group-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={isSubmitting}
            />
            {preview && (
              <img
                src={preview}
                alt="Prévia da capa"
                className="modal__photo-preview"
              />
            )}
          </div>

          <footer className="modal__actions">
            <button
              type="button"
              className="modal__btn modal__btn--ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal__btn modal__btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

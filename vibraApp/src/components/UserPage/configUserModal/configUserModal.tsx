import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../context/currentUserContext";


interface Changes {
  username: string;
  privacy: "public" | "private" | "followers" | "followed" | "mutuals";
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: Changes;
  onNotify: (type: "success" | "error", message: string) => void;
  userId:string | undefined;
  onUserUpdated: (updatedUser: any) => void;
}

export function ConfigUserModal({ isOpen, onClose, initialValues, onNotify,userId, onUserUpdated }: UserModalProps) {
  const [changes, setChanges] = useState<Changes>(initialValues);
  const [hasChanges, setHasChanges] = useState(false);
  const { setUser } = useContext(UserContext)!;

  useEffect(() => {
    setChanges(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const changed = JSON.stringify(changes) !== JSON.stringify(initialValues);
    setHasChanges(changed);
  }, [changes, initialValues]);

  if (!isOpen) return null;

  const handleOverlayClick = () => onClose();
  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  const handleSave = async () => {
    if (!hasChanges || !userId) return;

    try {
        const res = await fetch(`http://localhost:3000/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
        });

        if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "No se pudo actualizar el usuario");
        }
        const updatedUser = await res.json();
        setUser(updatedUser)
        onUserUpdated(updatedUser); // <── pasa el usuario actualizado al padre
        onNotify("success", "Usuario actualizado correctamente");
        onClose();
    } catch (err: any) {
        onNotify("error", err.message || "Error al actualizar el usuario");
    }
  };


  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          <h2 className="modal-title">Configuración de usuario</h2>
          <button className="modal-close-btn-user" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="input-group">
            <label className="section-subtitle">Nombre de usuario</label>
            <input
              type="text"
              maxLength={20}
              className="playlist-input"
              value={changes.username}
              onChange={(e) => setChanges({ ...changes, username: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="section-subtitle">Privacidad del perfil</label>
            <select
              className="select-user-modal"
              value={changes.privacy}
              onChange={(e) =>
                setChanges({
                  ...changes,
                  privacy: e.target.value as "public" | "private" | "followers" | "followed" | "mutuals",
                })
              }
            >
              <option value="public">Público</option>
              <option value="private">Privado</option>
              <option value="followers">Solo seguidores</option>
              <option value="followed">Solo seguidos</option>
              <option value="mutuals">Solo mutuos</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges || changes.username.trim() === ""}>
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import { useEffect, useState, useContext } from 'react';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useParams } from "react-router-dom";
import { UserContext } from '../../context/currentUserContext';
import { useMusicContext } from '../../context/MusicContext';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import { Toast } from '../Toast/Toast';
import type { ToastType } from '../Toast/Toast';
import { ConfigUserModal } from './configUserModal/configUserModal';

interface User {
  profileImage: string;
  id: string;
  username: string;
  email: string;
  followingCount: number;
  followersCount: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  duration: number;
  genre?: string;
  viewCount?: number;
  publishedAt?: Date;
  cloudinaryUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface History {
  id: string;
  youtubeId: string;
  playedAt: Date;
  song?: Song;
}

interface SongToDelete {
  id: string;
  name?: string;
}

export function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<History[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [songToDelete, setSongToDelete] = useState<SongToDelete | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canViewHistory, setCanViewHistory] = useState(true);
  const [reasonHistory, setReasonHistory] = useState<string>();

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const context = useContext(UserContext);
  if (!context) throw new Error("UserContext must be used inside a UserProvider");
  const { user } = context;

  const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
  const { playSong } = useMusicContext();

  // 🔁 Reutilizable: carga el historial
  const fetchHistory = async (userId: string) => {
    try {
      const resHistory = await fetch(`http://localhost:3000/user-history/user/${userId}`);
      if (!resHistory.ok) throw new Error('Error fetching user history');
      const historyData = await resHistory.json();
      const normalizedHistory = Array.isArray(historyData)
        ? historyData
        : Array.isArray(historyData?.data)
        ? historyData.data
        : [];
      setUserHistory(normalizedHistory);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setUserHistory([]);
    }
  };

  useEffect(() => {
  if (!userId) return;

  const fetchData = async () => {
    setIsLoading(true);

    try {
      // 1️⃣ Perfil
      const resProfile = await fetch(`http://localhost:3000/users/${userId}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!resProfile.ok) throw new Error(`Error fetching user ${userId}`);
      const profileData = await resProfile.json();
      setProfile(profileData);
      setIsFollowing(profileData.isFollowing);

      // 2️⃣ Verificación de privacidad
      const resPrivacy = await fetch(`http://localhost:3000/users/${userId}/can-access-history`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      const privacyData = await resPrivacy.json();

      // 🚫 Si no puede ver Y no es el dueño, mostramos mensaje y salimos
      if (!privacyData.canViewHistory && privacyData.reason !== 'own_profile') {
        setCanViewHistory(false);
        handlePrivacyMessage(privacyData.reason);
        setIsLoading(false);
        return;
      }

      // ✅ Puede ver el historial
      await fetchHistory(userId);
      setCanViewHistory(true);

    } catch (err) {
      setProfile(null);
      setUserHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [userId]);



  const handlePrivacyMessage = (reason: string) => {
    switch (reason) {
      case 'private':
        setReasonHistory('Este usuario tiene su historial en privado.');
        break;
      case 'not_follower':
        setReasonHistory('Solo los seguidores pueden ver su historial.');
        break;
      case 'not_followed':
        setReasonHistory('Solo quienes este usuario sigue pueden ver su historial.');
        break;
      case 'not_mutual':
        setReasonHistory('Solo los usuarios que se siguen mutuamente pueden ver su historial.');
        break;
      case 'not_found':
        setReasonHistory('El usuario no existe.');
        break;
      default:
        setReasonHistory('No tenés permiso para ver el historial.');
        break;
    }
  };

  // ✅ Eliminar y recargar historial
  const confirmDeletePlaylist = async () => {
    if (!songToDelete) return;
    setConfirmDelete(false);

    try {
      showToast('Eliminando canción...', 'loading');
      await fetch(`http://localhost:3000/user-history/${userId}/${songToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      // 🔁 Recarga inmediata
      if (userId) await fetchHistory(userId);

      showToast('Canción eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting Canción:', error);
      showToast('Error al eliminar Canción', 'error');
    } finally {
      setSongToDelete(null);
    }
  };

  // Helpers UI
  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  };

  const hideToast = () => setIsToastVisible(false);

  const handleShare = async () => {
    try {
      const urlPerfil = window.location.href;
      await navigator.clipboard.writeText(urlPerfil);
      showToast("Copiado al portapapeles", "success");
    } catch (error) {
      console.error('Error al copiar:', error);
      alert('No se pudo copiar la URL');
    }
  };

  const handleItemClick = (song: Song) => {
    playSong(song);
    setSelectedSongId(song.id || song.youtubeId);
  };

  const handleDeletePlaylist = (song: SongToDelete) => {
    setSongToDelete(song);
    setConfirmDelete(true);
  };

  const cancelDeletePlaylist = () => {
    setConfirmDelete(false);
    setSongToDelete(null);
  };

  const handleFollow = async () => {
    try {
      const targetUserId = profile!.id;
      const method = isFollowing ? "DELETE" : "POST";
      const endpoint = isFollowing
        ? `http://localhost:3000/users/${targetUserId}/unfollow`
        : `http://localhost:3000/users/${targetUserId}/follow`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followersCount: isFollowing
                ? prev.followersCount - 1
                : prev.followersCount + 1,
            }
          : prev
      );
      setIsFollowing(!isFollowing);
      showToast(data.message, "success");
    } catch (err) {
      console.error("❌ Error en handleFollow:", err);
      showToast("Error al cambiar seguimiento", "error");
    }
  };

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return <p>Perfil no encontrado.</p>;

  const isOwnProfile = user && profile.id === user.id;

  return (
    <div className="profileContainer">
      <div className="profileHeader">
        <div className="profileAvatar">
          <div className="logoPerfil">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="Imagen Perfil" />
            ) : (
              <div className="defaultAvatar">
                <FontAwesomeIcon icon={faUser} className="defaultIcon" />
              </div>
            )}
          </div>
        </div>
        <div className="profileInfo">
          <h2 className="username">{profile.username}</h2>
          <div className="followStats">
            <div className="stat">
              <p className="statLabel">Seguidos</p>
              <p className="statNumber">{profile.followingCount}</p>
            </div>
            <div className="stat">
              <p className="statLabel">Seguidores</p>
              <p className="statNumber">{profile.followersCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="profileActions">
        <button
          className="actionBtn editBtn"
          onClick={() => (isOwnProfile ? setUserModalOpen(true) : handleFollow())}
        >
          {isOwnProfile
            ? "Editar Perfil"
            : isFollowing
            ? "Dejar de seguir"
            : "Seguir"}
        </button>
        <button className="actionBtn shareBtn" onClick={handleShare}>
          <FontAwesomeIcon icon={faShare} />
        </button>
      </div>

      <div className="contentSections">
        {!canViewHistory ? (
          <p className="empty-message">
            🔒 {reasonHistory || "No tenés permiso para ver el historial."}
          </p>
        ) : (
          <div>
            <div className="section">
              <h3 className="sectionTitle">Historial</h3>
              <div className="itemsGrid">
                {userHistory.length === 0 ? (
                  <p className="empty-message">
                    🎧 Aún no escuchaste nada, ¡reproduce algo!
                  </p>
                ) : (
                  userHistory.map((item) => {
                    const isPlaying =
                      selectedSongId === (item.song?.id || item.song?.youtubeId);
                    return (
                      <div
                        key={item.id}
                        className={`item${isPlaying ? " item--playing" : ""}`}
                        onClick={() => item.song && handleItemClick(item.song)}
                        style={{ cursor: item.song ? "pointer" : "default" }}
                      >
                        <div className="itemCover">
                          <img
                            src={`https://img.youtube.com/vi/${item.song?.youtubeId}/hqdefault.jpg`}
                            alt="Cover"
                          />
                        </div>
                        <div className="song-texts">
                          <div className="song-texts-div">
                            <p
                              className="itemName"
                              title={item.song?.title || ""}
                            >
                              {item.song?.title || ""}
                            </p>
                            <p className="itemArtist">
                              {item.song?.artist || "Artista"}
                            </p>
                          </div>
                          {isOwnProfile && (
                            <button
                              className="deleteButton"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlaylist({
                                  id: item.id,
                                  name: item.song?.title,
                                });
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="section">
              <h3 className="sectionTitle">Imágenes</h3>
              <div className="itemsGrid">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="item">
                    <div className="itemCover">Portada</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        message={`¿Estás seguro de eliminar la canción "${songToDelete?.name}"?`}
        onConfirm={confirmDeletePlaylist}
        onCancel={cancelDeletePlaylist}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={isToastVisible}
        onClose={hideToast}
      />

      <ConfigUserModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        initialValues={{
          username: user?.username ?? "",
          privacy:
            (user?.privacy as
              | "public"
              | "private"
              | "followers"
              | "followed"
              | "mutuals") ?? "public",
        }}
        onNotify={(type, message) => showToast(message, type)}
        userId={user?.id}
        onUserUpdated={(updatedUser) => {
          setProfile(updatedUser);
          if (user && user.id === updatedUser.id) {
            user.username = updatedUser.username;
          }
        }}
      />
    </div>
  );
}

export default Profile;

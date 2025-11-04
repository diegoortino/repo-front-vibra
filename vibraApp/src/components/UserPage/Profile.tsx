import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import { useEffect, useState, useContext } from 'react';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useParams } from "react-router-dom";
import { UserContext } from '../../context/currentUserContext';
import { useMusicContext } from '../../context/MusicContext';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import { Toast } from '../Toast/Toast';
import type { ToastType } from '../Toast/Toast';

interface User {
  id: string;
  username: string;
  email: string;
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
interface SongToDelete{
  id:string;
  name?:string;
}

export function Profile() {
  const { userId } = useParams<{ userId: string }>(); // ID del perfil en la URL
  const [profile, setProfile] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<History[]>([]);
  const [reloadHistory, setReloadHistory] = useState<boolean>(false)
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [songToDelete, setSongToDelete] = useState<SongToDelete | null>(null);
  // Estado para toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const context = useContext(UserContext);
  if (!context) throw new Error("UserContext must be used inside a UserProvider");
  const { user } = context;

  const { playSong } = useMusicContext();
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Primera petición: perfil de usuario
        const resProfile = await fetch(`http://localhost:3000/users/${userId}`);
        if (!resProfile.ok) throw new Error(`Error fetching user ${userId}`);
        const profileData = await resProfile.json();
        setProfile(profileData);

        // Segunda petición: historial de usuario
        const resHistory = await fetch(`http://localhost:3000/user-history/user/${userId}`);
        if (!resHistory.ok) throw new Error('Error fetching user history');
        const historyData = await resHistory.json();
        setUserHistory(historyData);
      } catch (err) {
        console.error(err);
        setProfile(null);
        setUserHistory([]);
      } finally {
        setIsLoading(false); // Solo al final de ambas peticiones
      }
    };

    fetchData();
  }, [userId]);


  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      try {
        // Segunda petición: historial de usuario
        const resHistory = await fetch(`http://localhost:3000/user-history/user/${userId}`);
        if (!resHistory.ok) throw new Error('Error fetching user history');
        const historyData = await resHistory.json();
        setUserHistory(historyData);
      } catch (err) {
        console.error(err);
        setProfile(null);
        setUserHistory([]);
      } finally {
        setIsLoading(false); // Solo al final de ambas peticiones
      }
    };

    fetchHistory()
  }, [reloadHistory]);



  // Helper para mostrar toast
  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  };

  const hideToast = () => {
    setIsToastVisible(false);
  };


  const handleShare = async () => {
    try {
      const urlPerfil = window.location.href;
      await navigator.clipboard.writeText(urlPerfil);
      console.log(urlPerfil);
    } catch (error) {
      console.error('Error al copiar:', error);
      alert('No se pudo copiar la URL');
    }
  };

  const handleItemClick = (song: Song) => {
    playSong(song);
    setSelectedSongId(song.id || song.youtubeId);
  };

  const confirmDeletePlaylist = async () => {
    if (!songToDelete) return;

    setConfirmDelete(false);

    try {
      showToast('Eliminando canción...', 'loading');

      // Eliminar del backend
      await fetch(`http://localhost:3000/user-history/${userId}/${songToDelete.id}`,
        {
          method:"DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      // Recargar playlists
      setReloadHistory(!reloadHistory)

      // Mostrar toast de éxito
      showToast('Canción eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting Canción:', error);
      showToast('Error al eliminar Canción', 'error');
    } finally {
      setSongToDelete(null);
    }
  };

  const handleDeletePlaylist = (song:SongToDelete) => {
    setSongToDelete(song);
    setConfirmDelete(true);
  };

  const cancelDeletePlaylist = () => {
    setConfirmDelete(false);
    setSongToDelete(null);
  };
  
  if (isLoading) return <ProfileSkeleton />;

  if (!profile) return <p>Perfil no encontrado.</p>;

  // Mostrar botones solo si es el usuario logueado
  const isOwnProfile = user && profile.id === user.userId;

  return (
    <div className="profileContainer">
      <div className="profileHeader">
        <div className="profileAvatar">
          <div className="logoPerfil"></div>
        </div>
        <div className="profileInfo">
          <h2 className="username">{profile.username}</h2>
          <div className="followStats">
            <div className="stat">
              <p className="statLabel">Seguidos</p>
              <p className="statNumber">0</p>
            </div>
            <div className="stat">
              <p className="statLabel">Seguidores</p>
              <p className="statNumber">0</p>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <div className="profileActions">
          <button className="actionBtn editBtn">Editar Perfil</button>
          <button className="actionBtn configBtn">Configurar Cuenta</button>
          <button className="actionBtn shareBtn" onClick={handleShare}>
            <FontAwesomeIcon icon={faShare} />
          </button>
        </div>
      )}

      <div className="contentSections">
        <div className="section">
          <h3 className="sectionTitle">Historial</h3>
          <div className="itemsGrid">
            {userHistory.length === 0 ? (
              <p className="empty-message">🎧 Aún no escuchaste nada, ¡reproduce algo!</p>
            ) : (
              userHistory.map((item) => {
                const isPlaying = selectedSongId === (item.song?.id || item.song?.youtubeId);
                return (
                  <div
                    key={item.id}
                    className={`item${isPlaying ? ' item--playing' : ''}`}
                    onClick={() => item.song && handleItemClick(item.song)}
                    style={{ cursor: item.song ? 'pointer' : 'default' }}
                  >
                    <div className="itemCover">
                      <img
                        src={`https://img.youtube.com/vi/${item.song?.youtubeId}/hqdefault.jpg`}
                        alt="Cover"
                      />
                    </div>
                    <div className="song-texts">
                      <div className='song-texts-div'>
                        <p className="itemName" title={item.song?.title || ''}>
                          {item.song?.title || ''}
                        </p>
                        <p className="itemArtist">{item.song?.artist || 'Artista'}</p>
                      </div>
                      {isOwnProfile && (
                        <button
                            className="deleteButton"
                            onClick={(e) => {
                              e.stopPropagation();
                              let songToDeletePar={"id":item.id, "name":item.song?.title};
                              handleDeletePlaylist(songToDeletePar);
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

      <ConfirmModal
        isOpen={confirmDelete}
        message={`¿Estás seguro de eliminar la canción "${songToDelete?.name}"?`}
        onConfirm={confirmDeletePlaylist}
        onCancel={cancelDeletePlaylist}
      />

      {/* Toast notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={isToastVisible}
        onClose={hideToast}
      />
    </div>
  );
}

export default Profile;
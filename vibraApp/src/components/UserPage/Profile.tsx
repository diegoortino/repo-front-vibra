import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import { useEffect, useState, useContext } from 'react';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useParams } from "react-router-dom";
import { UserContext } from '../../context/currentUserContext';
import { useMusicContext } from '../../context/MusicContext';

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

export function Profile() {
  const { userId } = useParams<{ userId: string }>(); // ID del perfil en la URL
  const [profile, setProfile] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<History[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
                      <p className="itemName" title={item.song?.title || 'Nombre'}>
                        {item.song?.title || 'Nombre'}
                      </p>
                      <p className="itemArtist">{item.song?.artist || 'Artista'}</p>
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
    </div>
  );
}

export default Profile;
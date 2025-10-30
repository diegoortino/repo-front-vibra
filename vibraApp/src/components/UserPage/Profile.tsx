import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import { useEffect, useState, useContext } from 'react';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useParams } from "react-router-dom";
import { UserContext } from '../../context/currentUserContext';

interface User {
  id: string;
  username: string;
  email: string;
}

export function Profile() {
  const { userId } = useParams<{ userId: string }>(); // ID del perfil en la URL
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const context = useContext(UserContext);
  if (!context) throw new Error("UserContext must be used inside a UserProvider");
  const { user } = context;

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    fetch(`http://localhost:3000/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Error fetching user ${userId}`);
        return res.json();
      })
      .then(data => {
        setProfile(data);
      })
      .catch(err => {
        console.error(err);
        setProfile(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
            {[...Array(10)].map((_, index) => (
              <div key={index} className="item">
                <div className="itemCover">Portada</div>
                <div>
                  <p className="itemName">Nombre</p>
                  <p className="itemArtist">Artista</p>
                </div>
              </div>
            ))}
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
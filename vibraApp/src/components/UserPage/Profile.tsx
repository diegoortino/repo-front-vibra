import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import './Profile.css';
import { useEffect, useState } from 'react';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useParams } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  username: string;
  email: string;
}
interface DecodedToken {
  sub: string;      // este es el user.id
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}
export function Profile() {
  const [isLoading, setIsLoading] = useState<boolean>(true)//false mientras conectamos front y back
  const {userId} = useParams<{ userId: string }>(); // 👈 obtiene el id de la URL
  const [user,setUser]= useState<User | null>(null)
  const token = localStorage.getItem("token_vibra")

  let decoded: DecodedToken | null = null;
  if (token) {
      decoded = jwtDecode<DecodedToken>(token);
  }
  
  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:3000/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [userId]);

   const handleShare = async () => {
    try {
      // Copiar la URL completa del perfil
      const urlPerfil = window.location.href;
      
      await navigator.clipboard.writeText(urlPerfil);
      console.log(urlPerfil)
      
    } catch (error) {
      console.error('Error al copiar:', error);
      alert('No se pudo copiar la URL');
    }
  };
  return (
    <div className="profileContainer">
      {isLoading? <ProfileSkeleton/>:(
        <div>
          <div className="profileHeader">
            <div className="profileAvatar">
              <div className="logoPerfil"></div>
            </div>
            <div className="profileInfo">
              <h2 className="username">{user?.username}</h2>
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

          {/* Botones de acción */}
          {userId === decoded?.sub && (
            <div className="profileActions">
              <button className="actionBtn editBtn">Editar Perfil</button>
              <button className="actionBtn configBtn">Configurar Cuenta</button>
              <button className="actionBtn shareBtn" onClick={handleShare}>
                <FontAwesomeIcon icon={faShare}/>
              </button>
            </div>
          )}

          {/* Sección de contenido */}
          <div className="contentSections">
            {/* Historial */}
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

            {/* Imágenes */}
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
      )}
    </div>
  );
}

export default Profile;
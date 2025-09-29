import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import './Profile.css';

export function Profile() {
  return (
    <div className="profileContainer">
      <div className="profileHeader">
        <div className="profileAvatar">
          <div className="logoPerfil"></div>
        </div>
        <div className="profileInfo">
          <h2 className="username">Usuario</h2>
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
      <div className="profileActions">
        <button className="actionBtn editBtn">Editar Perfil</button>
        <button className="actionBtn configBtn">Configurar Cuenta</button>
        <button className="actionBtn shareBtn">
          <FontAwesomeIcon icon={faShare}/>
        </button>
      </div>

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
  );
}

export default Profile;
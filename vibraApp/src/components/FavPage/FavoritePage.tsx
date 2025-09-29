import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faUser, faHeart } from '@fortawesome/free-solid-svg-icons';
import './Favorites.css';

export function Favorites() {
  const suggestions = [
    { type: 'song', name: 'Summer Vibes', artist: 'DJ Sunset', plays: '2.3M' },
    { type: 'song', name: 'Midnight Dreams', artist: 'Luna Park', plays: '1.8M' },
    { type: 'song', name: 'Electric Soul', artist: 'The Waves', plays: '3.1M' },
    { type: 'song', name: 'City Lights', artist: 'Urban Echo', plays: '2.7M' },
    { type: 'song', name: 'Ocean Drive', artist: 'Coastal Breeze', plays: '1.5M' },
    { type: 'song', name: 'Neon Nights', artist: 'Cyber Sound', plays: '4.2M' },
    { type: 'artist', name: 'The Resonance', genre: 'Rock Alternativo', followers: '850K' },
    { type: 'artist', name: 'Luna Martinez', genre: 'Pop Latino', followers: '1.2M' },
    { type: 'artist', name: 'DJ Phoenix', genre: 'Electronic', followers: '620K' },
    { type: 'artist', name: 'Acoustic Dreams', genre: 'Indie Folk', followers: '450K' },
    { type: 'artist', name: 'Bass Revolution', genre: 'Hip Hop', followers: '2.1M' },
    { type: 'artist', name: 'Velvet Voices', genre: 'Jazz Soul', followers: '380K' },
  ];

  return (
    <div className="suggestionsContainer">

        {/* Playlists */}
        <div className="section">
          <h3 className="sectionTitle">Playlists</h3>
          <div className="itemsGrid">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="item">
                <div className="itemCover">Portada</div>
                <p className="itemName">Nombre</p>
              </div>
            ))}
          </div>
        </div>


      <div className="suggestionsHeader">
        <h2 className="suggestionsTitle">Descubre Nueva Música</h2>
        <p className="suggestionsSubtitle">Recomendaciones personalizadas para ti</p>
      </div>

      <div className="suggestionsGrid">
        {suggestions.map((item, index) => (
          <div key={index} className="suggestionCard">
            <div className="cardCover">
              {item.type === 'artist' ? (
                <div className="artistCover">
                  <FontAwesomeIcon icon={faUser} className="coverIcon" />
                </div>
              ) : (
                <div className="songCover">
                  <FontAwesomeIcon icon={faMusic} className="coverIcon" />
                </div>
              )}
            </div>

            <div className="cardContent">
              <h4 className="cardTitle">{item.name}</h4>
              <p className="cardSubtitle">
                {item.type === 'artist' ? item.genre : item.artist}
              </p>
              <div className="cardFooter">
                <span className="cardStats">
                  {item.type === 'artist' 
                    ? `${item.followers} seguidores` 
                    : `${item.plays} reproducciones`}
                </span>
                <button className="likeButton">
                  <FontAwesomeIcon icon={faHeart} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Favorites;
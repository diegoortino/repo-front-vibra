import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faPlay } from '@fortawesome/free-solid-svg-icons';
import './Favorites.css';
import { useEffect } from 'react';
import { FavoriteSkeleton } from './FavoriteSkeleton';
import { useMusic } from '../../hooks';
import { useMusicContext } from '../../context';
import type { Song } from '../../types';

export function Favorites() {
  // Hook para obtener canciones del backend
  const { songs, loading, error, fetchSongs } = useMusic();

  // Context para reproducir canciones
  const { playSong, loadSong } = useMusicContext();

  // Cargar canciones cuando el componente se monta
  useEffect(() => {
    // Simple: pedir 24 canciones. El backend las devuelve aleatorias automáticamente
    fetchSongs(24, 0);
  }, []);

  // Cargar la primera canción en el reproductor cuando se cargan las canciones
  useEffect(() => {
    if (songs.length > 0) {
      // Solo cargar la primera canción en el reproductor, sin reproducir
      const firstSong = songs[0];
      console.log('📀 Cargando primera canción en el reproductor:', firstSong.title);
      console.log('   Artista:', firstSong.artist);
      console.log('   YouTube ID:', firstSong.youtubeId);
      loadSong(firstSong, songs);
    }
  }, [songs, loadSong]);

  // Log de canciones cargadas para debug
  useEffect(() => {
    if (songs.length > 0) {
      console.log(`🎵 ${songs.length} canciones cargadas - Géneros únicos:`, songs.map(s => s.genre).join(', '));
    }
  }, [songs]);

  // Manejar estados de carga y error
  if (loading) {
    return (
      <div className="suggestionsContainer">
        <FavoriteSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="suggestionsContainer">
        <div className="error-message">
          <h3>Error al cargar canciones</h3>
          <p>{error}</p>
          <button onClick={() => fetchSongs(20, 0)}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestionsContainer">
      <div>
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
        </div>

        <div className="suggestionsGrid">
          {songs.map((song: Song) => (
            <div
              key={song.id}
              className="suggestionCard"
              onClick={() => playSong(song, songs)}
              style={{ cursor: 'pointer' }}
            >
              <div className="cardCover">
                <div className="songCover" style={{
                  backgroundImage: `url(https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  <div className="playOverlay">
                    <FontAwesomeIcon icon={faPlay} />
                  </div>
                </div>
              </div>

              <div className="cardContent">
                <h4 className="cardTitle">{song.title}</h4>
                <p className="cardSubtitle">{song.artist}</p>
                <div className="cardFooter">
                  <span className="cardStats">
                    {song.genre || 'Sin género'} • {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                  </span>
                  <button
                    className="likeButton"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('❤️ Favorito:', song.title);
                    }}
                  >
                    <FontAwesomeIcon icon={faHeart} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {songs.length === 0 && !loading && (
          <div className="no-songs-message">
            <p>No hay canciones disponibles. Asegúrate de que el backend esté corriendo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faPlay, faShuffle } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';
import { useMusic } from '../hooks';
import { useMusicContext } from '../context/MusicContext';
import type { Song } from '../types';
import { formatGenre } from '../utils/utilsMusic';
import '../components/FavPage/Favorites.css';

export function DiscoverMusic() {
  const { songs, loading, error, fetchRandomSongs } = useMusic();
  const { playSong, loadSong, currentSong, randomSongs, setRandomSongs, currentPlaylistId, setCurrentPlaylistId } = useMusicContext();

  // Cargar canciones aleatorias SOLO la primera vez (si no hay ninguna ya cargada)
  useEffect(() => {
    if (randomSongs.length === 0) {
      fetchRandomSongs(25);
    }
  }, []); // Sin dependencias - solo una vez al montar

  // Cuando llegan canciones del backend, guardarlas en el contexto
  useEffect(() => {
    if (songs.length > 0) {
      setRandomSongs(songs);
    }
  }, [songs, setRandomSongs]);

  // Cargar la primera canción cuando se cargan las canciones aleatorias (solo si no hay nada reproduciéndose)
  useEffect(() => {
    if (randomSongs.length > 0 && !currentSong) {
      const firstSong = randomSongs[0];
      loadSong(firstSong, randomSongs);
    }
  }, [randomSongs.length]); // Solo cuando cambia la cantidad

  // Función para generar nueva selección aleatoria
  const handleDiscoverNewMusic = () => {
    fetchRandomSongs(25);
  };

  // Función para reproducir canción aleatoria
  const handlePlayRandomSong = (song: Song) => {
    setCurrentPlaylistId("discover-music");
    playSong(song, randomSongs);
  };

  if (error) {
    return (
      <div className="suggestionsContainer">
        <div className="error-message">
          <h3>Error al cargar canciones</h3>
          <p>{error}</p>
          <button onClick={() => fetchRandomSongs(25)}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestionsContainer">
      <div>
        <div className="suggestionsHeader">
          <h2 className="suggestionsTitle">Descubre Nueva Música</h2>
          <button
            className="discoverButton"
            onClick={handleDiscoverNewMusic}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faShuffle} className="discoverButton__icon" />
            {loading ? 'Cargando...' : 'Descubre Más'}
          </button>
        </div>

        <div className="suggestionsGrid">
          {(randomSongs as Song[]).map((song) => {
            const isPlaying = currentSong?.id === song.id && currentPlaylistId === "discover-music";

            return (
              <div
                key={song.id}
                className={`suggestionCard ${isPlaying ? 'suggestionCard--playing' : ''}`}
                onClick={() => handlePlayRandomSong(song)}
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
                      {formatGenre(song.genre)} • {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                    </span>
                    <button
                      className="likeButton"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <FontAwesomeIcon icon={faHeart} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {randomSongs.length === 0 && !loading && (
          <div className="no-songs-message">
            <p>No hay canciones disponibles</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscoverMusic;

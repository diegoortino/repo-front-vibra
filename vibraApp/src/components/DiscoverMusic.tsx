import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faPlay, faShuffle } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../hooks';
import { useMusicContext } from '../context/MusicContext';
import type { Song } from '../types';
import '../components/FavPage/Favorites.css';

export function DiscoverMusic() {
  const { songs, loading, error, fetchSongs } = useMusic();
  const { playSong, loadSong, currentSong, randomSongs, setRandomSongs, currentPlaylistId, setCurrentPlaylistId } = useMusicContext();

  const isUpdatingRef = useRef(false);
  const userRequestedNewSongs = useRef(false);

  // Cargar canciones aleatorias SOLO si no hay ninguna ya cargada
  useEffect(() => {
    if (randomSongs.length === 0) {
      fetchSongs(25, 0);
    }
  }, [randomSongs.length, fetchSongs]);

  // Cuando llegan canciones del backend, guardarlas en el contexto
  useEffect(() => {
    if (songs.length > 0 && randomSongs.length === 0) {
      setRandomSongs(songs);
    }
  }, [songs, randomSongs.length, setRandomSongs]);

  // Cargar la primera canción cuando se cargan las canciones aleatorias
  useEffect(() => {
    if (randomSongs.length > 0 && !currentSong) {
      const firstSong = randomSongs[0];
      loadSong(firstSong, randomSongs);
    }
  }, [randomSongs, currentSong, loadSong]);

  // Función para generar nueva selección aleatoria
  const handleDiscoverNewMusic = () => {
    userRequestedNewSongs.current = true;
    fetchSongs(25, 0);
  };

  // Función para reproducir canción aleatoria
  const handlePlayRandomSong = (song: Song) => {
    setCurrentPlaylistId("discover-music");
    playSong(song, randomSongs);
  };

  // Cuando llegan nuevas canciones del fetch manual, actualizar el contexto
  useEffect(() => {
    if (songs.length > 0 && randomSongs.length > 0 && !isUpdatingRef.current) {
      isUpdatingRef.current = true;

      setRandomSongs(songs);

      // Solo cargar la primera canción si el usuario pidió nuevas canciones Y no hay nada reproduciéndose
      if (userRequestedNewSongs.current && !currentSong) {
        const firstSong = songs[0];
        loadSong(firstSong, songs);
        userRequestedNewSongs.current = false;
      } else if (userRequestedNewSongs.current) {
        // Si hay algo reproduciéndose, solo resetear el flag sin interrumpir
        userRequestedNewSongs.current = false;
      }

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [songs, randomSongs.length, setRandomSongs, loadSong, currentSong]);

  if (error) {
    return (
      <div className="suggestionsContainer">
        <div className="error-message">
          <h3>Error al cargar canciones</h3>
          <p>{error}</p>
          <button onClick={() => fetchSongs(24, 0)}>Reintentar</button>
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
                      {song.genre || 'Sin género'} • {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
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

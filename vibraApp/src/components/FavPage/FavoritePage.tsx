import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faPlay, faShuffle, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './Favorites.css';
import { useEffect, useRef, useState } from 'react';
import { FavoriteSkeleton } from './FavoriteSkeleton';
import { PlaylistCover } from './PlaylistCover';
import { useMusic } from '../../hooks';
import { useMusicContext } from '../../context/MusicContext';
import type { Song } from '../../types';
import { playlistsService } from '../../services/playlistsService';
import type { Playlist } from '../../services/playlistsService';

export function Favorites() {
  // Hook para obtener canciones del backend
  const { songs, loading, error, fetchSongs } = useMusic();

  // Context para reproducir canciones, obtener la canción actual y manejar canciones aleatorias
  const { playSong, loadSong, currentSong, playlist, randomSongs, setRandomSongs, currentPlaylistId, setCurrentPlaylistId } = useMusicContext();

  // Estado para playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  // Ref para evitar doble ejecución al actualizar canciones
  const isUpdatingRef = useRef(false);

  // Ref para saber si el usuario presionó "Descubre Más"
  const userRequestedNewSongs = useRef(false);

  // Ref y estado para el scroll de playlists
  const playlistsScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Cargar playlists al montar el componente
  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const data = await playlistsService.getAllPlaylists();
        // Filtrar solo playlists públicas, con género y que tengan canciones
        const genrePlaylists = data.filter(p =>
          p.isPublic &&
          !p.userId &&
          p.genre &&
          (p.songCount || 0) > 0
        );

        // El backend ya devuelve las playlists en orden aleatorio
        setPlaylists(genrePlaylists);
      } catch (error) {
        console.error('Error loading playlists:', error);
      } finally {
        setLoadingPlaylists(false);
      }
    };
    loadPlaylists();
  }, []);

  // Cargar canciones aleatorias SOLO si no hay ninguna ya cargada (primera vez)
  useEffect(() => {
    if (randomSongs.length === 0) {
      fetchSongs(24, 0);
    }
  }, [randomSongs.length, fetchSongs]);

  // Cuando llegan canciones del backend, guardarlas en el contexto global
  useEffect(() => {
    if (songs.length > 0 && randomSongs.length === 0) {
      setRandomSongs(songs);
    }
  }, [songs, randomSongs.length, setRandomSongs]);

  // Cargar la primera canción en el reproductor cuando se cargan las canciones aleatorias
  useEffect(() => {
    if (randomSongs.length > 0 && !currentSong) {
      const firstSong = randomSongs[0];
      loadSong(firstSong, randomSongs);
    }
  }, [randomSongs, currentSong, loadSong]);

  // Función para generar nueva selección aleatoria
  const handleDiscoverNewMusic = () => {
    userRequestedNewSongs.current = true;
    fetchSongs(24, 0);
  };

  // Función para reproducir playlist
  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      const playlistData = await playlistsService.getPlaylistById(playlistId);

      if (playlistData.songs && playlistData.songs.length > 0) {
        const firstSong = playlistData.songs[0];
        setCurrentPlaylistId(playlistId);
        playSong(firstSong, playlistData.songs);
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  // Función para reproducir canción aleatoria (limpia el playlist activo)
  const handlePlayRandomSong = (song: Song) => {
    // Limpiar playlist activa cuando se reproduce una canción aleatoria
    setCurrentPlaylistId(null);
    playSong(song, randomSongs);
  };

  // Función para actualizar visibilidad de flechas
  const updateArrowsVisibility = () => {
    if (!playlistsScrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = playlistsScrollRef.current;

    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Función para scroll hacia la izquierda
  const scrollLeft = () => {
    if (!playlistsScrollRef.current) return;

    playlistsScrollRef.current.scrollBy({
      left: -600,
      behavior: 'smooth'
    });
  };

  // Función para scroll hacia la derecha
  const scrollRight = () => {
    if (!playlistsScrollRef.current) return;

    playlistsScrollRef.current.scrollBy({
      left: 600,
      behavior: 'smooth'
    });
  };

  // useEffect para actualizar flechas cuando cambian las playlists
  useEffect(() => {
    updateArrowsVisibility();

    const scrollContainer = playlistsScrollRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', updateArrowsVisibility);
    window.addEventListener('resize', updateArrowsVisibility);

    return () => {
      scrollContainer.removeEventListener('scroll', updateArrowsVisibility);
      window.removeEventListener('resize', updateArrowsVisibility);
    };
  }, [playlists]);

  // Detectar si la canción actual NO pertenece a la playlist activa
  useEffect(() => {
    if (!currentSong || !currentPlaylistId) return;

    const songInCurrentPlaylist = playlist.some(song => song.id === currentSong.id);

    if (!songInCurrentPlaylist) {
      setCurrentPlaylistId(null);
    }
  }, [currentSong, playlist, currentPlaylistId]);

  // Cuando llegan nuevas canciones del fetch manual, actualizar el contexto
  useEffect(() => {
    if (songs.length > 0 && randomSongs.length > 0 && !isUpdatingRef.current) {
      isUpdatingRef.current = true;

      setRandomSongs(songs);

      // SOLO reiniciar el reproductor si el usuario presionó "Descubre Más"
      if (userRequestedNewSongs.current) {
        const firstSong = songs[0];
        loadSong(firstSong, songs);
        userRequestedNewSongs.current = false;
      }

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [songs, randomSongs.length, setRandomSongs, loadSong]);

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

          {/* Contenedor con flechas de navegación */}
          <div className="carouselContainer">
            {/* Flecha izquierda */}
            {showLeftArrow && (
              <button
                className="carouselArrow carouselArrow--left"
                onClick={scrollLeft}
                aria-label="Scroll left"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}

            {/* Grid de playlists con scroll */}
            <div className="itemsGrid" ref={playlistsScrollRef}>
            {loadingPlaylists ? (
              [...Array(10)].map((_, index) => (
                <div key={index} className="item item--loading">
                  <div className="itemCover"></div>
                  <p className="itemName"></p>
                </div>
              ))
            ) : (
              playlists.map((playlist) => {
                // Verificar si esta playlist está reproduciéndose actualmente
                const isPlayingPlaylist = currentPlaylistId === playlist.id && currentSong !== null;

                return (
                <div
                  key={playlist.id}
                  className={`playlistCard ${isPlayingPlaylist ? 'playlistCard--playing' : ''}`}
                  onClick={() => handlePlayPlaylist(playlist.id)}
                >
                  <div className="cardCover">
                    <PlaylistCover playlist={playlist} />
                    <div className="playOverlay">
                      <FontAwesomeIcon icon={faPlay} />
                    </div>
                  </div>

                  <div className="cardContent">
                    <h4 className="cardTitle">{playlist.name}</h4>
                    <p className="cardSubtitle">{playlist.genre}</p>
                    <div className="cardFooter">
                      <span className="cardStats">
                        {playlist.songCount} canciones
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
              })
            )}
            </div>

            {/* Flecha derecha */}
            {showRightArrow && (
              <button
                className="carouselArrow carouselArrow--right"
                onClick={scrollRight}
                aria-label="Scroll right"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}
          </div>
        </div>

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
            // Verificar si esta canción está reproduciéndose Y no hay playlist activa
            const isPlaying = currentSong?.id === song.id && currentPlaylistId === null;

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
            <p>No hay canciones disponibles. Asegúrate de que el backend esté corriendo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
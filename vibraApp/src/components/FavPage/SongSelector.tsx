import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import './SongSelector.css';
import type { Song } from '../../types';

interface SongSelectorProps {
  selectedSongs: Song[];
  onAddSong: (song: Song) => void;
  onRemoveSong?: (songId: string) => void;
  maxSongs?: number;
  showSearchBox?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onMaxReached?: () => void;
  onDuplicate?: () => void;
  genreFilter?: string[];
}

export function SongSelector({
  selectedSongs,
  onAddSong,
  onRemoveSong,
  maxSongs = 30,
  showSearchBox = true,
  searchTerm: externalSearchTerm,
  onSearchChange,
  onMaxReached,
  onDuplicate,
  genreFilter
}: SongSelectorProps) {
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [displayedSongs, setDisplayedSongs] = useState<Song[]>([]);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(20); // Mostrar 20 inicialmente

  // Usar searchTerm externo si se provee, sino usar el interno
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  // Cargar canciones desde el backend
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/music/songs?limit=5000');
        const data = await response.json();

        // Asegurarse de que data sea un array
        if (Array.isArray(data)) {
          setAvailableSongs(data);
          setFilteredSongs(data);
        } else {
          console.error('Response is not an array:', data);
          setAvailableSongs([]);
          setFilteredSongs([]);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
        setAvailableSongs([]);
        setFilteredSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  // Filtrar canciones basado en búsqueda y género
  useEffect(() => {
    let filtered = availableSongs;

    // Filtrar por género si hay un genreFilter activo
    if (genreFilter && genreFilter.length > 0) {
      filtered = filtered.filter(song => {
        const songGenre = (song as any).genre;
        if (!songGenre) return false;

        // Comparación case-insensitive
        const songGenreLower = songGenre.toLowerCase();
        return genreFilter.some(filterGenre => filterGenre.toLowerCase() === songGenreLower);
      });
    }

    // Filtrar por búsqueda (busca por título, artista y género)
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(song => {
        const titleMatch = song.title?.toLowerCase().includes(searchLower);
        const artistMatch = song.artist?.toLowerCase().includes(searchLower);
        const genreMatch = (song as any).genre?.toLowerCase().includes(searchLower);

        return titleMatch || artistMatch || genreMatch;
      });
    }

    setFilteredSongs(filtered);
    setDisplayCount(20); // Reset a 20 cuando cambia el filtro
  }, [searchTerm, availableSongs, genreFilter]);

  // Actualizar canciones mostradas basado en displayCount
  useEffect(() => {
    setDisplayedSongs(filteredSongs.slice(0, displayCount));
  }, [filteredSongs, displayCount]);

  // Manejar scroll para cargar más canciones
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const bottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (bottom && !loadingMore && displayedSongs.length < filteredSongs.length) {
      setLoadingMore(true);
      // Simular un pequeño delay para mejor UX
      setTimeout(() => {
        setDisplayCount(prev => prev + 20);
        setLoadingMore(false);
      }, 200);
    }
  };

  const handleAddSong = (song: Song) => {
    if (selectedSongs.length >= maxSongs) {
      if (onMaxReached) {
        onMaxReached();
      } else {
        alert(`No puedes agregar más de ${maxSongs} canciones`);
      }
      return;
    }

    if (selectedSongs.some(s => s.id === song.id)) {
      if (onDuplicate) {
        onDuplicate();
      } else {
        alert('Esta canción ya está en tu playlist');
      }
      return;
    }

    onAddSong(song);
  };

  const isSongSelected = (songId: string) => {
    return selectedSongs.some(s => s.id === songId);
  };

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
    }
  };

  return (
    <div className="song-selector">
      {/* Buscador - solo mostrar si showSearchBox es true */}
      {showSearchBox && (
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar canción o artista..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      )}

      {/* Lista de canciones */}
      <div className="songs-list" onScroll={handleScroll}>
        {loading ? (
          <div className="loading-state">
            <p>Cargando canciones...</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron canciones</p>
          </div>
        ) : (
          <>
            {displayedSongs.map((song) => {
            const isSelected = isSongSelected(song.id);

            return (
              <div
                key={song.id}
                className={`song-item ${isSelected ? 'song-item--selected' : ''}`}
              >
                {/* Miniatura de la canción */}
                <div className="song-item-thumbnail">
                  <img
                    src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
                    alt={song.title}
                    className="song-thumbnail-image"
                  />
                </div>

                <div className="song-item-info">
                  <span className="song-item-title">{song.title}</span>
                  <span className="song-item-artist">
                    {song.artist}
                    {(song as any).genre && ` • ${(song as any).genre}`}
                  </span>
                </div>
                <button
                  className="add-song-btn"
                  onClick={() => {
                    if (isSelected && onRemoveSong) {
                      onRemoveSong(song.id);
                    } else {
                      handleAddSong(song);
                    }
                  }}
                >
                  {isSelected ? (
                    <span className="added-label">Agregada</span>
                  ) : (
                    <FontAwesomeIcon icon={faPlus} />
                  )}
                </button>
              </div>
            );
          })}

          {/* Indicador de cargando más */}
          {loadingMore && (
            <div className="loading-state">
              <p>Cargando más canciones...</p>
            </div>
          )}

          {/* Mensaje cuando se muestran todas */}
          {!loadingMore && displayedSongs.length < filteredSongs.length && (
            <div className="loading-state" style={{ fontSize: '0.85rem', padding: '20px' }}>
              <p>Scroll para cargar más ({displayedSongs.length} de {filteredSongs.length})</p>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}

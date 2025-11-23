import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Song } from '../../types';
import { formatGenre } from '../../utils/utilsMusic';
import { Icons } from '../Icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SongSelectorProps {
  selectedSongs: Song[];
  onAddSong: (song: Song) => void;
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
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const BATCH_SIZE = 100; // Cargar 100 canciones por lote

  // Usar searchTerm externo si se provee, sino usar el interno
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  // Cargar canciones desde el backend - cambia según si hay filtro de género o no
  useEffect(() => {
    const fetchInitialSongs = async () => {
      try {
        setLoading(true);
        let response;

        // Si hay filtro de género, usar el endpoint de género
        if (genreFilter && genreFilter.length > 0) {
          console.log('🎵 Filtrando por género:', genreFilter[0]);
          const url = `${API_URL}/music/songs/genre/${encodeURIComponent(genreFilter[0])}?limit=1000`;
          console.log('🌐 URL:', url);
          // Cargar TODAS las canciones del género seleccionado (sin paginación)
          response = await axios.get(url);
          console.log('✅ Respuesta género:', response.data.length, 'canciones');
        } else {
          console.log('📋 Cargando canciones sin filtro');
          // Sin filtro, cargar normalmente con paginación
          response = await axios.get(`${API_URL}/music/songs?limit=${BATCH_SIZE}&offset=0`);
          console.log('✅ Respuesta sin filtro:', response.data.length, 'canciones');
        }

        const data = response.data;

        // Asegurarse de que data sea un array
        if (Array.isArray(data)) {
          setAvailableSongs(data);
          setFilteredSongs(data);
          setCurrentOffset(BATCH_SIZE);
          setHasMore(!genreFilter && data.length === BATCH_SIZE);
        } else {
          console.error('Response is not an array:', data);
          setAvailableSongs([]);
          setFilteredSongs([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
        setAvailableSongs([]);
        setFilteredSongs([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialSongs();
  }, [BATCH_SIZE, genreFilter]);

  // Filtrar canciones basado en búsqueda (el género ya se filtró en el backend)
  useEffect(() => {
    let filtered = availableSongs;

    // PRIMERO: Excluir canciones que ya están seleccionadas
    filtered = filtered.filter(song => !selectedSongs.some(s => s.id === song.id));

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
  }, [searchTerm, availableSongs, selectedSongs]);

  // Actualizar canciones mostradas basado en displayCount
  useEffect(() => {
    setDisplayedSongs(filteredSongs.slice(0, displayCount));
  }, [filteredSongs, displayCount]);

  // Manejar scroll para cargar más canciones
  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const bottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (bottom && !loadingMore) {
      // Si todavía hay canciones filtradas para mostrar, incrementar displayCount
      if (displayedSongs.length < filteredSongs.length) {
        setLoadingMore(true);
        setTimeout(() => {
          setDisplayCount(prev => prev + 20);
          setLoadingMore(false);
        }, 200);
      }
      // Si llegamos al final de las canciones filtradas y hay más en el servidor
      else if (hasMore && filteredSongs.length >= availableSongs.length - 10) {
        setLoadingMore(true);
        try {
          const response = await axios.get(`${API_URL}/music/songs?limit=${BATCH_SIZE}&offset=${currentOffset}`);
          const newSongs = response.data;

          if (Array.isArray(newSongs) && newSongs.length > 0) {
            setAvailableSongs(prev => [...prev, ...newSongs]);
            setCurrentOffset(prev => prev + BATCH_SIZE);
            setHasMore(newSongs.length === BATCH_SIZE);
          } else {
            setHasMore(false);
          }
        } catch (error) {
          console.error('Error fetching more songs:', error);
          setHasMore(false);
        } finally {
          setLoadingMore(false);
        }
      }
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
          <Icons.Search className="search-icon" />
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
            {displayedSongs.map((song) => (
              <div key={song.id} className="song-item">
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
                    {(song as any).genre && ` • ${formatGenre((song as any).genre)}`}
                  </span>
                </div>
                <button
                  className="add-song-btn"
                  onClick={() => handleAddSong(song)}
                >
                  <Icons.Plus />
                </button>
              </div>
            ))}

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

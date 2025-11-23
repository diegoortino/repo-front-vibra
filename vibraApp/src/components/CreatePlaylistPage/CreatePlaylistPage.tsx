import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SongSelector } from '../FavPage/SongSelector';
import { AlertModal } from '../AlertModal/AlertModal';
import { useMusicContext } from '../../context/MusicContext';
import { useGenres } from '../../hooks/useGenres';
import { formatGenre } from '../../utils/utilsMusic';
import type { Song, PlaylistWithSongs } from '../../types';
import { Icons } from '../Icons';

interface LocationState {
  editingPlaylist?: PlaylistWithSongs;
}

export function CreatePlaylistPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const editingPlaylist = state?.editingPlaylist;
  const { playSong } = useMusicContext();
  const { allIndividualGenres } = useGenres();

  const [playlistName, setPlaylistName] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cargar datos de edición
  useEffect(() => {
    if (editingPlaylist) {
      setPlaylistName(editingPlaylist.name);
      setSelectedSongs(editingPlaylist.songs || []);
    }
  }, [editingPlaylist]);

  // Detectar cambios no guardados
  useEffect(() => {
    const hasChanges = playlistName.trim() !== '' || selectedSongs.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [playlistName, selectedSongs]);

  // Advertir al usuario antes de cerrar la pestaña/navegador si hay cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requiere returnValue
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const showAlert = useCallback((message: string) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!playlistName.trim()) {
      showAlert('Por favor ingresa un nombre para la playlist');
      return;
    }

    if (selectedSongs.length === 0) {
      showAlert('Por favor agrega al menos una canción');
      return;
    }

    // Limitar a 30 canciones máximo
    const songsToSave = selectedSongs.slice(0, 30);

    // Mostrar alerta si se excedió el límite
    if (selectedSongs.length > 30) {
      showAlert(`Has seleccionado ${selectedSongs.length} canciones. Solo se guardarán las primeras 30.`);
    }

    // Resetear el flag de cambios no guardados antes de navegar
    setHasUnsavedChanges(false);

    // Navegar de vuelta con los datos
    navigate('/favorites', {
      state: {
        action: editingPlaylist ? 'edit' : 'create',
        playlistName,
        selectedSongs: songsToSave,
        editingPlaylistId: editingPlaylist?.id
      }
    });
  }, [playlistName, selectedSongs, editingPlaylist, navigate, showAlert]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.'
      );
      if (!confirmLeave) {
        return;
      }
    }
    navigate('/favorites');
  }, [navigate, hasUnsavedChanges]);

  const handleRemoveSong = useCallback((songId: string) => {
    setSelectedSongs(prevSongs => prevSongs.filter(song => song.id !== songId));
  }, []);

  const handleAddSong = useCallback((song: Song) => {
    // Agregar la canción al PRINCIPIO del array (más reciente arriba)
    setSelectedSongs(prevSongs => [song, ...prevSongs]);
  }, []);

  const handlePlaySong = useCallback((song: Song) => {
    // Reproducir la canción con la playlist provisional de canciones seleccionadas
    console.log('🎵 handlePlaySong - Canciones seleccionadas:', selectedSongs.length);
    console.log('🎵 Canción a reproducir:', song.title);
    console.log('🎵 Playlist completa:', selectedSongs.map(s => s.title));
    playSong(song, selectedSongs);
  }, [selectedSongs, playSong]);

  return (
    <div className="create-playlist-page">
      {/* Header */}
      <div className="playlist-header">
        <button className="back-btn" onClick={handleCancel}>
          <Icons.ArrowLeft />
          <span>Volver</span>
        </button>
        <h1 className="page-title">
          {editingPlaylist ? 'Editar Playlist' : 'Crear Nueva Playlist'}
        </h1>
        <div className="header-actions">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancelar
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!playlistName.trim() || selectedSongs.length === 0}
          >
            {editingPlaylist ? 'Guardar Cambios' : 'Crear Playlist'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="playlist-content">
        {/* Left Section - Form and Selected Songs */}
        <div className="playlist-left-section">
          {/* Form Inputs */}
          <div className="form-section">
            <input
              type="text"
              className="playlist-name-input"
              placeholder="Nombre de la Playlist"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              maxLength={30}
            />

            <input
              type="text"
              className="playlist-search-input"
              placeholder="Buscar Canciones"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Genre Filter Section - Collapsible */}
          <div className="genre-section">
            <button
              className="genre-header"
              onClick={() => setIsGenreMenuOpen(!isGenreMenuOpen)}
            >
              <h3 className="section-title">
                Filtrar por Género {selectedGenre && `(${selectedGenre})`}
              </h3>
              <span className={`genre-arrow ${isGenreMenuOpen ? 'open' : ''}`}>▼</span>
            </button>
            {isGenreMenuOpen && (
              <div className="genres-container">
                {allIndividualGenres.map((genre, index) => (
                  <button
                    key={`${genre}-${index}`}
                    className={`genre-btn ${selectedGenre === genre ? 'active' : ''}`}
                    onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                  >
                    {formatGenre(genre)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Songs Section */}
          <div className="selected-section">
            <h3 className="section-title">
              Canciones Seleccionadas ({selectedSongs.length}/30)
            </h3>
            <div className="selected-songs-container">
              {selectedSongs.map((song) => (
                <div key={song.id} className="selected-song-card">
                  <div className="song-thumbnail">
                    <img
                      src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
                      alt={song.title}
                      className="thumbnail-img"
                    />
                  </div>
                  <div className="song-details">
                    <span className="song-title">{song.title}</span>
                    <span className="song-artist">{song.artist}</span>
                  </div>
                  <button
                    className="play-btn"
                    onClick={() => handlePlaySong(song)}
                    aria-label="Reproducir canción"
                  >
                    <Icons.Play />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleRemoveSong(song.id)}
                    aria-label="Eliminar canción"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Song Suggestions */}
        <div className="playlist-right-section">
          <h3 className="section-title">Canciones Sugeridas</h3>
          <SongSelector
            selectedSongs={selectedSongs}
            onAddSong={handleAddSong}
            maxSongs={30}
            showSearchBox={false}
            searchTerm={searchTerm}
            genreFilter={selectedGenre ? [selectedGenre] : undefined}
            onMaxReached={() => showAlert('No puedes agregar más de 30 canciones')}
            onDuplicate={() => showAlert('Esta canción ya está en tu playlist')}
          />
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertOpen}
        message={alertMessage}
        onClose={() => setIsAlertOpen(false)}
      />
    </div>
  );
}

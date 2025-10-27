import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import './CreatePlaylistModal.css';
import { SongSelector } from './SongSelector';
import { AlertModal } from '../AlertModal/AlertModal';
import type { Song } from '../../types';
import type { PlaylistWithSongs } from '../../services/playlistsService';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playlistName: string, selectedSongs: Song[]) => void;
  editingPlaylist?: PlaylistWithSongs | null;
}

export function CreatePlaylistModal({ isOpen, onClose, onSave, editingPlaylist }: CreatePlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedGenreFamily, setSelectedGenreFamily] = useState<string | null>(null);

  // Familias de géneros
  const genreFamilies = [
    { id: 'metal', name: 'Metal', genres: ['Metal', 'HeavyMetal', 'HeavyMetalArgentino', 'DeathMetal', 'ThrashMetal', 'BlackMetal', 'GlamMetal', 'IndustrialMetal'] },
    { id: 'rock', name: 'Rock', genres: ['Rock', 'RockArgentino', 'Rock Nacional', 'RockLatino', 'AlternativeRock', 'IndieRock', 'SoftRock'] },
    { id: 'cumbia', name: 'Cumbia', genres: ['Cumbia', 'CumbiaVillera', 'Cumbia420', 'Cuarteto'] },
    { id: 'latin', name: 'Latin', genres: ['Reggaeton', 'Bachata', 'Salsa', 'Merengue', 'Tango', 'Bolero'] },
    { id: 'urban', name: 'Urban', genres: ['Trap', 'Hiphop', 'Rap', 'Drill', 'Reggaeton'] },
    { id: 'electronic', name: 'Electronic', genres: ['Electronic', 'Techno', 'House', 'Trance', 'Dubstep', 'DrumAndBass', 'EdmActual'] },
    { id: 'pop', name: 'Pop', genres: ['Pop', 'PopLatinoActual', 'PopLatinoClasico', 'Pop Latino', 'Pop90s', 'Alternative Pop', 'Hyperpop'] },
    { id: 'punk', name: 'Punk', genres: ['Punk', 'HardcorePunk', 'Ska'] },
    { id: 'folk', name: 'Folk', genres: ['FolkloreArgentino', 'Country', 'Bluegrass', 'Folk'] },
    { id: 'latin_traditional', name: 'Regional Mexicano', genres: ['Mariachi', 'Ranchera', 'Corrido', 'CorridosTumbados', 'Norteño'] },
    { id: 'afro_caribbean', name: 'Afro/Caribe', genres: ['Afrobeat', 'Reggae', 'Dancehall', 'SambaPagode'] },
    { id: 'soul_funk', name: 'Soul/Funk', genres: ['Soul', 'Funk', 'Rb', 'Disco'] },
    { id: 'alternative', name: 'Alternative', genres: ['Alternative', 'AlternativeRock', 'IndieRock', 'LatinIndie'] },
    { id: 'chill', name: 'Chill', genres: ['BossaNova', 'Lofi', 'Jazz', 'Blues'] }
  ];

  // Cargar datos de edición cuando se abre el modal en modo editar
  useEffect(() => {
    if (isOpen && editingPlaylist) {
      setPlaylistName(editingPlaylist.name);
      setSelectedSongs(editingPlaylist.songs || []);
    } else if (isOpen && !editingPlaylist) {
      // Modo crear - limpiar campos
      setPlaylistName('');
      setSelectedSongs([]);
    }
  }, [isOpen, editingPlaylist]);

  if (!isOpen) return null;

  const showAlert = (message: string) => {
    console.log('ShowAlert called with:', message);
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const handleSave = () => {
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

    onSave(playlistName, songsToSave);
    handleClose();
  };

  const handleClose = () => {
    setPlaylistName('');
    setSelectedSongs([]);
    onClose();
  };

  const handleRemoveSong = (songId: string) => {
    setSelectedSongs(selectedSongs.filter(song => song.id !== songId));
  };

  const handleAddSong = (song: Song) => {
    // Agregar la canción al PRINCIPIO del array (más reciente arriba)
    setSelectedSongs([song, ...selectedSongs]);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {editingPlaylist ? 'Editar Playlist' : 'Crear Nueva Playlist'}
          </h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Columna Izquierda - Formulario, buscador y canciones seleccionadas */}
          <div className="modal-left-column">
            {/* Input para nombre de playlist */}
            <input
              type="text"
              className="playlist-input"
              placeholder="Nombre de la playlist"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              maxLength={20}
            />

            {/* Input para buscar canciones */}
            <input
              type="text"
              className="playlist-input"
              placeholder="Buscar canción o artista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Lista de canciones seleccionadas */}
            {selectedSongs.length > 0 && (
              <div className="selected-songs-section">
                <h3 className="section-subtitle">Canciones Seleccionadas ({selectedSongs.length})</h3>
                <div className="selected-songs-list">
                  {selectedSongs.map((song) => (
                    <div key={song.id} className="selected-song-item">
                      {/* Miniatura de la canción */}
                      <div className="selected-song-thumbnail">
                        <img
                          src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
                          alt={song.title}
                          className="selected-thumbnail-image"
                        />
                      </div>

                      <div className="song-info">
                        <span className="song-title">{song.title}</span>
                        <span className="song-artist">{song.artist}</span>
                      </div>
                      <button
                        className="remove-song-btn"
                        onClick={() => handleRemoveSong(song.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha - Sugerencias de canciones */}
          <div className="modal-right-column">
            <h3 className="section-subtitle">Canciones Sugeridas</h3>

            {/* Botones de familias de géneros */}
            <div className="genre-families">
              <div className="genre-families-row">
                {genreFamilies.slice(0, 7).map(family => (
                  <button
                    key={family.id}
                    className={`genre-family-btn ${selectedGenreFamily === family.id ? 'active' : ''}`}
                    onClick={() => setSelectedGenreFamily(selectedGenreFamily === family.id ? null : family.id)}
                  >
                    {family.name}
                  </button>
                ))}
              </div>
              <div className="genre-families-row">
                {genreFamilies.slice(7, 14).map(family => (
                  <button
                    key={family.id}
                    className={`genre-family-btn ${selectedGenreFamily === family.id ? 'active' : ''}`}
                    onClick={() => setSelectedGenreFamily(selectedGenreFamily === family.id ? null : family.id)}
                  >
                    {family.name}
                  </button>
                ))}
              </div>
            </div>

            <SongSelector
              selectedSongs={selectedSongs}
              onAddSong={handleAddSong}
              onRemoveSong={handleRemoveSong}
              maxSongs={30}
              showSearchBox={false}
              searchTerm={searchTerm}
              genreFilter={selectedGenreFamily ? genreFamilies.find(f => f.id === selectedGenreFamily)?.genres : undefined}
              onMaxReached={() => showAlert('No puedes agregar más de 30 canciones')}
              onDuplicate={() => showAlert('Esta canción ya está en tu playlist')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!playlistName.trim() || selectedSongs.length === 0}
          >
            {editingPlaylist ? 'Guardar Cambios' : 'Guardar Playlist'}
          </button>
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

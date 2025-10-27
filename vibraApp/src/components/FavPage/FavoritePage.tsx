import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import './Favorites.css';
import { useEffect, useState } from 'react';
import { PlaylistCover } from './PlaylistCover';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import { Toast } from '../Toast/Toast';
import type { ToastType } from '../Toast/Toast';
import { useMusicContext } from '../../context/MusicContext';
import { playlistsService } from '../../services/playlistsService';
import type { Playlist, PlaylistWithSongs } from '../../services/playlistsService';
import type { Song } from '../../types';

export function Favorites() {
  // Context para reproducir playlists
  const { playSong, currentSong, currentPlaylistId, setCurrentPlaylistId } = useMusicContext();

  // Estado para playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistWithSongs | null>(null);

  // Estado para toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Estado para modal de confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  // Función para cargar playlists - Mostrar playlists de usuario + 14 públicas
  const loadPlaylists = async () => {
    try {
      setLoadingPlaylists(true);
      const data = await playlistsService.getAllPlaylists();

      // Separar playlists de usuario (sin género y no públicas)
      const userPlaylists = data.filter(p => !p.genre && !p.isPublic);

      // Separar playlists públicas (con género, públicas, con canciones)
      const publicPlaylists = data.filter(p =>
        p.isPublic &&
        p.genre &&
        (p.songCount || 0) > 0
      );

      console.log('User playlists:', userPlaylists.length);
      console.log('Public playlists:', publicPlaylists.length);

      // Mostrar: primero las de usuario, luego las 14 públicas
      const finalPlaylists = [
        ...userPlaylists,
        ...publicPlaylists.slice(0, 14)
      ];

      setPlaylists(finalPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  // Cargar playlists al montar el componente
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Helper para mostrar toast
  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  };

  const hideToast = () => {
    setIsToastVisible(false);
  };

  // Función para reproducir playlist
  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      // Desactivar el estado de "creando playlist"
      setIsCreatingPlaylist(false);

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

  // Función para abrir modal de crear playlist
  const handleCreatePlaylist = () => {
    // Activar el estado de "creando playlist" para mostrar el efecto visual
    setIsCreatingPlaylist(true);

    // Limpiar el currentPlaylistId para que las otras playlists no muestren el efecto
    setCurrentPlaylistId(null);

    // Limpiar editingPlaylist para modo crear
    setEditingPlaylist(null);

    // Abrir el modal
    setIsModalOpen(true);
  };

  // Función para abrir modal de editar playlist
  const handleEditPlaylist = async (playlist: Playlist) => {
    try {
      // Cargar la playlist completa con sus canciones
      const playlistData = await playlistsService.getPlaylistById(playlist.id);
      setEditingPlaylist(playlistData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error loading playlist for editing:', error);
      showToast('Error al cargar playlist', 'error');
    }
  };

  // Función para guardar nueva playlist o actualizar existente
  const handleSavePlaylist = async (playlistName: string, selectedSongs: Song[]) => {
    try {
      if (editingPlaylist) {
        // Modo edición
        showToast('Actualizando playlist...', 'loading');

        const songIds = selectedSongs.map(song => song.id);
        await playlistsService.updatePlaylist(editingPlaylist.id, playlistName, songIds);

        // Cerrar modal
        setIsModalOpen(false);
        setEditingPlaylist(null);

        // Recargar playlists
        await loadPlaylists();

        // Mostrar toast de éxito
        showToast('¡Playlist actualizada exitosamente!', 'success');
      } else {
        // Modo crear - Validar límite de 15 playlists
        const allPlaylists = await playlistsService.getAllPlaylists();
        const userPlaylistsCount = allPlaylists.filter(p => !p.genre && !p.isPublic).length;

        if (userPlaylistsCount >= 15) {
          showToast('Máximo 15 playlists. Elimina una para crear otra.', 'error');
          setIsCreatingPlaylist(false);
          return;
        }

        showToast('Creando playlist...', 'loading');

        // Extraer IDs de las canciones
        const songIds = selectedSongs.map(song => song.id);

        // Crear playlist en el backend
        // TODO: Obtener userId del contexto de autenticación cuando esté disponible
        // Por ahora, crear playlists sin userId (playlists anónimas/públicas)
        await playlistsService.createPlaylist(playlistName, songIds, undefined);

        // Cerrar modal
        setIsModalOpen(false);
        setIsCreatingPlaylist(false);

        // Recargar playlists
        await loadPlaylists();

        // Mostrar toast de éxito
        showToast('¡Playlist creada exitosamente!', 'success');
      }
    } catch (error) {
      console.error('Error saving playlist:', error);
      const errorMessage = editingPlaylist ? 'Error al actualizar playlist' : 'Error al crear playlist';
      showToast(errorMessage, 'error');
      setIsCreatingPlaylist(false);
    }
  };

  // Función para mostrar modal de confirmación de eliminación
  const handleDeletePlaylist = (playlist: Playlist) => {
    setPlaylistToDelete(playlist);
    setConfirmDelete(true);
  };

  // Función para confirmar eliminación
  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;

    setConfirmDelete(false);

    try {
      showToast('Eliminando playlist...', 'loading');

      // Eliminar del backend
      await playlistsService.deletePlaylist(playlistToDelete.id);

      // Recargar playlists
      await loadPlaylists();

      // Mostrar toast de éxito
      showToast('Playlist eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast('Error al eliminar playlist', 'error');
    } finally {
      setPlaylistToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const cancelDeletePlaylist = () => {
    setConfirmDelete(false);
    setPlaylistToDelete(null);
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsCreatingPlaylist(false);
  };

  return (
    <>
      <div className="suggestionsContainer">
        <div>
          {/* Playlists */}
          <div className="section">
            <h3 className="sectionTitle">Playlists</h3>

            {/* Grid de playlists */}
            <div className="playlistsGrid">
              {loadingPlaylists ? (
                [...Array(15)].map((_, index) => (
                  <div key={index} className="item item--loading">
                    <div className="itemCover"></div>
                    <p className="itemName"></p>
                  </div>
                ))
              ) : (
                <>
                  {/* Card para crear nueva playlist - siempre primera */}
                  <div
                    className={`playlistCard createPlaylistCard ${isCreatingPlaylist ? 'playlistCard--playing' : ''}`}
                    onClick={handleCreatePlaylist}
                  >
                    <div className="cardCover">
                      <div className="createPlaylistCover">
                        <FontAwesomeIcon icon={faPlus} className="createPlaylistIcon" />
                      </div>
                    </div>
                    <div className="cardContent">
                      <h4 className="cardTitle">Crear Playlist</h4>
                    </div>
                  </div>

                  {/* Playlists existentes */}
                  {playlists.map((playlist) => {
                    // Verificar si esta playlist está reproduciéndose actualmente
                    const isPlayingPlaylist = currentPlaylistId === playlist.id && currentSong !== null;

                    // Verificar si es una playlist del usuario (sin género y no pública)
                    const isUserPlaylist = !playlist.genre && !playlist.isPublic;

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
                        <div className="titleRow">
                          {/* Botón Editar */}
                          {isUserPlaylist && (
                            <button
                              className="editButton"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPlaylist(playlist);
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          )}

                          {/* Título de la playlist */}
                          <h4 className="cardTitle">{playlist.name}</h4>

                          {/* Botón Eliminar */}
                          {isUserPlaylist && (
                            <button
                              className="deleteButton"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlaylist(playlist);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar playlist */}
      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePlaylist}
        editingPlaylist={editingPlaylist}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={confirmDelete}
        message={`¿Estás seguro de eliminar la playlist "${playlistToDelete?.name}"?`}
        onConfirm={confirmDeletePlaylist}
        onCancel={cancelDeletePlaylist}
      />

      {/* Toast notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={isToastVisible}
        onClose={hideToast}
      />
    </>
  );
}

export default Favorites;
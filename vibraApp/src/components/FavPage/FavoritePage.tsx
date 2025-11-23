import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlaylistCover } from './PlaylistCover';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import { Toast } from '../Toast/Toast';
import type { ToastType } from '../Toast/Toast';
import { useMusicContext } from '../../context/MusicContext';
import { UserContext } from '../../context/currentUserContext';
import { playlistService } from '../../services/playlistService';
import type { Playlist, PlaylistWithSongs, Song } from '../../types';
import { Icons } from '../Icons';

export function Favorites() {
  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Context para reproducir playlists
  const { playSong, currentSong, currentPlaylistId, setCurrentPlaylistId } = useMusicContext();

  // Context para obtener el usuario actual
  const userContext = useContext(UserContext);
  const userId = userContext?.user?.id;

  // Estado para playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Estado para toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Estado para modal de confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  // Ref para controlar race condition en la creación/edición de playlists
  const isProcessingPlaylistAction = useRef(false);

  // Función para cargar playlists - Mostrar playlists de usuario + 14 públicas
  const loadPlaylists = useCallback(async () => {
    try {
      setLoadingPlaylists(true);

      // Cargar playlists del usuario (si está autenticado) y playlists públicas
      const [userPlaylists, publicPlaylists] = await Promise.all([
        // Playlists privadas del usuario actual
        userId
          ? playlistService.getUserPlaylists(userId)
          : Promise.resolve([]),
        // Playlists públicas (máximo 14)
        playlistService.getPublicPlaylists()
      ]);

      console.log('User playlists:', userPlaylists.length);
      console.log('Public playlists:', publicPlaylists.length);

      // Filtrar playlists públicas con canciones y género
      const filteredPublicPlaylists = publicPlaylists.filter(p =>
        p.genre && (p.songCount || 0) > 0
      );

      // Mostrar: primero las de usuario, luego las 14 públicas
      const finalPlaylists = [
        ...userPlaylists,
        ...filteredPublicPlaylists.slice(0, 14)
      ];

      setPlaylists(finalPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [userId]);

  // Helper para mostrar toast
  const showToast = useCallback((message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setIsToastVisible(false);
  }, []);

  // Cargar playlists al montar el componente
  useEffect(() => {
    window.scrollTo(0, 0);
    loadPlaylists();
  }, [loadPlaylists]);

  // Manejar retorno desde la página de crear/editar playlist
  useEffect(() => {
    const handleReturnFromPlaylistPage = async () => {
      const state = location.state as any;

      // Prevenir race condition - si ya se está procesando, salir
      if (isProcessingPlaylistAction.current) {
        return;
      }

      if (state?.action === 'create') {
        isProcessingPlaylistAction.current = true;
        try {
          // Validar límite de 15 playlists
          if (userId) {
            const userPlaylists = await playlistService.getUserPlaylists(userId);

            if (userPlaylists.length >= 15) {
              showToast('Máximo 15 playlists. Elimina una para crear otra.', 'error');
              navigate('/favorites', { replace: true, state: {} });
              return;
            }
          }

          showToast('Creando playlist...', 'loading');

          const songIds = state.selectedSongs.map((song: Song) => song.id);
          await playlistService.createPlaylistWithSongs(state.playlistName, songIds, userId);

          await loadPlaylists();
          showToast('¡Playlist creada exitosamente!', 'success');

          // Limpiar el state
          navigate('/favorites', { replace: true, state: {} });
        } catch (error) {
          console.error('Error creating playlist:', error);
          showToast('Error al crear playlist', 'error');
          navigate('/favorites', { replace: true, state: {} });
        } finally {
          isProcessingPlaylistAction.current = false;
        }
      } else if (state?.action === 'edit') {
        isProcessingPlaylistAction.current = true;
        try {
          showToast('Actualizando playlist...', 'loading');

          const songIds = state.selectedSongs.map((song: Song) => song.id);
          await playlistService.updatePlaylistWithSongs(state.editingPlaylistId, state.playlistName, songIds);

          await loadPlaylists();
          showToast('¡Playlist actualizada exitosamente!', 'success');

          // Limpiar el state
          navigate('/favorites', { replace: true, state: {} });
        } catch (error) {
          console.error('Error updating playlist:', error);
          showToast('Error al actualizar playlist', 'error');
          navigate('/favorites', { replace: true, state: {} });
        } finally {
          isProcessingPlaylistAction.current = false;
        }
      }
    };

    handleReturnFromPlaylistPage();
  }, [location.state, userId, navigate, showToast, loadPlaylists]);

  // Función para reproducir playlist
  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      console.log('🎵 Intentando reproducir playlist:', playlistId);
      // Desactivar el estado de "creando playlist"
      setIsCreatingPlaylist(false);

      const playlistData = await playlistService.getPlaylistWithSongs(playlistId);
      console.log('📋 Playlist data:', playlistData);
      console.log('🎶 Canciones en playlist:', playlistData.songs?.length || 0);

      if (playlistData.songs && playlistData.songs.length > 0) {
        // Extraer objetos de canciones anidadas (estructura: { song: { title, artist, ... } })
        const songs = playlistData.songs.map((item: any) => item.song || item);
        const firstSong = songs[0];
        console.log('▶️ Primera canción:', firstSong.title);
        setCurrentPlaylistId(playlistId);
        playSong(firstSong, songs);
      } else {
        console.warn('⚠️ Playlist sin canciones');
      }
    } catch (error) {
      console.error('❌ Error playing playlist:', error);
    }
  };

  // Función para navegar a crear playlist
  const handleCreatePlaylist = () => {
    navigate('/favorites/create-playlist');
  };

  // Función para navegar a editar playlist
  const handleEditPlaylist = async (playlist: Playlist) => {
    try {
      // Cargar la playlist completa con sus canciones
      const playlistData = await playlistService.getPlaylistWithSongs(playlist.id);
      navigate('/favorites/create-playlist', {
        state: { editingPlaylist: playlistData }
      });
    } catch (error) {
      console.error('Error loading playlist for editing:', error);
      showToast('Error al cargar playlist', 'error');
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
      await playlistService.deletePlaylist(playlistToDelete.id);

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
                  {/* Sección: Mis Playlists */}
                  {userId && (
                    <>
                      <div className="playlistSectionHeader">
                        <h4 className="playlistSectionTitle">Mis Playlists</h4>
                      </div>

                      {/* Card para crear nueva playlist */}
                      <div
                        className={`playlistCard createPlaylistCard ${isCreatingPlaylist ? 'playlistCard--playing' : ''}`}
                        onClick={handleCreatePlaylist}
                      >
                        <div className="cardCover">
                          <div className="createPlaylistCover">
                            <Icons.Plus className="createPlaylistIcon" />
                          </div>
                        </div>
                        <div className="cardContent">
                          <h4 className="cardTitle">Crear Playlist</h4>
                        </div>
                      </div>

                      {/* Playlists del usuario */}
                      {playlists
                        .filter(p => !p.isPublic && p.userId === userId)
                        .map((playlist) => {
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
                                  <Icons.Play />
                                </div>
                              </div>

                              <div className="cardContent">
                                <div className="titleRow">
                                  <button
                                    className="editButton"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditPlaylist(playlist);
                                    }}
                                  >
                                    <Icons.Edit />
                                  </button>

                                  <h4 className="cardTitle">{playlist.name}</h4>

                                  <button
                                    className="deleteButton"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePlaylist(playlist);
                                    }}
                                  >
                                    <Icons.Trash />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {/* Línea divisoria */}
                      <div className="playlistDivider"></div>
                    </>
                  )}

                  {/* Sección: Playlists Sugeridas */}
                  <div className="playlistSectionHeader">
                    <h4 className="playlistSectionTitle">Playlists Sugeridas</h4>
                  </div>

                  {/* Playlists públicas */}
                  {playlists
                    .filter(p => p.isPublic)
                    .map((playlist) => {
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
                              <Icons.Play />
                            </div>
                          </div>

                          <div className="cardContent">
                            <div className="titleRow">
                              <h4 className="cardTitle">{playlist.name}</h4>
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

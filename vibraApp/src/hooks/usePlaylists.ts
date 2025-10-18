/**
 * Hook personalizado para playlists
 *
 * Proporciona funciones y estado para cargar, crear y gestionar playlists.
 * Usa el playlistService y maneja automáticamente loading/error.
 */

import { useState, useCallback } from 'react';
import { playlistService } from '../services';
import { getErrorMessage } from '../utils/errorHandler';
import type { Playlist, PlaylistWithSongs, Song } from '../types';

/**
 * Estado del hook usePlaylists
 */
interface UsePlaylistsState {
  playlists: Playlist[];
  currentPlaylist: PlaylistWithSongs | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para gestionar playlists
 *
 * @returns Estado y funciones para gestionar playlists
 *
 * @example
 * ```typescript
 * const { playlists, loading, fetchPlaylists } = usePlaylists();
 *
 * useEffect(() => {
 *   fetchPlaylists();
 * }, []);
 * ```
 */
export function usePlaylists() {
  const [state, setState] = useState<UsePlaylistsState>({
    playlists: [],
    currentPlaylist: null,
    loading: false,
    error: null,
  });

  /**
   * Obtener todas las playlists
   */
  const fetchPlaylists = useCallback(async (filters?: { userId?: string; isPublic?: boolean }) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const playlists = await playlistService.getAllPlaylists(filters);
      setState((prev) => ({
        ...prev,
        playlists,
        loading: false,
        error: null,
      }));
      return playlists;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Obtener una playlist por ID
   */
  const fetchPlaylistById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const playlist = await playlistService.getPlaylistById(id);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
      return playlist;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Obtener playlist completa con canciones
   */
  const fetchPlaylistWithSongs = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const playlist = await playlistService.getPlaylistWithSongs(id);
      setState((prev) => ({
        ...prev,
        currentPlaylist: playlist,
        loading: false,
        error: null,
      }));
      return playlist;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Crear una nueva playlist
   */
  const createPlaylist = useCallback(
    async (playlistData: {
      name: string;
      description?: string;
      isPublic?: boolean;
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const newPlaylist = await playlistService.createPlaylist(playlistData);
        setState((prev) => ({
          ...prev,
          playlists: [...prev.playlists, newPlaylist],
          loading: false,
          error: null,
        }));
        return newPlaylist;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Actualizar una playlist
   */
  const updatePlaylist = useCallback(
    async (
      id: string,
      updates: {
        name?: string;
        description?: string;
        isPublic?: boolean;
      }
    ) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const updatedPlaylist = await playlistService.updatePlaylist(id, updates);
        setState((prev) => ({
          ...prev,
          playlists: prev.playlists.map((p) =>
            p.id === id ? updatedPlaylist : p
          ),
          loading: false,
          error: null,
        }));
        return updatedPlaylist;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Eliminar una playlist
   */
  const deletePlaylist = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await playlistService.deletePlaylist(id);
      setState((prev) => ({
        ...prev,
        playlists: prev.playlists.filter((p) => p.id !== id),
        loading: false,
        error: null,
      }));
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Agregar canción a playlist
   */
  const addSongToPlaylist = useCallback(
    async (playlistId: string, songId: string, position?: number) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await playlistService.addSongToPlaylist(playlistId, {
          songId,
          position,
        });
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
        }));
        return response;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Quitar canción de playlist
   */
  const removeSongFromPlaylist = useCallback(
    async (playlistId: string, songId: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await playlistService.removeSongFromPlaylist(
          playlistId,
          songId
        );

        // Actualizar currentPlaylist si está cargada
        if (state.currentPlaylist?.id === playlistId) {
          setState((prev) => ({
            ...prev,
            currentPlaylist: prev.currentPlaylist
              ? {
                  ...prev.currentPlaylist,
                  songs: prev.currentPlaylist.songs.filter(
                    (s) => s.id !== songId
                  ),
                }
              : null,
            loading: false,
            error: null,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: null,
          }));
        }

        return response;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    [state.currentPlaylist]
  );

  /**
   * Duplicar una playlist
   */
  const duplicatePlaylist = useCallback(
    async (playlistId: string, newName: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const newPlaylist = await playlistService.duplicatePlaylist(
          playlistId,
          newName
        );
        setState((prev) => ({
          ...prev,
          playlists: [...prev.playlists, newPlaylist],
          loading: false,
          error: null,
        }));
        return newPlaylist;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Obtener playlists públicas
   */
  const fetchPublicPlaylists = useCallback(async () => {
    return fetchPlaylists({ isPublic: true });
  }, [fetchPlaylists]);

  /**
   * Obtener playlists de un usuario
   */
  const fetchUserPlaylists = useCallback(
    async (userId: string) => {
      return fetchPlaylists({ userId });
    },
    [fetchPlaylists]
  );

  /**
   * Resetear estado
   */
  const reset = useCallback(() => {
    setState({
      playlists: [],
      currentPlaylist: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    // Estado
    playlists: state.playlists,
    currentPlaylist: state.currentPlaylist,
    loading: state.loading,
    error: state.error,

    // Funciones
    fetchPlaylists,
    fetchPlaylistById,
    fetchPlaylistWithSongs,
    fetchPublicPlaylists,
    fetchUserPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    duplicatePlaylist,
    reset,
  };
}

export default usePlaylists;

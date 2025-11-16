/**
 * Hook personalizado para música
 *
 * Proporciona funciones y estado para cargar, buscar y gestionar canciones.
 * Usa el musicService y maneja automáticamente loading/error.
 */

import { useState, useCallback } from 'react';
import { musicService } from '../services';
import { getErrorMessage } from '../utils/errorHandler';
import { normalizeToSong } from '../utils/utilsMusic';
import type { Song } from '../types';

/**
 * Estado del hook useMusic
 */
interface UseMusicState {
  songs: Song[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

/**
 * Hook para gestionar música
 *
 * @returns Estado y funciones para gestionar canciones
 *
 * @example
 * ```typescript
 * const { songs, loading, error, fetchSongs } = useMusic();
 *
 * useEffect(() => {
 *   fetchSongs(20, 0);
 * }, []);
 * ```
 */
export function useMusic() {
  const [state, setState] = useState<UseMusicState>({
    songs: [],
    loading: false,
    error: null,
    totalCount: 0,
  });

  /**
   * Obtener todas las canciones con paginación
   */
  const fetchSongs = useCallback(async (limit = 50, offset = 0) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const songs = await musicService.getAllSongs(limit, offset);
      setState({
        songs,
        loading: false,
        error: null,
        totalCount: songs.length,
      });
      return songs;
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
   * Obtener canciones ALEATORIAS (para "Descubre Nueva Música")
   */
  const fetchRandomSongs = useCallback(async (limit = 25) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const songs = await musicService.getRandomSongs(limit);
      setState({
        songs,
        loading: false,
        error: null,
        totalCount: songs.length,
      });
      return songs;
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
   * Obtener una canción por ID
   */
  const fetchSongById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const song = await musicService.getSongById(id);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
      return song;
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
   * Obtener canciones por género
   */
  const fetchByGenre = useCallback(async (genre: string, limit = 20) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const songs = await musicService.getSongsByGenre(genre, limit);
      setState({
        songs,
        loading: false,
        error: null,
        totalCount: songs.length,
      });
      return songs;
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
   * Obtener canciones por artista
   */
  const fetchByArtist = useCallback(async (artist: string, limit = 20) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const songs = await musicService.getSongsByArtist(artist, limit);
      setState({
        songs,
        loading: false,
        error: null,
        totalCount: songs.length,
      });
      return songs;
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
   * Buscar canciones en YouTube
   */
  const searchYouTube = useCallback(async (query: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const results = await musicService.searchYouTube(query);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
      return results;
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
   * Búsqueda inteligente (BD + YouTube)
   */
  const searchSmart = useCallback(async (query: string, maxResults: number = 20) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const results = await musicService.searchSmart(query, maxResults);
      const normalizedSongs = normalizeToSong(results);

      setState({
        songs: normalizedSongs,
        loading: false,
        error: null,
        totalCount: results.total,
      });

      return normalizedSongs;
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
   * Crear una nueva canción
   */
  const createSong = useCallback(
    async (songData: {
      title: string;
      artist: string;
      youtubeId: string;
      duration: number;
      genre?: string;
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const newSong = await musicService.createSong(songData);
        setState((prev) => ({
          ...prev,
          songs: [...prev.songs, newSong],
          loading: false,
          error: null,
        }));
        return newSong;
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
   * Registrar reproducción de una canción
   */
  const playSong = useCallback(async (id: string) => {
    try {
      const response = await musicService.playSong(id);
      return response;
    } catch (err) {
      console.error('Error al reproducir canción:', err);
      throw err;
    }
  }, []);

  /**
   * Eliminar una canción
   */
  const deleteSong = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await musicService.deleteSong(id);
      setState((prev) => ({
        ...prev,
        songs: prev.songs.filter((song) => song.id !== id),
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
   * Obtener conteo total de canciones
   */
  const fetchTotalCount = useCallback(async () => {
    try {
      const total = await musicService.getTotalCount();
      setState((prev) => ({
        ...prev,
        totalCount: total,
      }));
      return total;
    } catch (err) {
      console.error('Error al obtener conteo:', err);
      throw err;
    }
  }, []);

  /**
   * Resetear estado
   */
  const reset = useCallback(() => {
    setState({
      songs: [],
      loading: false,
      error: null,
      totalCount: 0,
    });
  }, []);

  return {
    // Estado
    songs: state.songs,
    loading: state.loading,
    error: state.error,
    totalCount: state.totalCount,

    // Funciones
    fetchSongs,
    fetchRandomSongs,
    fetchSongById,
    fetchByGenre,
    fetchByArtist,
    searchYouTube,
    searchSmart,
    createSong,
    playSong,
    deleteSong,
    fetchTotalCount,
    reset,
  };
}

export default useMusic;

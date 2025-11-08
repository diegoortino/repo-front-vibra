/**
 * Servicio de Música
 *
 * Este servicio encapsula todas las llamadas HTTP relacionadas con música.
 * Usa la instancia de Axios configurada y los tipos TypeScript definidos.
 *
 * Endpoints del backend: /music/*
 */

import { apiClient } from './api/axiosInstance';
import type {
  Song,
  YouTubeSearchResult,
  SearchParams,
  CreateSongDto,
  UpdateSongDto,
  SmartSearchResponse,
  PlaySongResponse,
  CountResponse,
} from '../types';

/**
 * Servicio de música con todos los métodos disponibles
 */
export const musicService = {
  /**
   * GET /music/songs
   * Obtener lista de canciones con paginación
   *
   * @param limit - Cantidad de canciones (default: 50)
   * @param offset - Desde qué canción empezar (default: 0)
   * @returns Promise con array de canciones
   */
  getAllSongs: async (limit = 50, offset = 0): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/music/songs', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * GET /music/songs/count
   * Obtener el total de canciones en la base de datos
   *
   * @returns Promise con el conteo total
   */
  getTotalCount: async (): Promise<number> => {
    const response = await apiClient.get<CountResponse>('/music/songs/count');
    return response.data.total;
  },

  /**
   * GET /music/songs/:id
   * Obtener una canción específica por ID
   *
   * @param id - UUID de la canción
   * @returns Promise con la canción
   */
  getSongById: async (id: string): Promise<Song> => {
    const response = await apiClient.get<Song>(`/music/songs/${id}`);
    return response.data;
  },

  /**
   * GET /music/songs/genre/:genre
   * Obtener canciones filtradas por género
   *
   * @param genre - Género musical (Rock, Pop, Electronic, etc.)
   * @param limit - Cantidad de resultados (default: 20)
   * @returns Promise con array de canciones del género
   */
  getSongsByGenre: async (genre: string, limit = 20): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>(
      `/music/songs/genre/${encodeURIComponent(genre)}`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * GET /music/songs/artist/:artist
   * Obtener canciones filtradas por artista
   *
   * @param artist - Nombre del artista
   * @param limit - Cantidad de resultados (default: 20)
   * @returns Promise con array de canciones del artista
   */
  getSongsByArtist: async (artist: string, limit = 20): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>(
      `/music/songs/artist/${encodeURIComponent(artist)}`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * GET /music/search
   * Buscar canciones en YouTube (no guarda en BD)
   *
   * @param query - Término de búsqueda
   * @returns Promise con resultados de YouTube
   */
  searchYouTube: async (query: string): Promise<YouTubeSearchResult[]> => {
    const response = await apiClient.get<YouTubeSearchResult[]>('/music/search', {
      params: { query },
    });
    return response.data;
  },

  /**
   * GET /music/search-optimized
   * Búsqueda optimizada con caché
   *
   * @param query - Término de búsqueda
   * @returns Promise con resultados optimizados
   */
  searchOptimized: async (query: string): Promise<YouTubeSearchResult[]> => {
    const response = await apiClient.get<YouTubeSearchResult[]>(
      '/music/search-optimized',
      { params: { query } }
    );
    return response.data;
  },

  /**
   * GET /music/search-smart
   * Búsqueda inteligente (primero BD, luego YouTube)
   *
   * @param query - Término de búsqueda
   * @param maxResults - Cantidad máxima de resultados (default: 20)
   * @returns Promise con resultados combinados de BD y YouTube
   */
  searchSmart: async (query: string, maxResults: number = 20): Promise<SmartSearchResponse> => {
    const response = await apiClient.get<SmartSearchResponse>(
      '/music/search-smart',
      { params: { query, maxResults } }
    );
    return response.data;
  },

  /**
   * POST /music/songs
   * Crear una nueva canción en la base de datos
   *
   * @param songData - Datos de la canción a crear
   * @returns Promise con la canción creada
   */
  createSong: async (songData: CreateSongDto): Promise<Song> => {
    const response = await apiClient.post<Song>('/music/songs', songData);
    return response.data;
  },

  /**
   * POST /music/save-from-youtube
   * Guardar una canción desde YouTube
   *
   * @param youtubeId - ID del video de YouTube
   * @returns Promise con la canción guardada
   */
  saveFromYouTube: async (youtubeId: string): Promise<Song> => {
    const response = await apiClient.post<Song>('/music/save-from-youtube', {
      youtubeId,
    });
    return response.data;
  },

  /**
   * POST /music/play/:id
   * Registrar reproducción de una canción
   *
   * @param id - UUID de la canción
   * @returns Promise con respuesta de reproducción
   */
  playSong: async (id: string): Promise<PlaySongResponse> => {
    const response = await apiClient.post<PlaySongResponse>(`/music/play/${id}`);
    return response.data;
  },

  /**
   * PUT /music/songs/:id
   * Actualizar una canción existente
   *
   * @param id - UUID de la canción
   * @param updates - Datos a actualizar
   * @returns Promise con la canción actualizada
   */
  updateSong: async (id: string, updates: UpdateSongDto): Promise<Song> => {
    const response = await apiClient.put<Song>(`/music/songs/${id}`, updates);
    return response.data;
  },

  /**
   * DELETE /music/songs/:id
   * Eliminar una canción
   *
   * @param id - UUID de la canción
   * @returns Promise que resuelve cuando se elimina
   */
  deleteSong: async (id: string): Promise<void> => {
    await apiClient.delete(`/music/songs/${id}`);
  },

  /**
   * Método auxiliar: Buscar con parámetros personalizados
   *
   * @param params - Parámetros de búsqueda
   * @returns Promise con canciones filtradas
   */
  searchWithParams: async (params: SearchParams): Promise<Song[]> => {
    const response = await apiClient.get<Song[]>('/music/songs', { params });
    return response.data;
  },
};

/**
 * Exportar servicio por defecto
 */
export default musicService;

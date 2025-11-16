/**
 * Servicio de Playlists
 *
 * Este servicio encapsula todas las llamadas HTTP relacionadas con playlists.
 * Usa la instancia de Axios configurada y los tipos TypeScript definidos.
 *
 * Endpoints del backend: /playlists/*
 */

import { apiClient } from './api/axiosInstance';
import type {
  Playlist,
  PlaylistWithSongs,
  Song,
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddSongToPlaylistDto,
  ReorderPlaylistSongsDto,
  AddSongResponse,
  RemoveSongResponse,
  PlaylistFilterParams,
} from '../types';

/**
 * Servicio de playlists con todos los métodos disponibles
 */
export const playlistService = {
  /**
   * GET /playlists
   * Obtener todas las playlists
   *
   * @param params - Parámetros de filtrado (opcional)
   * @returns Promise con array de playlists
   */
  getAllPlaylists: async (params?: PlaylistFilterParams): Promise<Playlist[]> => {
    const response = await apiClient.get<Playlist[]>('/playlists', { params });
    return response.data;
  },

  /**
   * GET /playlists/:id
   * Obtener una playlist específica por ID
   *
   * @param id - UUID de la playlist
   * @returns Promise con la playlist
   */
  getPlaylistById: async (id: string): Promise<Playlist> => {
    const response = await apiClient.get<Playlist>(`/playlists/${id}`);
    return response.data;
  },

  /**
   * GET /playlists/:id/songs
   * Obtener todas las canciones de una playlist
   *
   * @param id - UUID de la playlist
   * @returns Promise con array de canciones
   */
  getPlaylistSongs: async (id: string): Promise<Song[]> => {
    const response = await apiClient.get<any[]>(`/playlists/${id}/songs`);
    // El backend devuelve PlaylistSong[] con la canción anidada en el campo 'song'
    // Extraer solo las canciones del array
    return response.data.map((playlistSong: any) => playlistSong.song);
  },

  /**
   * GET /playlists/:id (con canciones incluidas)
   * Obtener playlist completa con todas sus canciones
   *
   * @param id - UUID de la playlist
   * @returns Promise con playlist y canciones
   */
  getPlaylistWithSongs: async (id: string): Promise<PlaylistWithSongs> => {
    // Hacer ambas peticiones en paralelo
    const [playlist, songs] = await Promise.all([
      playlistService.getPlaylistById(id),
      playlistService.getPlaylistSongs(id),
    ]);

    return {
      ...playlist,
      songs,
    };
  },

  /**
   * POST /playlists
   * Crear una nueva playlist
   *
   * @param playlistData - Datos de la playlist a crear
   * @returns Promise con la playlist creada
   */
  createPlaylist: async (playlistData: CreatePlaylistDto): Promise<Playlist> => {
    const response = await apiClient.post<Playlist>('/playlists', playlistData);
    return response.data;
  },

  /**
   * PUT /playlists/:id
   * Actualizar una playlist existente
   *
   * @param id - UUID de la playlist
   * @param updates - Datos a actualizar
   * @returns Promise con la playlist actualizada
   */
  updatePlaylist: async (
    id: string,
    updates: UpdatePlaylistDto
  ): Promise<Playlist> => {
    const response = await apiClient.put<Playlist>(`/playlists/${id}`, updates);
    return response.data;
  },

  /**
   * DELETE /playlists/:id
   * Eliminar una playlist
   *
   * @param id - UUID de la playlist
   * @returns Promise que resuelve cuando se elimina
   */
  deletePlaylist: async (id: string): Promise<void> => {
    await apiClient.delete(`/playlists/${id}`);
  },

  /**
   * POST /playlists/:id/songs
   * Agregar una canción a una playlist
   *
   * @param playlistId - UUID de la playlist
   * @param songData - Datos de la canción a agregar
   * @returns Promise con respuesta de éxito
   */
  addSongToPlaylist: async (
    playlistId: string,
    songData: AddSongToPlaylistDto
  ): Promise<AddSongResponse> => {
    const response = await apiClient.post<AddSongResponse>(
      `/playlists/${playlistId}/songs`,
      songData
    );
    return response.data;
  },

  /**
   * DELETE /playlists/:id/songs/:songId
   * Quitar una canción de una playlist
   *
   * @param playlistId - UUID de la playlist
   * @param songId - UUID de la canción a quitar
   * @returns Promise con respuesta de éxito
   */
  removeSongFromPlaylist: async (
    playlistId: string,
    songId: string
  ): Promise<RemoveSongResponse> => {
    const response = await apiClient.delete<RemoveSongResponse>(
      `/playlists/${playlistId}/songs/${songId}`
    );
    return response.data;
  },

  /**
   * PATCH /playlists/:id/songs/reorder
   * Reordenar canciones en una playlist
   *
   * @param playlistId - UUID de la playlist
   * @param reorderData - Datos de reordenamiento
   * @returns Promise con la playlist actualizada
   */
  reorderPlaylistSongs: async (
    playlistId: string,
    reorderData: ReorderPlaylistSongsDto
  ): Promise<Playlist> => {
    const response = await apiClient.patch<Playlist>(
      `/playlists/${playlistId}/songs/reorder`,
      reorderData
    );
    return response.data;
  },

  /**
   * Métodos auxiliares
   */

  /**
   * Obtener playlists públicas
   * @returns Promise con playlists públicas
   */
  getPublicPlaylists: async (): Promise<Playlist[]> => {
    return playlistService.getAllPlaylists({ isPublic: true });
  },

  /**
   * Obtener playlists de un usuario
   * @param userId - ID del usuario
   * @returns Promise con playlists del usuario
   */
  getUserPlaylists: async (userId: string): Promise<Playlist[]> => {
    return playlistService.getAllPlaylists({ userId });
  },

  /**
   * Buscar playlists por nombre
   * @param searchTerm - Término de búsqueda
   * @returns Promise con playlists que coincidan
   */
  searchPlaylists: async (searchTerm: string): Promise<Playlist[]> => {
    return playlistService.getAllPlaylists({ search: searchTerm });
  },

  /**
   * POST /playlists/:id/songs/batch
   * Agregar múltiples canciones a una playlist en una sola petición
   *
   * @param playlistId - UUID de la playlist
   * @param songIds - Array de UUIDs de canciones
   * @returns Promise con la playlist actualizada
   */
  addSongsBatch: async (
    playlistId: string,
    songIds: string[]
  ): Promise<Playlist> => {
    const response = await apiClient.post<Playlist>(
      `/playlists/${playlistId}/songs/batch`,
      {
        songs: songIds.map(songId => ({ songId }))
      }
    );
    return response.data;
  },

  /**
   * PUT /playlists/:id/songs
   * Reemplazar todas las canciones de una playlist
   *
   * @param playlistId - UUID de la playlist
   * @param songIds - Array de UUIDs de canciones
   * @returns Promise con la playlist actualizada
   */
  replaceSongs: async (
    playlistId: string,
    songIds: string[]
  ): Promise<Playlist> => {
    const response = await apiClient.put<Playlist>(
      `/playlists/${playlistId}/songs`,
      { songIds }
    );
    return response.data;
  },

  /**
   * Crear playlist con canciones en una sola operación optimizada
   *
   * @param name - Nombre de la playlist
   * @param songIds - Array de UUIDs de canciones
   * @param userId - ID del usuario (opcional)
   * @returns Promise con la playlist creada
   */
  createPlaylistWithSongs: async (
    name: string,
    songIds: string[],
    userId?: string
  ): Promise<Playlist> => {
    // Paso 1: Crear la playlist vacía
    const createData: CreatePlaylistDto = {
      name,
      isPublic: false
    };

    const url = userId ? `/playlists?userId=${userId}` : '/playlists';
    const createResponse = await apiClient.post<Playlist>(url, createData);
    const playlist = createResponse.data;

    // Paso 2: Agregar todas las canciones en BATCH (optimizado)
    if (songIds.length > 0) {
      await playlistService.addSongsBatch(playlist.id, songIds);
    }

    // Paso 3: Obtener la playlist actualizada con las canciones
    return playlistService.getPlaylistWithSongs(playlist.id);
  },

  /**
   * Actualizar playlist con nuevo nombre y canciones
   *
   * @param id - UUID de la playlist
   * @param name - Nuevo nombre
   * @param songIds - Array de UUIDs de canciones
   * @returns Promise con la playlist actualizada
   */
  updatePlaylistWithSongs: async (
    id: string,
    name: string,
    songIds: string[]
  ): Promise<Playlist> => {
    // Paso 1: Actualizar el nombre
    await playlistService.updatePlaylist(id, { name });

    // Paso 2: Reemplazar todas las canciones en UNA SOLA petición
    await playlistService.replaceSongs(id, songIds);

    // Paso 3: Obtener la playlist actualizada
    return playlistService.getPlaylistWithSongs(id);
  },

  /**
   * PATCH /playlists/:id/regenerate
   * Regenerar una playlist automática
   *
   * @param id - UUID de la playlist
   * @returns Promise con la playlist regenerada
   */
  regeneratePlaylist: async (id: string): Promise<Playlist> => {
    const response = await apiClient.patch<Playlist>(`/playlists/${id}/regenerate`);
    return response.data;
  },

  /**
   * Duplicar una playlist (optimizado con batch)
   * @param playlistId - UUID de la playlist a duplicar
   * @param newName - Nombre para la nueva playlist
   * @returns Promise con la nueva playlist creada
   */
  duplicatePlaylist: async (
    playlistId: string,
    newName: string
  ): Promise<Playlist> => {
    // Obtener playlist original con canciones
    const original = await playlistService.getPlaylistWithSongs(playlistId);

    // Crear nueva playlist con canciones usando batch (optimizado)
    const songIds = original.songs.map(song => song.id);
    return playlistService.createPlaylistWithSongs(newName, songIds);
  },
};

/**
 * Exportar servicio por defecto
 */
export default playlistService;

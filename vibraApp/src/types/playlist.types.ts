/**
 * Tipos TypeScript para el módulo de playlists
 *
 * Estos tipos coinciden con la estructura de datos del backend (NestJS)
 * Ubicación backend: back/api/src/playlists/entities/
 */

import type { Song } from './music.types';

/**
 * Interfaz principal de una playlist
 * Representa una lista de reproducción
 */
export interface Playlist {
  id: string;                    // UUID de la playlist
  name: string;                  // Nombre de la playlist
  description?: string;          // Descripción (opcional)
  userId?: string;               // ID del usuario propietario (opcional)
  isPublic: boolean;             // Si es pública o privada
  coverImageUrl?: string;        // URL de la imagen de portada (opcional)
  totalDuration: number;         // Duración total en segundos
  songCount: number;             // Cantidad de canciones
  createdAt?: string | Date;     // Fecha de creación
  updatedAt?: string | Date;     // Fecha de actualización
}

/**
 * Interfaz para una canción dentro de una playlist
 * Incluye información de posición y fecha de agregado
 */
export interface PlaylistSong {
  id: string;                    // UUID de la relación playlist-song
  playlistId: string;            // ID de la playlist
  songId: string;                // ID de la canción
  position: number;              // Posición en la playlist (orden)
  addedAt: string | Date;        // Fecha en que se agregó
  addedByUserId?: string;        // ID del usuario que la agregó (opcional)
  song?: Song;                   // Datos completos de la canción (opcional)
}

/**
 * Playlist con sus canciones incluidas
 * Se usa cuando el backend retorna la playlist con todas sus canciones
 */
export interface PlaylistWithSongs extends Playlist {
  songs: Song[];                 // Array de canciones de la playlist
  playlistSongs?: PlaylistSong[]; // Información detallada de cada canción
}

/**
 * DTO para crear una nueva playlist
 * Coincide con CreatePlaylistDto del backend
 */
export interface CreatePlaylistDto {
  name: string;                  // Nombre (requerido)
  description?: string;          // Descripción (opcional)
  userId?: string;               // ID del usuario (opcional)
  isPublic?: boolean;            // Si es pública (default: false)
  coverImageUrl?: string;        // URL de portada (opcional)
}

/**
 * DTO para actualizar una playlist existente
 * Todos los campos son opcionales
 */
export interface UpdatePlaylistDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
  coverImageUrl?: string;
}

/**
 * DTO para agregar una canción a una playlist
 */
export interface AddSongToPlaylistDto {
  songId: string;                // ID de la canción a agregar
  position?: number;             // Posición específica (opcional, se agrega al final si no se especifica)
}

/**
 * DTO para reordenar canciones en una playlist
 */
export interface ReorderPlaylistSongsDto {
  songId: string;                // ID de la canción a mover
  newPosition: number;           // Nueva posición
}

/**
 * Respuesta al agregar una canción a playlist
 */
export interface AddSongResponse {
  success: boolean;
  message: string;
  playlistSong?: PlaylistSong;
}

/**
 * Respuesta al eliminar una canción de playlist
 */
export interface RemoveSongResponse {
  success: boolean;
  message: string;
}

/**
 * Parámetros para filtrar playlists
 */
export interface PlaylistFilterParams {
  userId?: string;               // Filtrar por usuario
  isPublic?: boolean;            // Filtrar por públicas/privadas
  search?: string;               // Buscar por nombre
  limit?: number;                // Límite de resultados
  offset?: number;               // Offset para paginación
}

/**
 * Estadísticas de una playlist
 */
export interface PlaylistStats {
  totalPlaylists: number;        // Total de playlists
  totalSongs: number;            // Total de canciones en todas las playlists
  totalDuration: number;         // Duración total de todas las playlists
  averageSongsPerPlaylist: number; // Promedio de canciones por playlist
}

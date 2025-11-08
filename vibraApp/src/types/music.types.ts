/**
 * Tipos TypeScript para el módulo de música
 *
 * Estos tipos coinciden con la estructura de datos del backend (NestJS)
 * Ubicación backend: back/api/src/music/entities/song.entity.ts
 */

/**
 * Interfaz principal de una canción
 * Representa una canción almacenada en la base de datos
 */
export interface Song {
  id: string;                    // UUID generado por la base de datos
  title: string;                 // Título de la canción
  artist: string;                // Nombre del artista
  youtubeId: string;             // ID del video de YouTube
  duration: number;              // Duración en segundos
  genre?: string;                // Género musical (opcional)
  viewCount?: number;            // Número de reproducciones (opcional)
  publishedAt?: string | Date;  // Fecha de publicación (opcional)
  cloudinaryUrl?: string;        // URL del audio en Cloudinary
  createdAt?: string | Date;     // Fecha de creación en BD
  updatedAt?: string | Date;     // Fecha de última actualización
}

/**
 * Interfaz para resultados de búsqueda de YouTube
 * Se usa cuando buscas canciones en YouTube sin guardarlas en BD
 * IMPORTANTE: El backend extrae automáticamente el artista del título
 */
export interface YouTubeSearchResult {
  id: string;                    // ID del video de YouTube
  title: string;                 // Título del video
  artist: string;                // Artista (extraído del título por el backend)
  duration: number;              // Duración en segundos
  publishedAt: string;           // Fecha de publicación
  viewCount?: number;            // Cantidad de vistas (opcional)
}

/**
 * Parámetros para buscar canciones
 * Se usa en endpoints de búsqueda y filtrado
 */
export interface SearchParams {
  query?: string;                // Término de búsqueda
  limit?: number;                // Límite de resultados (default: 50)
  offset?: number;               // Offset para paginación (default: 0)
  genre?: string;                // Filtrar por género
  artist?: string;               // Filtrar por artista
}

/**
 * Parámetros para paginación
 */
export interface PaginationParams {
  limit?: number;                // Cantidad de elementos por página
  offset?: number;               // Desplazamiento desde el inicio
}

/**
 * DTO para crear una canción nueva
 * Coincide con CreateSongDto del backend
 */
export interface CreateSongDto {
  title: string;                 // Título (requerido)
  artist: string;                // Artista (requerido)
  youtubeId: string;             // ID de YouTube (requerido)
  duration: number;              // Duración en segundos (requerido)
  genre?: string;                // Género (opcional)
  viewCount?: number;            // Vistas (opcional)
  publishedAt?: Date | string;   // Fecha publicación (opcional)
  audioPath?: string;            // Ruta del MP3 local (opcional, DEPRECATED)
  cloudinaryUrl?: string;        // URL del audio en Cloudinary (opcional)
}

/**
 * DTO para actualizar una canción existente
 * Todos los campos son opcionales
 */
export interface UpdateSongDto {
  title?: string;
  artist?: string;
  youtubeId?: string;
  duration?: number;
  genre?: string;
  viewCount?: number;
  publishedAt?: Date | string;
  audioPath?: string;
  cloudinaryUrl?: string;
}

/**
 * Respuesta de búsqueda inteligente (smart search)
 * Combina resultados de base de datos y YouTube
 */
export interface SmartSearchResponse {
  fromDatabase: Song[];                    // Canciones encontradas en BD
  fromYoutube: YouTubeSearchResult[];      // Resultados de YouTube
  source: 'database' | 'youtube' | 'mixed'; // Origen de los resultados
  total: number;                           // Total de resultados
}

/**
 * Respuesta al reproducir una canción
 * El backend retorna esto cuando haces POST /music/play/:id
 */
export interface PlaySongResponse {
  success: boolean;              // Si la reproducción se registró
  data: Song;                    // Datos de la canción
  message?: string;              // Mensaje adicional (opcional)
}

/**
 * Géneros musicales disponibles
 * (Puedes expandir esta lista según tu backend)
 */
export enum MusicGenre {
  ROCK = 'Rock',
  POP = 'Pop',
  ELECTRONIC = 'Electronic',
  HIP_HOP = 'Hip Hop',
  JAZZ = 'Jazz',
  CLASSICAL = 'Classical',
  REGGAE = 'Reggae',
  COUNTRY = 'Country',
  BLUES = 'Blues',
  METAL = 'Metal',
  INDIE = 'Indie',
  LATIN = 'Latin',
  OTHER = 'Other',
}

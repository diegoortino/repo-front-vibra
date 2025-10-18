/**
 * Configuración centralizada de la API
 *
 * Este archivo contiene todas las constantes relacionadas con la comunicación
 * con el backend. Si cambias el puerto o dominio del servidor, solo necesitas
 * editar este archivo.
 */

/**
 * Configuración principal de la API
 */
export const API_CONFIG = {
  // URL base del backend (lee de .env o usa localhost:3000 por defecto)
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',

  // Timeout para las peticiones HTTP (10 segundos)
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
};

/**
 * Endpoints disponibles en el backend
 * Estos se concatenan con BASE_URL para formar la URL completa
 */
export const ENDPOINTS = {
  // Endpoints de música
  MUSIC: '/music',
  MUSIC_SONGS: '/music/songs',
  MUSIC_SEARCH: '/music/search',
  MUSIC_SEARCH_SMART: '/music/search-smart',

  // Endpoints de playlists
  PLAYLISTS: '/playlists',

  // Endpoints de usuarios
  USERS: '/users',

  // Endpoints de imágenes
  IMAGES: '/images',
};

/**
 * Tipos de peticiones HTTP
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

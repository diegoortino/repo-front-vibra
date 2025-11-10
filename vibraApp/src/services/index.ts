/**
 * Barrel export para servicios
 *
 * Facilita los imports desde un solo lugar:
 *   import { musicService, playlistService } from '../services';
 */

export { musicService } from './musicService';
export { playlistService } from './playlistService';
export { apiClient } from './api/axiosInstance';
export { API_CONFIG, ENDPOINTS } from './api/apiConfig';
export { imagesService } from './imagesService';

/**
 * Instancia configurada de Axios para comunicarse con el backend
 *
 * Este es el "cliente HTTP" que usaremos en toda la aplicación.
 * Tiene configuración automática de:
 * - URL base
 * - Timeout
 * - Headers
 * - Interceptors (para logs y manejo de errores)
 */

import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from './apiConfig';

/**
 * Crear instancia de Axios con configuración base
 */
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true, // Enviar cookies automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * INTERCEPTOR DE REQUEST
 * Se ejecuta ANTES de cada petición HTTP
 *
 * Útil para:
 * - Agregar tokens de autenticación
 * - Logging
 * - Modificar headers
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log para debug (puedes comentar en producción)
    const method = config.method?.toUpperCase() || 'UNKNOWN';
    const url = config.url || 'unknown';
    console.log(`🚀 [API Request] ${method} ${url}`);

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTOR DE RESPONSE
 * Se ejecuta DESPUÉS de recibir la respuesta del servidor
 *
 * Útil para:
 * - Logging de respuestas
 * - Manejo global de errores
 * - Transformación de datos
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log de respuesta exitosa
    const status = response.status;
    const url = response.config.url || 'unknown';
    console.log(`✅ [API Response] ${status} ${url}`);

    return response;
  },
  (error: AxiosError) => {
    // Manejo detallado de errores

    if (error.response) {
      // ❌ Error del servidor (4xx, 5xx)
      const status = error.response.status;
      const url = error.config?.url || 'unknown';
      const data = error.response.data;

      console.error(`❌ [API Error] ${status} ${url}`, data);

      // Manejo específico por código de error
      switch (status) {
        case 400:
          console.error('Bad Request - Datos inválidos');
          break;
        case 401:
          console.error('No autorizado - Token inválido o expirado');
          // Aquí podrías redirigir a login:
          // window.location.href = '/login';
          break;
        case 403:
          console.error('Prohibido - No tienes permisos');
          break;
        case 404:
          console.error('No encontrado - Recurso no existe');
          break;
        case 500:
          console.error('Error del servidor - Problema en el backend');
          break;
        default:
          console.error(`Error HTTP ${status}`);
      }
    } else if (error.request) {
      // ❌ No hubo respuesta (backend caído o sin red)
      console.error('❌ [API Error] No hay respuesta del servidor');
      console.error('Verifica que el backend esté corriendo en:', API_CONFIG.BASE_URL);
    } else {
      // ❌ Error al configurar la petición
      console.error('❌ [API Error] Error al configurar la petición:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Exportar la instancia configurada
 * Úsala en los servicios: import { apiClient } from './api/axiosInstance';
 */
export default apiClient;

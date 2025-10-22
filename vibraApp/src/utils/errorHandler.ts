/**
 * Utilidad para manejo de errores de API
 *
 * Proporciona funciones para procesar y formatear errores
 * de forma consistente en toda la aplicación.
 */

import { AxiosError } from 'axios';
import type { ApiError } from '../types';

/**
 * Extrae un mensaje de error legible desde un error de Axios
 *
 * @param error - Error capturado (puede ser AxiosError, Error, o cualquier cosa)
 * @returns Mensaje de error formateado para mostrar al usuario
 */
export const getErrorMessage = (error: unknown): string => {
  // Si es un error de Axios (del backend)
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError | undefined;

    // Si el backend envió un mensaje estructurado
    if (apiError?.message) {
      // El mensaje puede ser string o array de strings
      if (Array.isArray(apiError.message)) {
        return apiError.message.join(', ');
      }
      return apiError.message;
    }

    // Mensajes según código HTTP
    const status = error.response?.status;
    switch (status) {
      case 400:
        return 'Datos inválidos. Por favor verifica la información.';
      case 401:
        return 'No estás autorizado. Por favor inicia sesión.';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 409:
        return 'Ya existe un recurso con estos datos.';
      case 500:
        return 'Error del servidor. Por favor intenta más tarde.';
      case 503:
        return 'Servicio no disponible. Por favor intenta más tarde.';
      default:
        if (status && status >= 500) {
          return 'Error del servidor. Por favor intenta más tarde.';
        }
        return error.message || 'Error desconocido';
    }
  }

  // Si es un error normal de JavaScript
  if (error instanceof Error) {
    return error.message;
  }

  // Si es un string
  if (typeof error === 'string') {
    return error;
  }

  // Fallback
  return 'Ocurrió un error inesperado';
};

/**
 * Verifica si el error es por falta de conexión con el servidor
 *
 * @param error - Error capturado
 * @returns true si es error de conexión
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    // No hay respuesta del servidor
    return !error.response && !!error.request;
  }
  return false;
};

/**
 * Verifica si el error es de autenticación (401)
 *
 * @param error - Error capturado
 * @returns true si es error 401
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
};

/**
 * Verifica si el error es de permisos (403)
 *
 * @param error - Error capturado
 * @returns true si es error 403
 */
export const isForbiddenError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
};

/**
 * Verifica si el error es "no encontrado" (404)
 *
 * @param error - Error capturado
 * @returns true si es error 404
 */
export const isNotFoundError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 404;
  }
  return false;
};

/**
 * Verifica si el error es del servidor (5xx)
 *
 * @param error - Error capturado
 * @returns true si es error 500+
 */
export const isServerError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return !!status && status >= 500;
  }
  return false;
};

/**
 * Obtiene el código de estado HTTP del error
 *
 * @param error - Error capturado
 * @returns Código de estado o null
 */
export const getStatusCode = (error: unknown): number | null => {
  if (error instanceof AxiosError) {
    return error.response?.status || null;
  }
  return null;
};

/**
 * Formatea un error para logging/debug
 *
 * @param error - Error capturado
 * @param context - Contexto adicional (ej: "Cargando canciones")
 * @returns Objeto con información detallada del error
 */
export const formatErrorForLog = (
  error: unknown,
  context?: string
): {
  context?: string;
  message: string;
  statusCode?: number;
  isNetwork: boolean;
  timestamp: string;
  details?: any;
} => {
  return {
    context,
    message: getErrorMessage(error),
    statusCode: getStatusCode(error) || undefined,
    isNetwork: isNetworkError(error),
    timestamp: new Date().toISOString(),
    details:
      error instanceof AxiosError
        ? {
            url: error.config?.url,
            method: error.config?.method,
            data: error.response?.data,
          }
        : undefined,
  };
};

/**
 * Maneja un error y lo muestra en consola (útil para desarrollo)
 *
 * @param error - Error capturado
 * @param context - Contexto adicional
 */
export const logError = (error: unknown, context?: string): void => {
  const formattedError = formatErrorForLog(error, context);
  console.error('❌ Error:', formattedError);
};

/**
 * Tipo guard para verificar si es un ApiError
 *
 * @param error - Error a verificar
 * @returns true si es ApiError
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error
  );
};

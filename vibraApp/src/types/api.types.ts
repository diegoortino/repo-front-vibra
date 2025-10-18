/**
 * Tipos TypeScript generales para comunicación con la API
 *
 * Estos tipos son agnósticos del dominio y se usan en toda la aplicación
 * para manejar respuestas, errores, paginación, etc.
 */

/**
 * Respuesta estándar de la API
 * Muchos endpoints del backend retornan este formato
 */
export interface ApiResponse<T = any> {
  success: boolean;              // Si la operación fue exitosa
  data?: T;                      // Datos de la respuesta (genérico)
  message?: string;              // Mensaje descriptivo
  error?: string;                // Mensaje de error (si success es false)
}

/**
 * Error de la API
 * Estructura del error cuando falla una petición
 */
export interface ApiError {
  statusCode: number;            // Código HTTP (400, 404, 500, etc.)
  message: string | string[];    // Mensaje de error (puede ser array)
  error?: string;                // Tipo de error (BadRequest, NotFound, etc.)
  timestamp?: string;            // Timestamp del error
  path?: string;                 // Ruta que causó el error
}

/**
 * Respuesta paginada
 * Se usa cuando el backend retorna datos con paginación
 */
export interface PaginatedResponse<T> {
  data: T[];                     // Array de elementos
  total: number;                 // Total de elementos disponibles
  limit: number;                 // Límite de elementos por página
  offset: number;                // Desplazamiento desde el inicio
  hasMore: boolean;              // Si hay más páginas disponibles
}

/**
 * Parámetros de paginación genéricos
 */
export interface PaginationParams {
  limit?: number;                // Cantidad de elementos (default: 50)
  offset?: number;               // Desde qué elemento empezar (default: 0)
  page?: number;                 // Número de página (alternativa a offset)
}

/**
 * Parámetros de ordenamiento
 */
export interface SortParams {
  sortBy?: string;               // Campo por el cual ordenar
  order?: 'ASC' | 'DESC';        // Orden ascendente o descendente
}

/**
 * Parámetros de búsqueda genéricos
 */
export interface SearchParams {
  query?: string;                // Término de búsqueda
  filters?: Record<string, any>; // Filtros adicionales (clave-valor)
}

/**
 * Estado de carga de datos
 * Útil para hooks y componentes
 */
export interface LoadingState<T = any> {
  data: T | null;                // Datos cargados
  loading: boolean;              // Si está cargando
  error: string | null;          // Error si lo hay
  isSuccess: boolean;            // Si la carga fue exitosa
}

/**
 * Estado de mutación (crear, actualizar, eliminar)
 */
export interface MutationState<T = any> {
  data: T | null;                // Datos de la mutación
  loading: boolean;              // Si está procesando
  error: string | null;          // Error si lo hay
  isSuccess: boolean;            // Si fue exitoso
  reset: () => void;             // Función para resetear el estado
}

/**
 * Respuesta de conteo
 * Se usa en endpoints como /music/songs/count
 */
export interface CountResponse {
  total: number;                 // Total de elementos
}

/**
 * Métodos HTTP disponibles
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Headers HTTP comunes
 */
export interface HttpHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'Accept'?: string;
  [key: string]: string | undefined;
}

/**
 * Configuración de petición HTTP
 */
export interface RequestConfig {
  method?: HttpMethod;
  headers?: HttpHeaders;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

/**
 * Tipo para callbacks de éxito/error
 */
export type SuccessCallback<T = any> = (data: T) => void;
export type ErrorCallback = (error: ApiError | Error) => void;

/**
 * Opciones para hooks de datos
 */
export interface UseDataOptions<T = any> {
  enabled?: boolean;                    // Si debe ejecutarse automáticamente
  onSuccess?: SuccessCallback<T>;       // Callback de éxito
  onError?: ErrorCallback;              // Callback de error
  refetchInterval?: number;             // Intervalo de refetch en ms
  cacheTime?: number;                   // Tiempo de caché en ms
}

/**
 * Metadata de respuesta
 */
export interface ResponseMetadata {
  timestamp: string;             // Timestamp de la respuesta
  version?: string;              // Versión de la API
  requestId?: string;            // ID único de la petición
}

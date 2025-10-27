/**
 * Servicio de API centralizado con autenticación automática
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * Obtener el token de autenticación del localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token_vibra');
};

/**
 * Función helper para hacer peticiones con autenticación automática
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Agregar token si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * Helpers para métodos HTTP comunes
 */
export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    apiFetch(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, data?: any, options?: RequestInit) =>
    apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (endpoint: string, data?: any, options?: RequestInit) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (endpoint: string, data?: any, options?: RequestInit) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Verificar si el usuario está autenticado
 */
export const checkAuth = async (): Promise<{ authenticated: boolean; user?: any }> => {
  const token = getAuthToken();

  if (!token) {
    return { authenticated: false };
  }

  try {
    const response = await api.get('/auth/me');

    if (response.ok) {
      const user = await response.json();
      return { authenticated: true, user };
    } else {
      // Token inválido o expirado
      localStorage.removeItem('token_vibra');
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    return { authenticated: false };
  }
};

/**
 * Logout - eliminar token
 */
export const logout = () => {
  localStorage.removeItem('token_vibra');
  window.location.href = 'http://localhost:5173'; // Redirigir a landing
};

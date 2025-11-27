/**
 * Servicio de API centralizado con autenticación automática via cookies
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * Función helper para hacer peticiones con autenticación automática via cookies
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    credentials: 'include', // Enviar cookies automáticamente
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
 * Verificar si el usuario está autenticado via cookies
 */
export const checkAuth = async (): Promise<{ authenticated: boolean; user?: any }> => {
  try {
    const response = await api.get('/auth/me');

    if (response.ok) {
      const user = await response.json();
      return { authenticated: true, user };
    } else {
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    return { authenticated: false };
  }
};

/**
 * Logout - redirigir a landing (cookies se eliminan en el backend)
 */
export const logout = () => {
  window.location.href = 'http://localhost:5173'; // Redirigir a landing
};

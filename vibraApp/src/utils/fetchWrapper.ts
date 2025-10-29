// src/utils/fetchWrapper.ts
const originalFetch = window.fetch;

window.fetch = async (input, init = {}) => {
  // Obtener la URL de la petición
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  
  // Solo aplicar el wrapper a peticiones locales (tu backend)
  const esAPILocal = url.startsWith('http://localhost:3000')
  
  // Si NO es API local, usar fetch original sin modificar
  if (!esAPILocal) {
    return originalFetch(input, init);
  }

  // --- Lógica del wrapper solo para API local ---
  const token = localStorage.getItem('token_vibra');
  
  // Clonamos headers y aseguramos Content-Type JSON si no existe
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const newInit = { ...init, headers };

  const response = await originalFetch(input, newInit);

  // Si el backend responde 401, se interpreta token inválido o expirado
  if (response.status === 401) {
    console.warn('Token inválido o expirado, cerrando sesión...');
    localStorage.removeItem('token_vibra');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};
// // src/utils/fetchWrapper.js
// const originalFetch = window.fetch;

// window.fetch = async (input, init = {}) => {
//   const token = localStorage.getItem('token_vibra');
  
//   // Clonamos headers y aseguramos Content-Type JSON si no existe
//   const headers = new Headers(init.headers || {});
//   if (!headers.has('Content-Type')) {
//     headers.set('Content-Type', 'application/json');
//   }

//   if (token) {
//     headers.set('Authorization', `Bearer ${token}`);
//   }

//   const newInit = { ...init, headers };

//   const response = await originalFetch(input, newInit);

//   // Si el backend responde 401, se interpreta token inválido o expirado
//   if (response.status === 401) {
//     console.warn('Token inválido o expirado, cerrando sesión...');
//     localStorage.removeItem('token_vibra');
//     window.location.href = '/login'; // redirigir a login
//     throw new Error('Unauthorized'); // lanzar error para cumplir la firma que espera Promise<Response>
//   }

//   return response;
// };

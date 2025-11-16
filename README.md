# VIBRA - Frontend

Plataforma de música con descubrimiento inteligente, gestión de playlists y reproductor integrado.

---

## 📁 Estructura del Proyecto

```
front/
├── vibraFront/    # Landing Page + Login (Puerto 5173)
│   ├── Landing page estática con presentación del producto
│   ├── LoginModal con Google OAuth 2.0
│   └── RegisterModal
│
└── vibraApp/      # Aplicación Principal (Puerto 5174)
    ├── Descubrimiento de música por géneros
    ├── Búsqueda inteligente (BD + YouTube)
    ├── Gestión de playlists personalizadas
    └── Reproductor de música integrado
```

---

## 🚀 Tecnologías

### **vibraApp (Aplicación Principal)**
- **React 19** + **TypeScript**
- **Vite** - Build tool y dev server
- **Axios** - HTTP client con interceptors
- **React Router** - Navegación SPA
- **Font Awesome** - Iconos
- **CSS Modules** - Estilos aislados

### **vibraFront (Landing Page)**
- **React 19** + **TypeScript**
- **Vite** - Build tool
- **@react-oauth/google** - Autenticación con Google
- **React Router** - Navegación

---

## 🛠️ Instalación y Setup

### **Prerequisitos**
- Node.js 18+
- npm o yarn
- Backend corriendo en `http://localhost:3000`

### **Instalar dependencias**

```bash
# Landing Page
cd vibraFront
npm install

# Aplicación Principal
cd ../vibraApp
npm install
```

### **Variables de entorno**

**vibraApp/.env:**
```env
VITE_API_URL=http://localhost:3000
```

**vibraFront/.env:**
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

---

## 🏃 Desarrollo

### **Iniciar ambas aplicaciones**

```bash
# Terminal 1 - Landing Page (Puerto 5173)
cd vibraFront
npm run dev

# Terminal 2 - App Principal (Puerto 5174)
cd vibraApp
npm run dev
```

### **URLs de desarrollo**
- Landing Page: http://localhost:5173
- App Principal: http://localhost:5174
- Backend API: http://localhost:3000

---

## 📂 Estructura de vibraApp (Aplicación Principal)

```
src/
├── components/          # Componentes de React
│   ├── DiscoverMusic.tsx       # Descubrimiento por géneros
│   ├── ResultsSection.tsx      # Búsqueda y resultados
│   ├── MusicPlayer.tsx         # Reproductor de audio
│   ├── FavPage/                # Gestión de playlists
│   │   ├── FavPage.tsx         # Página principal de playlists
│   │   ├── SongSelector.tsx    # Selector de canciones
│   │   ├── CreatePlaylistModal.tsx  # Modal crear/editar playlist
│   │   └── PlaylistCover.tsx   # Mosaico de miniaturas (4 fotos)
│   └── UserPage/               # Perfil de usuario
│
├── services/            # Servicios API
│   ├── playlistsService.ts     # CRUD de playlists
│   ├── musicService.ts         # Búsqueda y reproducción
│   └── authService.ts          # Autenticación
│
├── context/             # Context API de React
│   ├── PlayerContext.tsx       # Estado global del reproductor
│   └── AuthContext.tsx         # Estado de autenticación
│
├── hooks/               # Custom React Hooks
│   └── useAuth.ts              # Hook de autenticación
│
├── types/               # TypeScript interfaces
│   ├── Song.ts                 # Interface de canciones
│   └── Playlist.ts             # Interface de playlists
│
├── utils/               # Utilidades
│   └── formatters.ts           # Formateo de datos
│
└── data/                # Datos estáticos
    └── genres.ts               # Lista de géneros musicales
```

---

## 🔐 Flujo de Autenticación

### **1. Usuario visita Landing (vibraFront)**
```
http://localhost:5173
```
- Ve presentación del producto
- Click en "Iniciar Sesión"
- Se abre LoginModal

### **2. Login con Google OAuth**
- Usuario hace click en "Sign in with Google"
- Google abre popup de autenticación
- Usuario selecciona cuenta
- Google devuelve `id_token`

### **3. Frontend envía token al Backend**
```typescript
POST http://localhost:3000/auth/google
Body: { id_token: "..." }
```

### **4. Backend responde con JWT**
```json
{ "token": "eyJhbGciOi..." }
```

### **5. Frontend guarda token y redirige**
```typescript
localStorage.setItem("token_vibra", data.token);
window.location.href = "http://localhost:5174";
```

### **6. vibraApp intercepta requests**
```typescript
// Axios interceptor agrega token automáticamente
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_vibra');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Todas las peticiones ahora son autenticadas** ✅

---

## 🎵 Funcionalidades Principales

### **1. Descubrimiento de Música**
- Vista por géneros (95+ géneros disponibles)
- Canciones aleatorias por género
- Miniaturas de YouTube generadas dinámicamente
- Reproducción con un click

### **2. Búsqueda Inteligente**
- Búsqueda híbrida: BD primero, luego YouTube
- Resultados en tiempo real
- Filtrado por artista o título
- Agregar canciones de YouTube a la BD

### **3. Gestión de Playlists**
- Crear playlists personalizadas
- Agregar/eliminar canciones
- Reordenar canciones (drag & drop)
- Mosaico de portada (4 miniaturas)
- Compartir playlists

### **4. Reproductor de Música**
- Reproducción continua
- Controles: Play/Pause, Anterior, Siguiente
- Barra de progreso interactiva
- Control de volumen
- Cola de reproducción

---

## 🎨 Componentes Clave

### **DiscoverMusic.tsx**
Componente principal de descubrimiento.

```typescript
// Obtiene canciones aleatorias por género
const fetchRandomSongs = async (genre: string) => {
  const response = await axios.get(`/music/random?genre=${genre}&limit=10`);
  setRandomSongs(response.data);
};
```

**Características:**
- Grid responsive de canciones
- Miniaturas de YouTube: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
- Lazy loading de géneros

### **ResultsSection.tsx**
Búsqueda y resultados combinados.

```typescript
// Búsqueda híbrida: BD + YouTube
const response = await axios.get('/music/search-smart', {
  params: { query, maxResults: 20 }
});

const { fromDatabase, fromYoutube } = response.data;
```

**Características:**
- Separación visual BD vs YouTube
- Agregar canciones con un click
- Vista previa de resultados

### **FavPage/CreatePlaylistModal.tsx**
Modal para crear/editar playlists.

```typescript
// Crear playlist
const createPlaylist = async (data: CreatePlaylistDto) => {
  const response = await axios.post('/playlists', data);
  return response.data;
};
```

**Características:**
- Formulario con validación
- Selector de canciones
- Preview de selección
- Guardado optimista

### **MusicPlayer.tsx**
Reproductor de audio global.

```typescript
// Context para estado global
const { currentSong, play, pause, next, previous } = usePlayer();
```

**Características:**
- Audio HTML5 nativo
- Controles personalizados
- Gestión de cola
- Persistencia de estado

---

## 🌐 Integración con Backend

### **Endpoints utilizados**

**Música:**
```
GET  /music/search-smart?query=...       # Búsqueda híbrida
GET  /music/random?genre=...&limit=...   # Canciones aleatorias
POST /music/save-from-youtube            # Guardar de YouTube
GET  /music/songs/:id                    # Obtener canción
```

**Playlists (protegidos):**
```
POST   /playlists                        # Crear playlist
GET    /playlists                        # Listar mis playlists
PUT    /playlists/:id                    # Editar playlist
DELETE /playlists/:id                    # Eliminar playlist
POST   /playlists/:id/songs              # Agregar canción
DELETE /playlists/:id/songs/:songId      # Quitar canción
PATCH  /playlists/:id/songs/reorder      # Reordenar
```

**Autenticación:**
```
POST /auth/google                        # Login con Google
GET  /auth/me                            # Datos del usuario
```

---

## 🎯 Best Practices

### **1. Miniaturas de YouTube**
Generadas dinámicamente (no guardadas en BD):
```typescript
const thumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
```

### **2. Gestión de Estado**
- Context API para estado global (player, auth)
- useState para estado local de componentes
- Custom hooks para lógica reutilizable

### **3. Axios Interceptors**
Agregan token automáticamente:
```typescript
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_vibra');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **4. TypeScript Strict**
Interfaces para todos los datos:
```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  duration: number;
  genre: string;
  cloudinaryUrl?: string;
}
```

---

## 🏗️ Build para Producción

```bash
# Landing Page
cd vibraFront
npm run build
# Output: vibraFront/dist/

# App Principal
cd vibraApp
npm run build
# Output: vibraApp/dist/
```

### **Deploy**
Los builds se pueden servir con cualquier servidor estático:
- Vercel
- Netlify
- Railway
- Nginx

---

## 🐛 Troubleshooting

### **Error: CORS blocked**
Verificar que el backend tenga CORS habilitado para:
```typescript
origin: ['http://localhost:5173', 'http://localhost:5174']
```

### **Error: 401 Unauthorized**
Token no está siendo enviado o es inválido:
```javascript
// Verificar en console
console.log(localStorage.getItem('token_vibra'));
```

### **Miniaturas no aparecen**
Verificar en Network tab que las URLs de `img.youtube.com` respondan 200.

### **Reproductor no funciona**
Verificar que `cloudinaryUrl` exista en las canciones de BD.

---

## 📝 Notas Importantes

- **Dos aplicaciones separadas**: Landing y App principal
- **Autenticación compartida**: localStorage con mismo dominio
- **Miniaturas dinámicas**: Generadas desde youtubeId
- **Endpoints protegidos**: Requieren token JWT
- **TypeScript strict**: Todo está tipado

---

## 🔗 Links Útiles

- Backend API: http://localhost:3000
- Documentación de autenticación: `/back/api/docs/FLUJO_AUTENTICACION.md`
- Google OAuth Setup: https://console.cloud.google.com

---

**Última actualización**: 2025-11-15
**Versión**: 2.0
**Proyecto**: VIBRA - Plataforma de Música

# 🎵 VIBRA - Frontend

Plataforma de música con descubrimiento inteligente, gestión de playlists y reproductor integrado.

---

## 📁 Estructura del Proyecto

```
front/
├── vibraFront/    # Landing Page + Login (Puerto 5173)
│   ├── Landing page estática con presentación
│   ├── LoginModal con Google OAuth 2.0
│   └── RegisterModal
│
└── vibraApp/      # Aplicación Principal (Puerto 5174)
    ├── Descubrimiento de música por 65 géneros
    ├── Búsqueda inteligente (BD + YouTube)
    ├── Gestión de playlists personalizadas
    └── Reproductor de música integrado
```

---

## 🚀 Stack Tecnológico

### **vibraApp (Aplicación Principal)**
- **React 19** + **TypeScript 5**
- **Vite 5** - Build tool ultrarrápido
- **Axios** - HTTP client con interceptors
- **React Router 6** - Navegación SPA
- **Font Awesome 6** - Iconografía
- **CSS Modules** - Estilos aislados por componente
- **Context API** - State management global

### **vibraFront (Landing Page)**
- **React 19** + **TypeScript 5**
- **Vite 5** - Build tool
- **@react-oauth/google** - Autenticación OAuth 2.0
- **React Router 6** - Navegación

---

## 🛠️ Instalación y Setup

### **Prerequisitos**
- Node.js 18+
- npm o yarn
- Backend corriendo en `http://localhost:3000`

### **1. Instalar dependencias**

```bash
# Landing Page
cd front/vibraFront
npm install

# Aplicación Principal
cd ../vibraApp
npm install
```

### **2. Configurar variables de entorno**

**`vibraApp/.env`:**
```env
VITE_API_URL=http://localhost:3000
```

**`vibraFront/.env`:**
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=881144321895-esh95d9nnokqigh4dv20upmcfqvg9vjd.apps.googleusercontent.com
```

### **3. Iniciar servidores de desarrollo**

```bash
# Terminal 1 - Landing Page (Puerto 5173)
cd vibraFront
npm run dev

# Terminal 2 - App Principal (Puerto 5174)
cd vibraApp
npm run dev
```

### **URLs de desarrollo**
- Landing Page: **http://localhost:5173**
- App Principal: **http://localhost:5174**
- Backend API: **http://localhost:3000**

---

## 🔐 Flujo de Autenticación

### **Arquitectura de Autenticación**

VIBRA usa **Google OAuth 2.0 + JWT** con cookies HTTP-only:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  vibraFront │  →   │   Backend   │  →   │  vibraApp   │
│  (5173)     │      │   (3000)    │      │   (5174)    │
└─────────────┘      └─────────────┘      └─────────────┘
```

### **Paso a Paso**

#### **1. Usuario en Landing (vibraFront)**
```
URL: http://localhost:5173
```
- Ve presentación del producto
- Click en "Iniciar Sesión"
- Se abre LoginModal con botón de Google

#### **2. Login con Google OAuth**
```typescript
// LoginModal.tsx
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
/>
```
- Usuario hace click en "Sign in with Google"
- Google abre popup de autenticación
- Usuario selecciona su cuenta de Google
- Google devuelve `id_token`

#### **3. Frontend envía token a Backend**
```typescript
const response = await fetch('http://localhost:3000/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Enviar/recibir cookies
  body: JSON.stringify({ id_token: googleIdToken })
});
```

#### **4. Backend verifica y responde**
Backend realiza:
1. Verifica `id_token` con Google OAuth2Client
2. Extrae: email, googleId, username, profilePicture
3. Busca o crea usuario en PostgreSQL
4. Genera JWT propio (válido 7 días)
5. **Envía JWT en cookie `token_vibra`** (HTTP-only, secure)

```json
// Respuesta
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

#### **5. Frontend guarda token y redirige**
```typescript
// Cookie ya guardada automáticamente por el browser
const data = await response.json();
localStorage.setItem("token_vibra", data.token); // Backup en localStorage

// Redirigir a la aplicación principal
window.location.href = "http://localhost:5174";
```

#### **6. vibraApp intercepta requests automáticamente**

Axios está configurado para enviar la cookie en cada request:

```typescript
// axiosInstance.ts
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,  // ← Envía cookie token_vibra automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Todas las peticiones ahora son autenticadas** ✅

#### **7. Backend valida automáticamente**
```typescript
// Endpoints protegidos con @UseGuards(JwtAuthGuard)
@Post()
@UseGuards(JwtAuthGuard)  // ← Extrae JWT de cookie y valida
async create(
  @CurrentUser() user: any,  // ← Usuario inyectado { userId, username, email }
  @Body() data: CreatePlaylistDto
) {
  // Playlist se crea asociada al userId automáticamente
}
```

---

## 📂 Arquitectura de vibraApp

### **Estructura de Carpetas**

```
vibraApp/src/
├── components/              # Componentes de React
│   ├── DiscoverMusic/
│   │   ├── DiscoverMusic.tsx      # Descubrimiento por géneros
│   │   └── DiscoverMusic.css
│   ├── ResultsSection/
│   │   ├── ResultsSection.tsx     # Búsqueda y resultados
│   │   └── ResultsSection.css
│   ├── MusicPlayer/
│   │   ├── MusicPlayer.tsx        # Reproductor global
│   │   └── MusicPlayer.css
│   ├── FavPage/                   # Gestión de playlists
│   │   ├── FavoritePage.tsx       # Página de playlists
│   │   ├── SongSelector.tsx       # Selector de canciones
│   │   └── PlaylistCover.tsx      # Mosaico 2x2 de covers
│   ├── CreatePlaylistPage/
│   │   ├── CreatePlaylistPage.tsx # Modal crear/editar
│   │   └── CreatePlaylistPage.css
│   └── UserPage/
│       ├── UserPage.tsx           # Perfil de usuario
│       └── UserPage.css
│
├── services/                # Servicios API
│   ├── api/
│   │   ├── axiosInstance.ts       # Config de Axios
│   │   └── apiConfig.ts           # URLs base
│   ├── playlistService.ts         # CRUD de playlists
│   └── musicService.ts            # Búsqueda y reproducción
│
├── context/                 # React Context API
│   ├── MusicContext.tsx           # Estado global del player
│   └── AuthContext.tsx            # Estado de autenticación
│
├── hooks/                   # Custom React Hooks
│   ├── usePlaylists.ts            # Hook de playlists
│   ├── useGenres.ts               # Hook de géneros
│   └── useAuth.ts                 # Hook de autenticación
│
├── types/                   # TypeScript Types
│   └── index.ts                   # Todas las interfaces
│
├── utils/                   # Utilidades
│   └── utilsMusic.ts              # Helpers de música
│
└── App.tsx                  # Componente raíz
```

### **Componentes Principales**

#### **DiscoverMusic.tsx**
Descubrimiento de música por géneros.

**Características:**
- Grid de 65 géneros musicales
- Canciones aleatorias por género (`/music/random`)
- Miniaturas dinámicas de YouTube
- Reproducción con un click

**Ejemplo de uso:**
```typescript
const fetchRandomSongs = async (genre: string) => {
  const response = await musicService.getRandomSongs(genre, 10);
  setRandomSongs(response);
};
```

#### **ResultsSection.tsx**
Búsqueda inteligente híbrida (BD + YouTube).

**Características:**
- Búsqueda en tiempo real
- Resultados separados: BD vs YouTube
- Agregar canciones de YouTube a BD
- Vista previa de resultados

**Ejemplo de uso:**
```typescript
const searchSongs = async (query: string) => {
  const results = await musicService.searchSmart(query, 20);
  // results = { fromDatabase: [...], fromYoutube: [...] }
};
```

#### **FavPage/FavoritePage.tsx**
Gestión completa de playlists.

**Características:**
- Listar playlists del usuario (privadas)
- Listar playlists públicas
- Crear, editar, eliminar playlists
- Mosaico de portada (4 miniaturas)
- Reproducir playlists

**Ejemplo de uso:**
```typescript
const createPlaylist = async (name: string, songs: Song[]) => {
  const songIds = songs.map(s => s.id);
  await playlistService.createPlaylistWithSongs(name, songIds, userId);
};
```

#### **MusicPlayer.tsx**
Reproductor de audio global.

**Características:**
- Reproducción continua
- Controles: Play/Pause, Next, Previous
- Barra de progreso interactiva
- Cola de reproducción
- Volumen ajustable

**Ejemplo de uso:**
```typescript
const { currentSong, playSong, pauseSong, nextSong } = useMusicContext();

// Reproducir canción
playSong(song, queue);
```

---

## 🎵 Funcionalidades Principales

### **1. Descubrimiento de Música por Géneros**

65 géneros disponibles organizados en familias:

**Metal:**
- Heavy Metal, Death Metal, Thrash Metal, Black Metal, Industrial Metal, Heavy Metal Argentino, Heavy Metal Latino

**Rock:**
- Rock, Rock Argentino, Rock Latino, Alternative Rock, Indie Rock, Soft Rock, Glam Rock, Progressive Rock, Grunge

**Latino:**
- Cumbia, Reggaeton, Salsa, Bachata, Merengue, Cumbia Villera, Cumbia 420, Corridos Tumbados

**Electrónica:**
- Techno, House, Trance, Dubstep, EDM, Drum and Bass, Lofi, Hyperpop

**Otros:**
- Hip Hop, Rap, Trap, Jazz, Blues, Country, K-pop, J-pop, Ska, Punk, Opera, Tango

### **2. Búsqueda Inteligente**

Sistema híbrido:
1. Busca primero en BD local (rápido)
2. Luego busca en YouTube (completo)
3. Permite agregar canciones de YouTube a BD

```typescript
// Ejemplo de búsqueda
const results = await musicService.searchSmart('metallica', 20);

// Resultado
{
  fromDatabase: [
    { id: '...', title: 'Enter Sandman', artist: 'Metallica', ... }
  ],
  fromYoutube: [
    { videoId: '...', title: 'Nothing Else Matters', artist: 'Metallica', ... }
  ]
}
```

### **3. Gestión de Playlists**

**Crear Playlist:**
```typescript
await playlistService.createPlaylistWithSongs(
  "Mi Playlist Rock",
  ['song-uuid-1', 'song-uuid-2', 'song-uuid-3'],
  userId
);
```

**Editar Playlist:**
```typescript
// Actualizar nombre
await playlistService.updatePlaylist(playlistId, { name: "Nuevo Nombre" });

// Reemplazar canciones
await playlistService.replaceSongs(playlistId, ['uuid-1', 'uuid-2']);
```

**Características:**
- Máximo 15 playlists por usuario
- Máximo 30 canciones por playlist
- Nombres únicos por usuario
- Mosaico automático con primeras 4 canciones
- Playlists públicas y privadas

### **4. Reproductor de Música**

**Context Global:**
```typescript
const {
  currentSong,      // Canción actual
  isPlaying,        // Estado de reproducción
  playSong,         // Reproducir canción
  pauseSong,        // Pausar
  resumeSong,       // Reanudar
  nextSong,         // Siguiente
  previousSong,     // Anterior
  queue,            // Cola de reproducción
} = useMusicContext();
```

**Reproducir Playlist Completa:**
```typescript
const handlePlayPlaylist = async (playlistId: string) => {
  const playlist = await playlistService.getPlaylistWithSongs(playlistId);
  if (playlist.songs.length > 0) {
    playSong(playlist.songs[0], playlist.songs);
  }
};
```

---

## 🌐 Integración con Backend

### **Endpoints Utilizados**

**Música (públicos):**
```
GET  /music/search-smart?query=...&maxResults=20  # Búsqueda híbrida
GET  /music/random?genre=rock&limit=10            # Canciones aleatorias
GET  /music/songs                                 # Listar canciones
POST /music/songs                                 # Guardar de YouTube
```

**Playlists (requieren autenticación):**
```
GET    /playlists                        # Mis playlists + públicas
GET    /playlists/:id                    # Ver playlist
GET    /playlists/:id/songs              # Canciones de playlist
POST   /playlists                        # Crear playlist
PUT    /playlists/:id                    # Editar nombre
DELETE /playlists/:id                    # Eliminar playlist
PUT    /playlists/:id/songs              # Reemplazar canciones
POST   /playlists/:id/songs/batch        # Agregar múltiples
DELETE /playlists/:id/songs/:songId      # Quitar canción
PATCH  /playlists/:id/songs/reorder      # Reordenar
```

**Autenticación:**
```
POST /auth/google                        # Login con Google OAuth
GET  /auth/me                            # Obtener usuario actual
```

---

## 🎨 Best Practices Implementadas

### **1. Miniaturas de YouTube**

Generadas dinámicamente (no guardadas en BD):

```typescript
const getThumbnail = (youtubeId: string) => {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
};
```

### **2. TypeScript Strict Mode**

Todas las interfaces están tipadas:

```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  duration: number;
  genre: string;
  cloudinaryUrl?: string;
  viewCount?: number;
}

interface Playlist {
  id: string;
  name: string;
  userId: string;
  isPublic: boolean;
  songCount: number;
  totalDuration: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}
```

### **3. Axios Interceptors**

Configurados para agregar cookies automáticamente:

```typescript
// axiosInstance.ts
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,  // ← Envía cookies automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Logs de requests (desarrollo)
apiClient.interceptors.request.use((config) => {
  console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado → redirigir a login
      window.location.href = 'http://localhost:5173';
    }
    return Promise.reject(error);
  }
);
```

### **4. Context API para Estado Global**

```typescript
// MusicContext.tsx
export const MusicProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = (song: Song, newQueue: Song[]) => {
    setCurrentSong(song);
    setQueue(newQueue);
    setIsPlaying(true);
  };

  return (
    <MusicContext.Provider value={{ currentSong, queue, isPlaying, playSong }}>
      {children}
    </MusicContext.Provider>
  );
};
```

### **5. Custom Hooks Reutilizables**

```typescript
// useGenres.ts
export const useGenres = () => {
  const genreFamilies = useMemo(() => [
    { id: 'metal', name: 'Metal', genres: ['heavyMetal', 'deathMetal', ...] },
    { id: 'rock', name: 'Rock', genres: ['rock', 'rockArgentino', ...] },
    // ... 65 géneros totales
  ], []);

  const allIndividualGenres = useMemo(() =>
    genreFamilies.flatMap(family => family.genres),
  [genreFamilies]);

  return { genreFamilies, allIndividualGenres };
};
```

---

## 🏗️ Build para Producción

### **Compilar para producción**

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

### **Servir Build**

Los builds estáticos se pueden servir con:
- **Vercel** (recomendado)
- **Netlify**
- **Railway**
- **Nginx**
- Cualquier servidor estático

**Configuración Nginx:**
```nginx
server {
  listen 80;
  server_name vibra.com;
  root /var/www/vibraApp/dist;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## 🐛 Troubleshooting

### **Error: CORS Blocked**

**Causa:** Backend no tiene habilitado CORS para tu origen

**Solución:**
```typescript
// Backend main.ts
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
});
```

### **Error: 401 Unauthorized**

**Causa:** Cookie `token_vibra` no está siendo enviada

**Solución:**
```typescript
// Verificar en DevTools > Application > Cookies
// Debe existir: token_vibra = eyJhbGciOi...

// Verificar axiosInstance.ts
withCredentials: true  // ← debe estar presente
```

### **Miniaturas de YouTube no aparecen**

**Causa:** YouTube bloqueó la URL o video no existe

**Solución:**
- Verificar en Network tab que `img.youtube.com` responda 200
- Usar placeholder cuando `youtubeId` es inválido:
```typescript
<img
  src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
  onError={(e) => e.currentTarget.src = '/placeholder.png'}
/>
```

### **Reproductor no funciona**

**Causa:** Canción no tiene `cloudinaryUrl`

**Solución:** Verificar que las canciones en BD tengan el campo `cloudinaryUrl` poblado

### **Login con Google falla**

**Causa:** `GOOGLE_CLIENT_ID` incorrecto o no configurado

**Solución:**
1. Verificar `.env` en `vibraFront`
2. Verificar que el Client ID sea del mismo proyecto en Google Cloud Console
3. Verificar que `http://localhost:5173` esté en authorized origins

---

## 📝 Convenciones de Código

### **Nombres de Archivos**

- **Componentes**: PascalCase → `MusicPlayer.tsx`
- **Hooks**: camelCase con prefijo `use` → `usePlaylists.ts`
- **Services**: camelCase → `playlistService.ts`
- **Utils**: camelCase → `utilsMusic.ts`
- **CSS**: igual que componente → `MusicPlayer.css`

### **Estructura de Componentes**

```typescript
// Imports
import { useState, useEffect } from 'react';
import './ComponentName.css';

// Types
interface Props {
  title: string;
}

// Component
export function ComponentName({ title }: Props) {
  // State
  const [state, setState] = useState();

  // Effects
  useEffect(() => {}, []);

  // Handlers
  const handleClick = () => {};

  // Render
  return <div>{title}</div>;
}
```

---

## 📚 Recursos

- **React Docs**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev
- **Axios**: https://axios-http.com/docs
- **Google OAuth**: https://developers.google.com/identity/gsi/web/guides/overview

---

## 👥 Autores

- Sergio Peckerle
- Diego Ortino
- Cristian Calvo
- Sebastián Allende

---

**Última actualización**: 2025-11-16
**Versión**: 3.0
**Proyecto**: VIBRA Frontend

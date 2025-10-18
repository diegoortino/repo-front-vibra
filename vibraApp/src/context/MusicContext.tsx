/**
 * Context de Música
 *
 * Proporciona estado global para:
 * - Canción actual reproduciéndose
 * - Playlist activa
 * - Estado de reproducción (playing/paused)
 * - Controles del reproductor
 *
 * Este Context permite que cualquier componente acceda y controle
 * el reproductor sin necesidad de pasar props manualmente.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import type { Song } from '../types';

/**
 * Tipo del contexto de música
 */
interface MusicContextType {
  // Estado actual
  currentSong: Song | null;
  playlist: Song[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isShuffle: boolean;

  // Acciones de reproducción
  playSong: (song: Song, playlist?: Song[]) => void;
  loadSong: (song: Song, playlist?: Song[]) => void;
  pauseSong: () => void;
  togglePlayPause: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekToSong: (index: number) => void;

  // Acciones de playlist
  setPlaylist: (songs: Song[]) => void;
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (songId: string) => void;
  clearPlaylist: () => void;

  // Acciones de configuración
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
}

/**
 * Crear el contexto
 */
const MusicContext = createContext<MusicContextType | undefined>(undefined);

/**
 * Props del Provider
 */
interface MusicProviderProps {
  children: ReactNode;
}

/**
 * Provider del contexto de música
 *
 * Envuelve la aplicación para proporcionar estado global de música
 *
 * @example
 * ```tsx
 * <MusicProvider>
 *   <App />
 * </MusicProvider>
 * ```
 */
export function MusicProvider({ children }: MusicProviderProps) {
  // Estado
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylistState] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(80); // 0-100
  const [isShuffle, setIsShuffle] = useState(false);

  /**
   * Cargar una canción sin reproducirla (solo mostrar info y miniatura)
   */
  const loadSong = useCallback(
    (song: Song, newPlaylist?: Song[]) => {
      setCurrentSong(song);
      setIsPlaying(false); // NO reproducir automáticamente

      // Si se proporciona una nueva playlist
      if (newPlaylist) {
        setPlaylistState(newPlaylist);
        const index = newPlaylist.findIndex((s) => s.id === song.id);
        setCurrentIndex(index >= 0 ? index : 0);
      } else if (playlist.length > 0) {
        // Si ya hay playlist, buscar el índice de la canción
        const index = playlist.findIndex((s) => s.id === song.id);
        setCurrentIndex(index >= 0 ? index : 0);
      } else {
        // Si no hay playlist, crear una con solo esta canción
        setPlaylistState([song]);
        setCurrentIndex(0);
      }

      console.log('📀 Canción cargada (sin reproducir):', song.title, 'por', song.artist);
    },
    [playlist]
  );

  /**
   * Reproducir una canción
   */
  const playSong = useCallback(
    (song: Song, newPlaylist?: Song[]) => {
      setCurrentSong(song);
      setIsPlaying(true);

      // Si se proporciona una nueva playlist
      if (newPlaylist) {
        setPlaylistState(newPlaylist);
        const index = newPlaylist.findIndex((s) => s.id === song.id);
        setCurrentIndex(index >= 0 ? index : 0);
      } else if (playlist.length > 0) {
        // Si ya hay playlist, buscar el índice de la canción
        const index = playlist.findIndex((s) => s.id === song.id);
        setCurrentIndex(index >= 0 ? index : 0);
      } else {
        // Si no hay playlist, crear una con solo esta canción
        setPlaylistState([song]);
        setCurrentIndex(0);
      }

      console.log('🎵 Reproduciendo:', song.title, 'por', song.artist);
    },
    [playlist]
  );

  /**
   * Pausar la canción actual
   */
  const pauseSong = useCallback(() => {
    setIsPlaying(false);
    console.log('⏸️ Pausado');
  }, []);

  /**
   * Toggle play/pause
   */
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
    console.log(isPlaying ? '⏸️ Pausado' : '▶️ Reproduciendo');
  }, [isPlaying]);

  /**
   * Siguiente canción
   */
  const nextSong = useCallback(() => {
    if (playlist.length === 0) return;

    let nextIndex: number;

    if (isShuffle) {
      // Modo aleatorio: canción random (diferente a la actual)
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex && playlist.length > 1);
    } else {
      // Modo normal: siguiente canción
      nextIndex = currentIndex + 1;

      // Si llegó al final, volver al inicio (loop automático)
      if (nextIndex >= playlist.length) {
        nextIndex = 0;
        console.log('🔁 Fin de la playlist - Volviendo al inicio');
      }
    }

    if (nextIndex < playlist.length) {
      const nextSong = playlist[nextIndex];
      setCurrentSong(nextSong);
      setCurrentIndex(nextIndex);
      setIsPlaying(true);
      console.log('⏭️ Siguiente:', nextSong.title);
    }
  }, [playlist, currentIndex, isShuffle]);

  /**
   * Canción anterior
   */
  const prevSong = useCallback(() => {
    if (playlist.length === 0) return;

    let prevIndex = currentIndex - 1;

    // Si está al inicio, ir al final (loop automático)
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }

    if (prevIndex >= 0 && prevIndex < playlist.length) {
      const prevSongData = playlist[prevIndex];
      setCurrentSong(prevSongData);
      setCurrentIndex(prevIndex);
      setIsPlaying(true);
      console.log('⏮️ Anterior:', prevSongData.title);
    }
  }, [playlist, currentIndex]);

  /**
   * Ir a una canción específica por índice
   */
  const seekToSong = useCallback(
    (index: number) => {
      if (index >= 0 && index < playlist.length) {
        const song = playlist[index];
        setCurrentSong(song);
        setCurrentIndex(index);
        setIsPlaying(true);
        console.log('🎯 Ir a:', song.title);
      }
    },
    [playlist]
  );

  /**
   * Establecer playlist
   */
  const setPlaylist = useCallback((songs: Song[]) => {
    setPlaylistState(songs);
    console.log('📃 Playlist actualizada:', songs.length, 'canciones');
  }, []);

  /**
   * Agregar canción a playlist
   */
  const addToPlaylist = useCallback((song: Song) => {
    setPlaylistState((prev) => {
      // Evitar duplicados
      if (prev.some((s) => s.id === song.id)) {
        console.log('⚠️ Canción ya está en la playlist');
        return prev;
      }
      console.log('➕ Agregada a playlist:', song.title);
      return [...prev, song];
    });
  }, []);

  /**
   * Quitar canción de playlist
   */
  const removeFromPlaylist = useCallback(
    (songId: string) => {
      setPlaylistState((prev) => {
        const newPlaylist = prev.filter((s) => s.id !== songId);

        // Si se eliminó la canción actual, reproducir la siguiente
        if (currentSong?.id === songId && newPlaylist.length > 0) {
          const newIndex = Math.min(currentIndex, newPlaylist.length - 1);
          setCurrentSong(newPlaylist[newIndex]);
          setCurrentIndex(newIndex);
        }

        console.log('➖ Quitada de playlist');
        return newPlaylist;
      });
    },
    [currentSong, currentIndex]
  );

  /**
   * Limpiar playlist
   */
  const clearPlaylist = useCallback(() => {
    setPlaylistState([]);
    setCurrentSong(null);
    setCurrentIndex(0);
    setIsPlaying(false);
    console.log('🗑️ Playlist limpiada');
  }, []);

  /**
   * Establecer volumen
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    console.log('🔊 Volumen:', clampedVolume);
  }, []);

  /**
   * Toggle modo aleatorio
   */
  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      console.log(prev ? '🔀 Shuffle OFF' : '🔀 Shuffle ON');
      return !prev;
    });
  }, []);

  // Valor del contexto memoizado
  const value = useMemo(
    () => ({
      // Estado
      currentSong,
      playlist,
      currentIndex,
      isPlaying,
      volume,
      isShuffle,

      // Acciones de reproducción
      playSong,
      loadSong,
      pauseSong,
      togglePlayPause,
      nextSong,
      prevSong,
      seekToSong,

      // Acciones de playlist
      setPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      clearPlaylist,

      // Acciones de configuración
      setVolume,
      toggleShuffle,
    }),
    [
      currentSong,
      playlist,
      currentIndex,
      isPlaying,
      volume,
      isShuffle,
      playSong,
      loadSong,
      pauseSong,
      togglePlayPause,
      nextSong,
      prevSong,
      seekToSong,
      setPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      clearPlaylist,
      setVolume,
      toggleShuffle,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

/**
 * Hook para usar el contexto de música
 *
 * @throws Error si se usa fuera del MusicProvider
 * @returns Contexto de música
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentSong, playSong, isPlaying } = useMusicContext();
 *
 *   return (
 *     <div>
 *       <p>Reproduciendo: {currentSong?.title}</p>
 *       <button onClick={() => playSong(someSong)}>Play</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMusicContext() {
  const context = useContext(MusicContext);

  if (context === undefined) {
    throw new Error('useMusicContext debe usarse dentro de un MusicProvider');
  }

  return context;
}

export default MusicContext;

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Song } from "../types";
import { UserContext } from "./currentUserContext";
import { useImages } from "../hooks/useImages";

/* ──────────────────────────────────────────────────────────────
 *  Tipos públicos
 * ────────────────────────────────────────────────────────────── */

export type Track = Partial<Song> & {
  youtubeId: string;
  title: string;
};

export type MusicContextValue = {
  idsCanciones: string[];
  indiceActual: number;
  setIndiceActual: (indice: number) => void;
  urlsImagenes: string[];
  nombrePlaylist?: string;
  reproduciendo: boolean;
  setReproduciendo: (valor: boolean) => void;
  playlist: Song[];
  currentSong: Song | null;
  playSong: (song: Song, songs?: Song[]) => void;
  loadSong: (song: Song, songs?: Song[]) => void;
  updatePlaylist: (songs: Song[]) => void; // Actualizar playlist sin cambiar canción actual
  randomSongs: Song[];
  setRandomSongs: (songs: Song[]) => void;
  currentPlaylistId: string | null;
  setCurrentPlaylistId: (id: string | null) => void;

  // 🔎 Estado de imágenes (hook useImages)
  imagesLoading: boolean;
  imagesError: string | null;
};

/* ──────────────────────────────────────────────────────────────
 *  Contexto base
 * ────────────────────────────────────────────────────────────── */

const MusicContext = createContext<MusicContextValue | undefined>(undefined);

type MusicProviderProps = {
  children: ReactNode;
  songs?: Track[];
  images?: string[];
  playlistName?: string;
  startIndex?: number;
};

/* ──────────────────────────────────────────────────────────────
 *  Helpers puros
 * ────────────────────────────────────────────────────────────── */

const crearIdPista = (track: Track, index: number) =>
  track.id ?? `${track.youtubeId}-${index}`;

const normalizarTrack = (track: Track, index: number): Song => ({
  id: crearIdPista(track, index),
  title: track.title,
  artist: track.artist ?? "Artista desconocido",
  youtubeId: track.youtubeId,
  duration: track.duration ?? 0,
  genre: track.genre,
  viewCount: track.viewCount,
  publishedAt: track.publishedAt,
  cloudinaryUrl: track.cloudinaryUrl,
  createdAt: track.createdAt,
  updatedAt: track.updatedAt,
});

const normalizarCancion = (song: Song): Song => {
  if (!song) {
    throw new Error("Cannot normalize null/undefined song");
  }

  return {
    ...song,
    id: song.id ?? song.youtubeId,
    artist: song.artist ?? "Artista desconocido",
    duration: song.duration ?? 0,
  };
};

const coincidenCanciones = (a: Song, b: Song) => {
  if (a.id && b.id) {
    return a.id === b.id;
  }
  return a.youtubeId === b.youtubeId;
};

const generarMiniatura = (song: Song) =>
  song.cloudinaryUrl ?? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`;

/* ──────────────────────────────────────────────────────────────
 *  Provider
 * ────────────────────────────────────────────────────────────── */

export const MusicProvider = ({
  children,
  songs = [],
  images = [],
  playlistName,
  startIndex = 0,
}: MusicProviderProps) => {
  /* 1) Derivados iniciales a partir de props */

  const pistasIniciales = useMemo(
    () => songs.map((track, index) => normalizarTrack(track, index)),
    [songs]
  );

  /* 2) Estado base + refs */

  const [playlist, setPlaylistState] = useState<Song[]>(pistasIniciales);
  const playlistRef = useRef<Song[]>(pistasIniciales);

  const normalizarIndice = useCallback((indice: number, base: Song[]) => {
    if (base.length === 0) return 0;
    if (indice < 0) return 0;
    if (indice >= base.length) return base.length - 1;
    return indice;
  }, []);

  const [indiceActual, setIndiceActualState] = useState<number>(() =>
    normalizarIndice(startIndex, pistasIniciales)
  );

  const [reproduciendoInterno, setReproduciendoInterno] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState<string | undefined>(
    playlistName
  );
  const [randomSongs, setRandomSongsState] = useState<Song[]>([]);
  const [currentPlaylistId, setCurrentPlaylistIdState] = useState<string | null>(
    null
  );

  /* 3) Contextos externos + hooks auxiliares */

  const userContext = useContext(UserContext);
  if (!userContext) {
    console.error("UserContext no está disponible");
  }
  const { user } = userContext ?? { user: null };

  const {
    images: fetchedImages,
    loading: imagesLoading,
    error: imagesError,
    fetchImages,
    resetImages,
  } = useImages();

  /* 4) Helpers de estado derivados de playlist */

  const setPlaylist = useCallback(
    (updater: Song[] | ((prev: Song[]) => Song[])) => {
      setPlaylistState((prev) => {
        const resultado =
          typeof updater === "function"
            ? (updater as (prev: Song[]) => Song[])(prev)
            : updater;

        playlistRef.current = resultado;
        return resultado;
      });
    },
    []
  );

  const idsCanciones = useMemo(
    () => playlist.map((song) => song.youtubeId),
    [playlist]
  );

  const currentSong = useMemo(
    () => playlist[indiceActual] ?? null,
    [playlist, indiceActual]
  );

  /* 5) Efectos de sincronización */

  // Sincroniza playlist inicial si viene vacía pero hay pistas iniciales
  useEffect(() => {
    if (playlistRef.current.length === 0 && pistasIniciales.length > 0) {
      playlistRef.current = pistasIniciales;
      setPlaylistState(pistasIniciales);
      setIndiceActualState(normalizarIndice(startIndex, pistasIniciales));
      setNombrePlaylist((prev) => prev ?? playlistName);
    }
  }, [normalizarIndice, pistasIniciales, playlistName, startIndex]);

  // Ajusta índice actual si se sale del rango al cambiar la playlist
  useEffect(() => {
    if (indiceActual >= playlist.length) {
      setIndiceActualState((prev) =>
        prev === 0 ? 0 : normalizarIndice(prev, playlist)
      );
    }
  }, [indiceActual, normalizarIndice, playlist]);

  // 🔥 Cuando cambia la canción actual, pedimos imágenes
  useEffect(() => {
    if (currentSong?.genre) {
      const genre = currentSong.genre;

      console.log(
        "[MusicContext] pidiendo imágenes para genre:",
        genre,
        "duration:",
        currentSong.duration
      );

      fetchImages(genre, currentSong.duration ?? 0);
    } else {
      console.log("[MusicContext] currentSong sin genre, reseteando imágenes.");
      resetImages();
    }
  }, [currentSong, fetchImages, resetImages]);

  /* 6) Callbacks de control simple */

  const setIndiceActual = useCallback(
    (indice: number) => {
      const base = playlistRef.current;
      const corregido = normalizarIndice(indice, base);
      setIndiceActualState(corregido);
    },
    [normalizarIndice]
  );

  const setReproduciendo = useCallback((valor: boolean) => {
    setReproduciendoInterno(valor);
  }, []);

  const setRandomSongs = useCallback((songs: Song[]) => {
    setRandomSongsState(songs.map(normalizarCancion));
  }, []);

  const setCurrentPlaylistId = useCallback((id: string | null) => {
    setCurrentPlaylistIdState(id);
  }, []);

  /* 7) Lógica de dominio: actualización de playlist / reproducción */

  const actualizarPlaylistConCancion = useCallback(
    (song: Song, songsLista: Song[] | undefined, autoPlay?: boolean) => {
      console.log("🎵 [MusicContext] actualizarPlaylistConCancion llamado");
      console.log("🎵 [MusicContext] Canción:", song.title);
      console.log(
        "🎵 [MusicContext] songsLista recibida:",
        songsLista?.length ?? "undefined"
      );

      if (songsLista && songsLista.length === 0) {
        setPlaylist([]);
        setIndiceActualState(0);
        if (autoPlay !== undefined) setReproduciendoInterno(autoPlay);
        return;
      }

      const objetivo = normalizarCancion(song);

      if (songsLista && songsLista.length > 0) {
        const normalizados = songsLista.map(normalizarCancion);
        console.log(
          "🎵 [MusicContext] Canciones normalizadas:",
          normalizados.length
        );

        let indice = normalizados.findIndex((item) =>
          coincidenCanciones(item, objetivo)
        );

        let listaFinal = normalizados;
        if (indice === -1) {
          listaFinal = [...normalizados, objetivo];
          indice = listaFinal.length - 1;
        }

        console.log(
          "🎵 [MusicContext] Lista final:",
          listaFinal.length,
          "canciones"
        );
        console.log("🎵 [MusicContext] Índice seleccionado:", indice);

        setPlaylist(listaFinal);
        setIndiceActualState(normalizarIndice(indice, listaFinal));
        setNombrePlaylist((prev) => prev ?? playlistName);
      } else {
        setPlaylist((prev) => {
          let indice = prev.findIndex((item) =>
            coincidenCanciones(item, objetivo)
          );

          let listaFinal = prev;
          if (indice === -1) {
            listaFinal = [...prev, objetivo];
            indice = listaFinal.length - 1;
          }

          setIndiceActualState(normalizarIndice(indice, listaFinal));
          return listaFinal;
        });
      }

      if (autoPlay !== undefined) {
        setReproduciendoInterno(autoPlay);
      }
    },
    [normalizarIndice, playlistName, setPlaylist]
  );

  const loadSong = useCallback(
    (song: Song, songsLista?: Song[]) => {
      actualizarPlaylistConCancion(song, songsLista, false);
    },
    [actualizarPlaylistConCancion]
  );

  const playSong = useCallback(
    async (song: Song, songsLista?: Song[]) => {
      actualizarPlaylistConCancion(song, songsLista, true);
      if (!user?.id) return;

      try {
        const backendUrl =
          import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000";

        await fetch(`${backendUrl}/user-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: { id: user.id },
            songId: song.id ?? undefined, // solo si existe en DB
            youtubeId: song.youtubeId, // siempre presente
          }),
        });
      } catch (err) {
        console.error("Error al registrar canción en historial:", err);
      }
    },
    [actualizarPlaylistConCancion, user]
  );

  // Actualizar playlist sin cambiar canción actual
  const updatePlaylist = useCallback(
    (songs: Song[]) => {
      const normalizados = songs.map(normalizarCancion);

      setPlaylist(() => {
        if (currentSong) {
          const nuevoIndice = normalizados.findIndex((item) =>
            coincidenCanciones(item, currentSong)
          );

          if (nuevoIndice !== -1 && nuevoIndice !== indiceActual) {
            setIndiceActualState(nuevoIndice);
          } else if (nuevoIndice === -1) {
            setIndiceActualState(0);
          }
        }

        return normalizados;
      });
      // NO tocamos reproduciendo - la música sigue igual
    },
    [setPlaylist, currentSong, indiceActual]
  );

  /* 8) Imágenes a mostrar (hook + miniaturas + fallback) */

  const urlsImagenes = useMemo(() => {
    // 1) primero, las del backend (hook)
    if (fetchedImages.length > 0) {
      return fetchedImages.map((img) => img.thumbnailUrl ?? img.imageUrl);
    }

    // 2) luego, miniaturas generadas desde la playlist
    if (playlist.length > 0) {
      return playlist.map(generarMiniatura);
    }

    // 3) fallback: las que vengan por props
    return images;
  }, [fetchedImages, playlist, images]);

  /* 9) Valor memoizado del contexto */

  const value = useMemo<MusicContextValue>(
    () => ({
      idsCanciones,
      indiceActual,
      setIndiceActual,
      urlsImagenes,
      nombrePlaylist,
      reproduciendo: reproduciendoInterno,
      setReproduciendo,
      playlist,
      currentSong,
      playSong,
      loadSong,
      updatePlaylist,
      randomSongs,
      setRandomSongs,
      currentPlaylistId,
      setCurrentPlaylistId,
      imagesLoading,
      imagesError,
    }),
    [
      idsCanciones,
      indiceActual,
      setIndiceActual,
      urlsImagenes,
      nombrePlaylist,
      reproduciendoInterno,
      setReproduciendo,
      playlist,
      currentSong,
      playSong,
      loadSong,
      updatePlaylist,
      randomSongs,
      setRandomSongs,
      currentPlaylistId,
      setCurrentPlaylistId,
      imagesLoading,
      imagesError,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

/* ──────────────────────────────────────────────────────────────
 *  Hook de consumo
 * ────────────────────────────────────────────────────────────── */

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusicContext debe usarse dentro de un MusicProvider");
  }
  return context;
};

export default MusicContext;

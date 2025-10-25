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
  randomSongs: Song[];
  setRandomSongs: (songs: Song[]) => void;
  currentPlaylistId: string | null;
  setCurrentPlaylistId: (id: string | null) => void;
};

const MusicContext = createContext<MusicContextValue | undefined>(undefined);

type MusicProviderProps = {
  children: ReactNode;
  songs?: Track[];
  images?: string[];
  playlistName?: string;
  startIndex?: number;
};

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

const normalizarCancion = (song: Song): Song => ({
  ...song,
  id: song.id ?? song.youtubeId,
  artist: song.artist ?? "Artista desconocido",
  duration: song.duration ?? 0,
});

const coincidenCanciones = (a: Song, b: Song) => {
  if (a.id && b.id) {
    return a.id === b.id;
  }
  return a.youtubeId === b.youtubeId;
};

const generarMiniatura = (song: Song) =>
  song.cloudinaryUrl ?? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`;

export const MusicProvider = ({
  children,
  songs = [],
  images = [],
  playlistName,
  startIndex = 0,
}: MusicProviderProps) => {
  const pistasIniciales = useMemo(
    () => songs.map((track, index) => normalizarTrack(track, index)),
    [songs]
  );

  const [playlist, setPlaylistState] = useState<Song[]>(pistasIniciales);
  const playlistRef = useRef<Song[]>(pistasIniciales);

  const normalizarIndice = useCallback(
    (indice: number, base: Song[]) => {
      if (base.length === 0) return 0;
      if (indice < 0) return 0;
      if (indice >= base.length) return base.length - 1;
      return indice;
    },
    []
  );

  const [indiceActual, setIndiceActualState] = useState<number>(() =>
    normalizarIndice(startIndex, pistasIniciales)
  );
  const [reproduciendoInterno, setReproduciendoInterno] = useState(false);
  const [nombrePlaylist, setNombrePlaylist] = useState<string | undefined>(playlistName);
  const [randomSongs, setRandomSongsState] = useState<Song[]>([]);
  const [currentPlaylistId, setCurrentPlaylistIdState] = useState<string | null>(null);

  const setPlaylist = useCallback(
    (updater: Song[] | ((prev: Song[]) => Song[])) => {
      setPlaylistState((prev) => {
        const resultado =
          typeof updater === "function" ? (updater as (prev: Song[]) => Song[])(prev) : updater;
        playlistRef.current = resultado;
        return resultado;
      });
    },
    []
  );

  useEffect(() => {
    // Si el provider recibe nuevas pistas iniciales y todavía no hay playlist activa,
    // usamos ese valor por defecto.
    if (playlistRef.current.length === 0 && pistasIniciales.length > 0) {
      playlistRef.current = pistasIniciales;
      setPlaylistState(pistasIniciales);
      setIndiceActualState(normalizarIndice(startIndex, pistasIniciales));
      setNombrePlaylist((prev) => prev ?? playlistName);
    }
  }, [normalizarIndice, pistasIniciales, playlistName, startIndex]);

  useEffect(() => {
    if (indiceActual >= playlist.length) {
      setIndiceActualState((prev) =>
        prev === 0 ? 0 : normalizarIndice(prev, playlist)
      );
    }
  }, [indiceActual, normalizarIndice, playlist]);

  const idsCanciones = useMemo(
    () => playlist.map((song) => song.youtubeId),
    [playlist]
  );

  const urlsImagenes = useMemo(() => {
    if (playlist.length > 0) {
      return playlist.map(generarMiniatura);
    }
    return images;
  }, [playlist, images]);

  const currentSong = useMemo(
    () => playlist[indiceActual] ?? null,
    [playlist, indiceActual]
  );

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

  const actualizarPlaylistConCancion = useCallback(
    (song: Song, songsLista: Song[] | undefined, autoPlay?: boolean) => {
      if (songsLista && songsLista.length === 0) {
        setPlaylist([]);
        setIndiceActualState(0);
        if (autoPlay !== undefined) setReproduciendoInterno(autoPlay);
        return;
      }

      const objetivo = normalizarCancion(song);

      if (songsLista && songsLista.length > 0) {
        const normalizados = songsLista.map(normalizarCancion);
        let indice = normalizados.findIndex((item) => coincidenCanciones(item, objetivo));
        let listaFinal = normalizados;
        if (indice === -1) {
          listaFinal = [...normalizados, objetivo];
          indice = listaFinal.length - 1;
        }
        setPlaylist(listaFinal);
        setIndiceActualState(normalizarIndice(indice, listaFinal));
        setNombrePlaylist((prev) => prev ?? playlistName);
      } else {
        setPlaylist((prev) => {
          let indice = prev.findIndex((item) => coincidenCanciones(item, objetivo));
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
    (song: Song, songsLista?: Song[]) => {
      actualizarPlaylistConCancion(song, songsLista, true);
    },
    [actualizarPlaylistConCancion]
  );

  const setRandomSongs = useCallback((songs: Song[]) => {
    setRandomSongsState(songs.map(normalizarCancion));
  }, []);

  const setCurrentPlaylistId = useCallback((id: string | null) => {
    setCurrentPlaylistIdState(id);
  }, []);

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
      randomSongs,
      setRandomSongs,
      currentPlaylistId,
      setCurrentPlaylistId,
    }),
    [
      currentPlaylistId,
      currentSong,
      idsCanciones,
      indiceActual,
      loadSong,
      nombrePlaylist,
      playlist,
      playSong,
      randomSongs,
      reproduciendoInterno,
      setIndiceActual,
      setReproduciendo,
      urlsImagenes,
      setRandomSongs,
      setCurrentPlaylistId,
    ]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusicContext debe usarse dentro de un MusicProvider");
  }
  return context;
};

// Sebas estoy usando estos tres métodos para tomar la data desde el player, hay que trabajar acá en el MusicContext para conectar todo bien. por ahora lo deje harcodeado para testear

export const playlistToPlayer= () => {

  const LISTA_REPRODUCCION = [
    { id: "iKI5q_hF0o0" },
    { id: "Ulnobym-Ouo" },
    { id: "N0Ovqd-epOI" },
    { id: "eUlGF_8r5Ac" },
    { id: "hXYCrTX-l24" },
  ];
  return LISTA_REPRODUCCION;

}

export const imagelistToPlayer= () => {

  const IMAGENES_VISUALIZADOR: string[] = [
    "https://indiehoy.com/wp-content/uploads/2025/08/eterna-inocencia.webp",
    "https://es.rollingstone.com/wp-content/uploads/2022/11/eterna-inocencia.jpg",
    "https://www.nacionrock.com/wp-content/uploads/IMG_2236.webp",
    "https://www.ultrabrit.com/wp-content/uploads/2017/08/eterna-inocencia-guillermo-marmol-1.jpg",
    "https://static.esnota.com/uploads/2021/12/Guille.jpg",
    "https://planetacabezon.com/06-2023/resize_1686602016.jpg",
    "https://www.notaalpie.com.ar/wp-content/uploads/2023/08/6-Credito-Yoel-Alderisi-1.jpg",
    "https://www.futuro.cl/wp-content/uploads/2023/11/eterna-inocencia-768x433.webp",
    "https://acordesweb.com/img/eterna-inocencia-f7cc82cdfecfa0e11aa8168dee01fa8a.jpg",
    "https://cdn.rock.com.ar/wp-content/uploads/2024/01/eterna-inocencia-2.jpeg"
  ];
  return IMAGENES_VISUALIZADOR;
}

export const songToPlayer= () => {

  const SONG_TO_PLAY = { id: "iKI5q_hF0o0" };
  return SONG_TO_PLAY;
  
}

export default MusicContext;

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
    { id: "Nco_kh8xJDs" },     // Would? :contentReference[oaicite:1]{index=1}
    { id: "TAqZb52sgpU" },     // Man in the Box :contentReference[oaicite:2]{index=2}
    { id: "zTuD8k3JvxQ" },     // Them Bones :contentReference[oaicite:3]{index=3}
    { id: "nWK0kqjPSVI" },     // Down in a Hole (MTV Unplugged) :contentReference[oaicite:4]{index=4}
    { id: "IpEXM1Yziws" },     // Angry Chair :contentReference[oaicite:5]{index=5}
    { id: "SBcADQziQWY" },     // Check My Brain :contentReference[oaicite:6]{index=6}
    { id: "b3EK6rLXeVQ" },     // Your Decision (4K Remastered) :contentReference[oaicite:7]{index=7}
    { id: "r80HF68KM8g" },     // No Excuses :contentReference[oaicite:8]{index=8}
    { id: "ODTv9Lt5WYs" },     // I Stay Away :contentReference[oaicite:9]{index=9}
    { id: "__biilMpnmw" },     // Again :contentReference[oaicite:10]{index=10}
    { id: "lr_tyst3SVE" },     // A Looking in View :contentReference[oaicite:11]{index=11}
    { id: "9sH7D8UmMKI" },     // Lesson Learned :contentReference[oaicite:12]{index=12}
    { id: "G23iLGhh9lo" },     // Nutshell (Official Audio) :contentReference[oaicite:13]{index=13}
    { id: "4nPVHJdbdWE" },     // Rainier Fog :contentReference[oaicite:14]{index=14}
    { id: "hHsjxQXnkpc" },     // Red Giant (video relacionado) :contentReference[oaicite:15]{index=15}
    { id: "gCxm0C_eXxY" },     // Last of My Kind (video) :contentReference[oaicite:16]{index=16}
    { id: "M9zhDf_Rp0U" },     // Acid Bubble (interactive video) :contentReference[oaicite:17]{index=17}
    { id: "adojS5sQNJw" },     // Private Hell (estudio vídeo) :contentReference[oaicite:18]{index=18}
    { id: "SZTQ7xlFFA8" },     // (otra pista vídeo del álbum) :contentReference[oaicite:19]{index=19}
    { id: "y6B1dgKQh34" },     // Check My Brain (otra versión) :contentReference[oaicite:20]{index=20}
    { id: "MNMqyrhPrXY" },     // Them Bones (2022 Remaster) :contentReference[oaicite:21]{index=21}
    { id: "zARYZk1gi7g" },     // Check My Brain (versión alternativa) :contentReference[oaicite:22]{index=22}
    { id: "luS73-YIoSo" },     // Them Bones (Lyrics) :contentReference[oaicite:23]{index=23}
    { id: "P47XMHylkeI" },     // Them Bones (Live Jools Holland) :contentReference[oaicite:24]{index=24}
    { id: "rDazG4m8SNk" },     // Check My Brain (otra) :contentReference[oaicite:25]{index=25}
  ];
  return LISTA_REPRODUCCION;

}

export const imagelistToPlayer= () => {

  const IMAGENES_VISUALIZADOR: string[] = [
    "https://rockbrotherspodcast.com/wp-content/uploads/2024/04/new-9.jpg",
    "https://lacarnemagazine.com/wp-content/uploads/2021/03/alice-in-chains-1-1200x675.jpg",
    "https://www.scienceofnoise.net/wp-content/uploads/2020/11/81bXiGNAFAL._SL1500_.jpg",
    "https://www.rollingstone.com/wp-content/uploads/2018/06/alice-in-chains-best-performances-ebd93499-c827-446c-9b67-2b512382ac83.jpg?w=800",
    "https://www.tiempoar.com.ar/wp-content/uploads/2022/09/AIC_Foto01_1992.jpeg",
    "https://i.guim.co.uk/img/static/sys-images/guardian/Pix/pictures/2011/3/9/1299671749750/Mike-Starr-Jerry-Cantrell-007.jpg?width=465&dpr=1&s=none&crop=none",
  ];
  return IMAGENES_VISUALIZADOR;
}

export const songToPlayer= () => {

  const SONG_TO_PLAY = { id: "Nco_kh8xJDs" };
  return SONG_TO_PLAY;
  
}

export default MusicContext;

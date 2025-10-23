import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** Tipos base */
export interface Track {
  id?: string;
  title?: string;
  artist?: string;
  youtubeId: string;
  duration?: number;
  imageUrl?: string;
  genre?: string;
}

/** Valor del contexto unificado */
interface MusicContextValue {
  // ===== API usada por MusicPlayer =====
  youtubeIdCurrent: string | null;
  youtubeIdNext: string | null;
  youtubeIdPrev: string | null;
  playlistName: string;
  playlistSongs: Track[];
  imageLinks: string[];
  setCurrentIndex: (index: number) => void;
  loadPlaylist: (opts: { name: string; songs: Track[]; images?: string[]; startIndex?: number }) => void;

  // ===== API usada por FavoritePage (compat) =====
  playSong: (song: Track, list?: Track[]) => void;
  loadSong: (song: Track, list?: Track[]) => void;
  currentSong: Track | null;
  playlist: Track[];
  randomSongs: Track[];
  setRandomSongs: (songs: Track[]) => void;
  currentPlaylistId: string | null;
  setCurrentPlaylistId: (id: string | null) => void;
}

const MusicContext = createContext<MusicContextValue | undefined>(undefined);

function normIndex(i: number, len: number) {
  return len > 0 ? ((i % len) + len) % len : 0;
}

export function MusicProvider({
  children,
  playlistName: initialName = "",
  songs: initialSongs = [],
  images: initialImages = [],
  startIndex = 0,
}: {
  children: ReactNode;
  playlistName?: string;
  songs?: Track[];
  images?: string[];
  startIndex?: number;
}) {
  // Estado común
  const [name, setName] = useState(initialName);
  const [songs, setSongs] = useState<Track[]>(initialSongs);
  const [images, setImages] = useState<string[]>(initialImages);
  const [currentIndex, setCurrentIndex] = useState<number>(normIndex(startIndex, initialSongs.length));

  // Estado extra para compatibilidad con FavoritePage
  const [currentSong, setCurrentSong] = useState<Track | null>(
    initialSongs[normIndex(startIndex, initialSongs.length)] ?? null
  );
  const [activePlaylist, setActivePlaylist] = useState<Track[]>(initialSongs);
  const [randomSongs, _setRandomSongs] = useState<Track[]>([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

  // Derivados para MusicPlayer
  const ids = useMemo(() => {
    if (!songs.length) {
      return { cur: null as string | null, next: null as string | null, prev: null as string | null };
    }
    const idx = normIndex(currentIndex, songs.length);
    const nextIdx = normIndex(idx + 1, songs.length);
    const prevIdx = normIndex(idx - 1, songs.length);
    return {
      cur: songs[idx]?.youtubeId ?? null,
      next: songs[nextIdx]?.youtubeId ?? null,
      prev: songs[prevIdx]?.youtubeId ?? null,
    };
  }, [songs, currentIndex]);

  // --- Sincronización clave: índice y canción actual ---
  useEffect(() => {
    if (!songs.length) {
      if (currentIndex !== 0) setCurrentIndex(0);
      if (currentSong !== null) setCurrentSong(null);
      return;
    }
    const idx = normIndex(currentIndex, songs.length);
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
      setCurrentSong(songs[idx] ?? null);
    } else {
      const target = songs[idx] ?? null;
      if (currentSong !== target) setCurrentSong(target);
    }
  }, [songs, currentIndex, currentSong]);

  // Helpers
  const setIndiceActual = (index: number) => {
    setCurrentIndex((prev) => (Number.isFinite(index) ? normIndex(index, songs.length) : prev));
    const idx = Number.isFinite(index) ? normIndex(index, songs.length) : currentIndex;
    setCurrentSong(songs[idx] ?? null);
  };

  const loadPlaylist = ({
    name: n,
    songs: s,
    images: imgs = [],
    startIndex: si = 0,
  }: {
    name: string;
    songs: Track[];
    images?: string[];
    startIndex?: number;
  }) => {
    const safeSongs = Array.isArray(s) ? s : [];
    setName(n);
    setSongs(safeSongs);
    setActivePlaylist(safeSongs);
    setImages(Array.isArray(imgs) ? imgs : []);
    const idx = normIndex(si, safeSongs.length);
    setCurrentIndex(idx);
    setCurrentSong(safeSongs[idx] ?? null);
  };

  // Métodos favoritos / compat
  const playSong = (song: Track, list?: Track[]) => {
    const base = Array.isArray(list) && list.length ? list : activePlaylist.length ? activePlaylist : songs;
    setActivePlaylist(base);
    setSongs(base); // fuente única para MusicPlayer
    setCurrentSong(song);
    const idx = base.findIndex((t) => t.id === song.id || t.youtubeId === song.youtubeId);
    setCurrentIndex(idx === -1 ? 0 : idx);
  };

  const loadSong = (song: Track, list?: Track[]) => {
    playSong(song, list);
  };

  const setRandomSongs = (arr: Track[]) => {
    _setRandomSongs(Array.isArray(arr) ? arr : []);
  };

  const value: MusicContextValue = {
    // MusicPlayer
    youtubeIdCurrent: ids.cur,
    youtubeIdNext: ids.next,
    youtubeIdPrev: ids.prev,
    playlistName: name,
    playlistSongs: songs,
    imageLinks: images,
    setCurrentIndex: setIndiceActual,
    loadPlaylist,

    // FavoritePage
    playSong,
    loadSong,
    currentSong,
    playlist: activePlaylist,
    randomSongs,
    setRandomSongs,
    currentPlaylistId,
    setCurrentPlaylistId,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

// Hook
export function useMusicContext() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicContext debe usarse dentro de <MusicProvider>");
  return ctx;
}

export default MusicContext;

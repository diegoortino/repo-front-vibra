import { useCallback } from "react";
import { useMusic } from "./useMusic";
import { useMusicContext } from "../context/MusicContext";

/* types */
import type { Song } from "../types";
import type { SearchProps } from "../types/searchProps";
import type { ResultProps } from "../types/resultProps";
import type { ReproduceProps } from "../types/reproduceProps";

/**
 * Custom hook para manejar búsqueda y reproducción de música
 * Encapsula la lógica de búsqueda, resultados y reproducción
 */
export const useSearchHandlers = (
  dataFromSearch: ResultProps[],
  setDataFromSearch: (data: ResultProps[]) => void
) => {
  const music = useMusic();
  const { playSong, setCurrentPlaylistId } = useMusicContext();

  /**
   * Maneja la búsqueda de canciones
   * Busca en DB y YouTube usando el endpoint search-smart
   */
  const handleSearch = useCallback(async (key: SearchProps) => {
    try {
      music.reset();
      const songs = await music.searchSmart(key.search, 20);
      setDataFromSearch(songs.length > 0 ? songs as ResultProps[] : []);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setDataFromSearch([]);
    }
  }, [music, setDataFromSearch]);

  /**
   * Reproduce una canción
   * Busca la canción en los resultados actuales y carga toda la lista como playlist
   */
  const handleReproduce = useCallback((key: ReproduceProps) => {
    if (!playSong || !key.id) {
      return;
    }

    const song = dataFromSearch.find(s => s.id === key.id);

    if (song) {
      // Setear el ID de playlist como "search-results"
      setCurrentPlaylistId("search-results");
      // Reproducir la canción pasando toda la lista de búsqueda como playlist
      playSong(song as Song, dataFromSearch as Song[]);
    }
  }, [playSong, dataFromSearch, setCurrentPlaylistId]);

  return {
    handleSearch,
    handleReproduce
  };
};

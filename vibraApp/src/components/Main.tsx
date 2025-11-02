/*
  Main.tsx - Combina búsqueda de canciones + routing de páginas
 */

import { useState } from "react";
import { Route, Routes } from "react-router-dom";

/* Components - Páginas existentes */
import Profile from "./UserPage/Profile"
import Favorites from "./FavPage/FavoritePage";
import { Follows } from "./SubsPage/Follows";

/* Components - Nueva funcionalidad de búsqueda */
import SearchSection from "./SearchSection";
import ResultsSection from "./ResultsSection";
import DiscoverMusic from "./DiscoverMusic";

/* types */
import type {SearchProps} from "../types/searchProps";
import type {ResultProps} from "../types/resultProps";
import type {ReproduceProps} from "../types/reproduceProps";

/* hooks */
import SearchContext from "../hooks/searchContext";
import { useMusicContext } from "../context";

/* styles */
import './Main.css'

const Main = () => {
  const { playSong } = useMusicContext();

  const dataToSearch_0: ResultProps[] = [{
    id: "",
    title: "",
    artist: "",
    duration: "",
    plays: ""
  }];

  const [dataFromSearch, setDataFromSearch] = useState<ResultProps[]>(dataToSearch_0);

  const dataToSearch = (key: SearchProps) => {
    // Obtener URL del backend desde variable de entorno o usar localhost por defecto
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // Usar search-smart: busca en BD + YouTube, auto-guarda resultados
    fetch(apiUrl + "/music/search-smart?query=" + encodeURIComponent(key.search) + "&maxResults=20")
      .then(response => response.json())
      .then(data => {
        // search-smart devuelve: { fromDatabase: [], fromYoutube: [], source: string, total: number }
        if (data.fromDatabase || data.fromYoutube) {
          // Combinar resultados de BD y YouTube
          const allSongs = [
            ...(data.fromDatabase || []),
            ...(data.fromYoutube || [])
          ];

          // Mapear los datos al formato que espera el frontend
          const mappedData: ResultProps[] = allSongs.map((song: any) => ({
            id: song.id || song.youtubeId, // BD usa 'id' (UUID), YouTube usa 'id' (videoId)
            title: song.title,
            artist: song.artist,
            duration: song.duration?.toString() || "0",
            plays: song.viewCount?.toString() || song.plays?.toString() || "0",
            youtubeId: song.youtubeId || song.id, // BD tiene 'youtubeId', YouTube solo tiene 'id'
            cloudinaryUrl: song.cloudinaryUrl || null, // Solo las de BD tienen MP3
            source: (song.cloudinaryUrl ? 'database' : 'youtube') as 'database' | 'youtube' // Para distinguir en el frontend
          }));

          setDataFromSearch(mappedData);
        } else {
          // Respuesta inesperada
          setDataFromSearch(dataToSearch_0);
        }
      })
      .catch(() => {
        setDataFromSearch(dataToSearch_0);
      });
  };

  const toResoult = (key: ResultProps | ResultProps[]) => {
    if (Array.isArray(key)) {
      setDataFromSearch(key);
    } else {
      setDataFromSearch([key]);
    }
  };

  const toReproduce = (key: ReproduceProps) => {
    // Conectar con el MusicPlayer real
    if (playSong && key.id) {
      // Necesitamos convertir el resultado de búsqueda a tipo Song
      const song = dataFromSearch.find(s => s.id === key.id);
      if (song) {
        // Mapear de ResultProps a Song con TODOS los campos necesarios
        playSong({
          id: song.id,
          title: song.title,
          artist: song.artist,
          duration: parseInt(song.duration) || 0,
          youtubeId: song.youtubeId, // CRÍTICO: necesario para reproducir
          cloudinaryUrl: song.cloudinaryUrl, // CRÍTICO: necesario para reproducir desde Cloudinary
        } as any);
      }
    }
  };

  return (
    <div className="MainContainer">
      <Routes>
        {/* Ruta principal: Home con búsqueda */}
        <Route path="/" element={
          <main className="main-content">
            <SearchContext.Provider value={{
              dataToSearch,
              toReproduce,
              toResoult,
              dataFromSearch
            }}>
              <SearchSection/>
              <ResultsSection/>
            </SearchContext.Provider>

            <DiscoverMusic/>
          </main>
        } />

        {/* Rutas existentes */}
        <Route path="/user/:userId" element={<Profile/>} />
        <Route path="/favorites" element={<Favorites/>} />
        <Route path="/follows" element={<Follows/>} />
      </Routes>
    </div>
  );
}

export default Main;

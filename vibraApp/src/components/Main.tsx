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
    // Buscar en la base de datos (canciones con Cloudinary)
    let uri = "http://localhost:3000";

    // Usar search-optimized buscando solo por artista (más flexible)
    // Si el usuario quiere buscar por canción específica, puede escribir "artista - canción"
    fetch(uri + "/music/search-optimized?artist=" + encodeURIComponent(key.search) + "&limit=20")
      .then(response => response.json())
      .then(data => {
        console.log('📥 Datos recibidos del backend:', data);
        // Verificar si es un array (éxito) o un objeto con error
        if (Array.isArray(data)) {
          // Mapear los datos del backend al formato que espera el frontend
          const mappedData = data.map((song: any) => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            duration: song.duration.toString(), // Convertir número a string
            plays: song.viewCount?.toString() || "0" // viewCount -> plays
          }));
          console.log('✅ Datos mapeados para frontend:', mappedData);
          setDataFromSearch(mappedData);
        } else {
          // Es un error del backend
          console.log('❌ Error del backend:', data.message || data.error);
          setDataFromSearch(dataToSearch_0);
        }
      })
      .catch(error => {
        console.log('❌ Error fetching data:', error);
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
        // Mapear de ResultProps a Song
        playSong({
          id: song.id,
          title: song.title,
          artist: song.artist,
          duration: parseInt(song.duration) || 0,
          // Campos adicionales que Song requiere (ajusta según tu tipo Song)
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
          </main>
        } />

        {/* Rutas existentes */}
        <Route path="/account" element={<Profile/>} />
        <Route path="/favorites" element={<Favorites/>} />
        <Route path="/follows" element={<Follows/>} />
      </Routes>
    </div>
  );
}

export default Main;

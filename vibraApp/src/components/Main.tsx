/*
  Main.tsx - Combina búsqueda de canciones + routing de páginas
 */

import { useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";

/* Components - Páginas existentes */
import Profile from "./UserPage/Profile"
import Favorites from "./FavPage/FavoritePage";
import { Follows } from "./SubsPage/Follows";
import { CreatePlaylistPage } from "./CreatePlaylistPage/CreatePlaylistPage";

/* Components - Nueva funcionalidad de búsqueda */
import SearchSection from "./SearchSection";
import ResultsSection from "./ResultsSection";
import DiscoverMusic from "./DiscoverMusic";

/* types */
import type { ResultProps } from "../types/resultProps";

/* hooks */
import { useSearchHandlers } from "../hooks";
import SearchContext, { type SearchContextValue } from "../context/searchContext";

/* styles */
import './Main.css'
import SongHistory from "./SongHistory/SongHistory";

const SEARCH_RESULTS_KEY = 'vibra_search_results';

const Main = () => {
  // Inicializar con datos de sessionStorage si existen
  const [dataFromSearch, setDataFromSearch] = useState<ResultProps[]>(() => {
    try {
      const stored = sessionStorage.getItem(SEARCH_RESULTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al cargar resultados de búsqueda:', error);
      return [];
    }
  });

  // Persistir resultados en sessionStorage cuando cambien
  useEffect(() => {
    try {
      if (dataFromSearch.length > 0) {
        sessionStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(dataFromSearch));
      } else {
        sessionStorage.removeItem(SEARCH_RESULTS_KEY);
      }
    } catch (error) {
      console.error('Error al guardar resultados de búsqueda:', error);
    }
  }, [dataFromSearch]);

  // Usar el custom hook para manejar búsqueda y reproducción
  const {
    handleSearch,
    handleReproduce
  } = useSearchHandlers(dataFromSearch, setDataFromSearch);

  // Crear el valor del contexto con los handlers
  const value = useMemo<SearchContextValue>(
    () => ({
      toSearch: handleSearch,
      toReproduce: handleReproduce,
      dataFromSearch
    }),
    [
      handleSearch,
      handleReproduce,
      dataFromSearch,
    ]
  );

  return (
    <div className="MainContainer">
      <Routes>
        {/* Ruta principal: Home con búsqueda */}
        <Route path="/" element={
          <main className="main-content">

            <SearchContext.Provider value={value}>
              <SearchSection/>
              <ResultsSection/>
            </SearchContext.Provider>

            <DiscoverMusic/>
          </main>
        } />

        {/* Rutas existentes */}
        <Route path="/user/:userId" element={<Profile/>} />
        <Route path="/user/:userId/song-history" element={<SongHistory/>} />
        <Route path="/favorites" element={<Favorites/>} />
        <Route path="/favorites/create-playlist" element={<CreatePlaylistPage/>} />
        <Route path="/follows" element={<Follows/>} />
      </Routes>
    </div>
  );
}

export default Main;

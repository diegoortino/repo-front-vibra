/*
  Main.tsx - Combina búsqueda de canciones + routing de páginas
 */

import { useCallback,useMemo, useState } from "react";
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
import SearchContext, { type SearchContextValue } from "../context/searchContext";
/* Utils */
import {UtoSearch,UtoReproduce,UtoResoult} from "../utils/utilsSearchContext"
/* styles */
import './Main.css'

const Main = () => {

  const [dataFromSearch, setDataFromSearch] = useState<ResultProps[]>([]);

  const toSearch = useCallback(async(key: SearchProps)=>{UtoSearch(key,setDataFromSearch)},[UtoSearch,setDataFromSearch]);

  const toResoult = useCallback((key: ResultProps | ResultProps []) =>{UtoResoult(key,setDataFromSearch)},[UtoResoult,setDataFromSearch]);

  const toReproduce =useCallback((key: ReproduceProps) => {UtoReproduce(key);},[UtoReproduce]);


  const value = useMemo<SearchContextValue>(
    () => ({
      toSearch,
      toReproduce,
      toResoult,
      dataFromSearch
    }),
    [
      toSearch,
      toReproduce,
      toResoult,
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
        <Route path="/favorites" element={<Favorites/>} />
        <Route path="/follows" element={<Follows/>} />
      </Routes>
    </div>
  );
}

export default Main;

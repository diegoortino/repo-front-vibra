/*
 searchContext.ts
 */

import type {SearchProps} from "../types/searchProps";
// import type {DynamicProps} from "../types/dynamicProps";
// import type {ReproduceProps} from "../types/reproduceProps";
import type {ResultProps} from "../types/resultProps";

import {createContext,useContext} from "react";

const SearchContext = createContext(
   {
    dataToSearch: (key:SearchProps) => {}, // Default empty function
    // toReproduce:  (key:ReproduceProps) => {}, // Default empty function
    toResoult:    (key:ResultProps) => {}, // Default empty function
    dataFromSearch:[{ id: "",
                      title: "",
                      artist: "",
                      duration: "",
                      plays: ""}]
   }
  );


  // Hook
  export function useSearchContext() {
    const ctx = useContext(SearchContext);
    if (!ctx) throw new Error("useSearchContext debe usarse dentro de <SearchContext> o <SearchContext.Provider>");
    return ctx;
  }
  
  export default SearchContext;

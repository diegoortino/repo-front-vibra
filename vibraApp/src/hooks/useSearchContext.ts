import {useContext} from "react";
import SearchContext from "../context/searchContext";

export const useSearchContext = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) {
   if (!ctx) throw new Error("useSearchContext debe usarse dentro de <SearchContext> o <SearchContext.Provider>");
  }
  return ctx;
};
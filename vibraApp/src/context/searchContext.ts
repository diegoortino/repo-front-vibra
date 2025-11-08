/*
 searchContext.ts
 */

import {createContext} from "react";
import type {SearchProps} from "../types/searchProps";
import type {ReproduceProps} from "../types/reproduceProps";
import type {ResultProps} from "../types/resultProps";

export type SearchContextValue = {
  toSearch:     (key:SearchProps) => void; // Default empty function
  toReproduce:  (key:ReproduceProps) => void; // Default empty function
  toResoult:    (key:ResultProps) => void; // Default empty function
  dataFromSearch:ResultProps|ResultProps[]|null;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export default SearchContext;  

/*
 searchContext.ts
 */

import type {SearchProps} from "../types/searchProps";
// import type {DynamicProps} from "../types/dynamicProps";
import type {ReproduceProps} from "../types/reproduceProps";
import type {ResultProps} from "../types/resultProps";



 import {createContext} from "react";

  const SearchContext = createContext(
   {
    dataToSearch: (key:SearchProps) => {}, // Default empty function
    toReproduce:  (key:ReproduceProps) => {}, // Default empty function
    toResoult:    (key:ResultProps) => {}, // Default empty function
    dataFromSearch:[{ id: "",
                      title: "",
                      artist: "",
                      duration: "",
                      plays: ""}]
   }
  );
  export default SearchContext;
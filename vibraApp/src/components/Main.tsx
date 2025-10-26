/* 
Main.tsx
*/

/* Dependencies  */
import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

/* Components */
import Profile from "./UserPage/Profile"
import Favorites from "./FavPage/FavoritePage";
import { Follows } from "./SubsPage/Follows";
import SearchSection from "./SearchSection";
import ResultsSection from "./ResultsSection";

/* types */
import type {SearchProps} from "../types/searchProps";
import type {ResultProps} from "../types/resultProps";
import type {ReproduceProps} from "../types/reproduceProps";

/* hooks */
import SearchContext from "../context/searchContext";
/* styles */
import "./main.css";

const Main =() => {

  const dataToSearch_0=[{ id: "0",
                          title: "",
                          artist: "",
                          duration: "",
                          plays: ""}];

  const [dataFromSearch, setDataFromSearch]:[ResultProps[],any] = useState(dataToSearch_0);
    
  const dataToSearch = (key:SearchProps) => {

    let uri="";
    
    fetch(uri+"/songs/search?query"+key.search)
      .then(response => response.json())
      .then(data => {
        //console.log("main",data);
        //setDataFromSearch(data.map(searchBy(data,key)));
        if(data.hasOwnProperty("error")){
          console.log('Name:'+data.error.name,'Message:' +data.error.message,'Header:'+data.error.header );
          setDataFromSearch(dataToSearch_0);
        }else
          setDataFromSearch(data);
      })
      .catch(error => {
        console.log('Error fetching data:', error);
      });
  };

  const toResoult = (key:ResultProps) => {
    setDataFromSearch(key);
  };
  const toReproduce = (key:ReproduceProps) => {
    
  };
  //console.log(dataFromSearch);
  return (
    <>
        <main className="main-content">
          <SearchContext.Provider value={{dataToSearch,// callback from search
                                          toReproduce, // callback from Resoults
                                          toResoult,   // callback from Search>most(suggestion)
                                          dataFromSearch}} > {/* data to render Results */}
            <SearchSection/>
            <ResultsSection/>
          </SearchContext.Provider>
          <Routes>
                  <Route path="/account" element={<Profile/>} />
                  <Route path="/favorites" element={<Favorites/>} />
                  <Route path="/follows" element={<Follows/>} />
          </Routes>    
        </main>
      
    </>
  );
}

export default Main;


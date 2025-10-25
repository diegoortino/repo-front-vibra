/* 
  SearchSection.tsx
 */

/* Dependencies  */
import { useContext, useEffect, useState } from "react";

import ErrorBoundary from "./ErrorBoundary";

/* types */
import type {DynamicProps} from "../types/dynamicProps";
import type {SearchProps} from "../types/searchProps";
import type {SearchSectionProps} from "../types/searchSectionProps";

/* hooks */
import SearchContext from "../hooks/searchContext";

/* Components */

/* styles */

// const SearchSection =(props:SearchSectionProps) => {
const SearchSection =() => {

  const {dataToSearch,toResoult} = useContext(SearchContext);
  const [valueCurrent, setValueCurrent]:[string,any] = useState("");
  const [trent, setTrent]:[DynamicProps[],any] = useState([]);
  const URL="/data/data.json";
  const ENTITY='/trent';
  useEffect(() => {

    fetch(URL)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        //console.log(data.subjets);
        // Usar 'most' en lugar de 'trent' que no existe en el JSON
        setTrent(data.most || []);
        //console.log(subjets);
      })
      .catch(error => {
        console.log('Error fetching data:', error);
        setTrent([]); // Inicializar con array vacío en caso de error
      });

  }, []);// on render
    //dataDynamicSearch={handleChildDynamicSearch}   

  /* sendDataToParent */
  const handleSearchSubmit = (event:any) => {
    event.preventDefault();
    //console.log(data);
    if(event.target["search"].value.length)
      dataToSearch({search:event.target["search"].value}); //callback func(searchProp object)
    setValueCurrent(event.target["search"].value);
  };

  /* auto complete and search */
  const handleInputChange = (event:any) => {
      // En onChange el target es el input directamente, no el form
      setValueCurrent(event.target.value);
  };

  const handleClickSuggestion = (event:any) => {
    event.preventDefault();
    toResoult(JSON.parse(event.target.firstChild.value));
  };

/* auto complete and search */
const renderSuggestion = (datum:DynamicProps) => {
  if (datum.hasOwnProperty("id"))
    return (<div  key={datum.id}
                  id={datum.id}  
                  className="suggestion-tag"
                  onClick={handleClickSuggestion}>
                  <input type="hidden" value={`{"id":"${datum.id}",
                                              "title":"${datum.title}",
                                              "artist":"${datum.artist}",
                                              "duration":"${datum.duration}",
                                              "plays":"${datum.plays}"}`}></input>
                  {datum.title}
              </div>
         );
  };

  return (
    <>
      <section className="search-section">
          <div className="welcome-text">
              <h1 className="welcome-title">¿Qué quieres escuchar hoy?</h1>
              <p className="welcome-subtitle">Busca cualquier canción y disfruta de visualizaciones únicas generadas por IA</p>
          </div>

          <div className="search-container">
              <form className="search-form" onSubmit={handleSearchSubmit}>
                  <input 
                      type="text"
                      className="search-input" 
                      placeholder="Buscar canciones, artistas, álbumes..." 
                      id="searchInput"
                      autoComplete="off"
                      onChange={handleInputChange}
                      value={valueCurrent}
                      name="search"
                  > </input>
                  
                  <button  type="submit" className="search-btn" id="searchBtn">
                    <span>🔍</span>
                    Buscar
                  </button>
              </form>
              
              <div className="search-suggestions">
                {trent.map(renderSuggestion)}                    
              </div>
          </div>
      </section>
    </>
  );
}


export default SearchSection;
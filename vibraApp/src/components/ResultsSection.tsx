/* 
  ResultsSection.tsx
 */

/* Dependencies  */
import { useRef,useContext, useEffect, useState } from "react";

/* types */
import type {ResultProps} from "../types/resultProps"
import type {Track} from "../context/MusicContext";
;


/* Context */
import SearchContext from "../context/searchContext";
import MusicContext from "../context/MusicContext";

/* hooks */
import {useSearchContext} from "../context/searchContext";
import {useMusicContext} from "../context/MusicContext";
/* Components */

/* styles */
import "./result-section.css";

//props:{playTrack:any,dataRecive:ResultProps[]}
const ResultsSection =() => {

    const search = useSearchContext();
    const music = useMusicContext();
    let   dataFromSearch:ResultProps[]= search.dataFromSearch;
    const vSt:string[]=["init","result","results","notFound"];
    const [state,setState]=useState(vSt[0]);
          
    useEffect(()=>{
        //console.log("Result",props.dataRecive,props.dataRecive.hasOwnProperty("id"));
        console.log("state: "+state);
        if (dataFromSearch instanceof Array){
          console.log("Array: ",dataFromSearch);
          if(dataFromSearch.length === 0 || dataFromSearch[0].id==="") {
            /*not found something */ 
            setState(vSt[3]);
          }if(dataFromSearch[0].id==="0"){
            setState(vSt[0]);
          }else{
            /*at least some one */
            setState(vSt[2]);
          }
        }else if (dataFromSearch instanceof Object && dataFromSearch.hasOwnProperty("id") && dataFromSearch.id!=""){//object
            /*only one*/
           console.log("Object");
           setState(vSt[1]);
        }else{
           setState(vSt[3]);
        }
      }
      ,[dataFromSearch]);// on mount and change

    const handleClickPlayTrack = (event:any) => {
      event.preventDefault();
      //console.log(event.target.parentElement.parentElement);
      if (event.target.parentElement.parentElement.hasAttribute("data-track-id"))
        music.playSong( { youtubeId:event.target.parentElement.parentElement.getAttribute("data-track-id") } );
    };

    const displayResults= () => {

      switch (state) {
        case "init":
            return( <>
                <div className="empty-state">
                  <div className="icon">🎵</div>
                  <h3>Busca tu música favorita</h3>
                  <p>Usa el buscador de arriba para encontrar canciones y crear visualizaciones únicas</p>
                </div>
              </>
            );
          break;
        case "result":
            var data:ResultProps=dataFromSearch[0];
            //console.log("result",dataFromSearch,data);
            return (
              <div id="" className="results-grid">
                <div className="result-card" data-track-id={data.id}>
                  <div className="result-thumbnail">🎵</div>
                  <div className="result-info">
                    <h3 className="result-title">{data.title}</h3>
                    <p className="result-artist">{data.artist}</p>
                    <p className="result-duration">{data.duration}</p>
                    <button className="play-btn" onClick={handleClickPlayTrack}>
                    {/* <button className="play-btn" onClick={props.playTrack(data.id,data.title,data.artist)}> */}
                      <span>▶️</span>
                      Reproducir con IA
                    </button>
                  </div>
                </div>
              </div>
            );
          break;
        case "results":
            return(
              <div className="results-grid">
                { dataFromSearch.map((datum:ResultProps) =>
                    <div key={datum.id} className="result-card" data-track-id={datum.id}>
                      <div className="result-thumbnail">🎵</div>
                      <div className="result-info">
                        <h3 className="result-title">{datum.title}</h3>
                        <p className="result-artist">{datum.artist}</p>
                        <p className="result-duration">{datum.duration}</p>
                        <button className="play-btn" onClick={handleClickPlayTrack}>
                        <span>▶️</span>Reproducir con IA</button>
                        {/* <button className="play-btn" onClick={props.playTrack(data.id,data.title,data.artist)}> */}
                      </div>
                    </div>
                  ) }
              </div>
              );
          break;
        case "notFound":
          return (
            <div className="empty-state">
                <div className="icon">😔</div>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
            );
          break;
      
        default:
          break;
      }
    };

    const Results=()=>{
      return displayResults();
    };
    
    return(
          <>
            <section className="results-section">
              <div id="searchResults">
                <Results/>                
              </div>
            </section>
          </>);    

}

export default ResultsSection;



/* 
  ResultsSection.tsx
 */

/* Dependencies  */
import { useContext, useEffect, useState } from "react";

/* types */
import type {ResultProps} from "../types/resultProps";

/* hooks */
import SearchContext from "../hooks/searchContext";


/* Components */

/* styles */
//props:{playTrack:any,dataRecive:ResultProps[]}
const ResultsSection =() => {

    const {toReproduce,dataFromSearch} = useContext(SearchContext);
    const vSt:string[]=["init","result","results","notFound"];
    const [state,setState]=useState(vSt[0]);
          
    useEffect(()=>{
        //console.log("Result",props.dataRecive,props.dataRecive.hasOwnProperty("id"));
        console.log("state: "+state);
        if (dataFromSearch instanceof Array){
          console.log("Array");
          if(dataFromSearch.length === 0 || dataFromSearch[0].id==="") {
            /*not found something */ 
            setState(vSt[3]);
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
        toReproduce({ id: event.target.parentElement.parentElement.getAttribute("data-track-id") });
    };

    const displayResults= () => {

      switch (state) {
        case "init":
            return null;
          break;
        case "result":
            var data:ResultProps=dataFromSearch;
            //console.log("result",dataFromSearch,data);
            return (
              <div id="" className="results-grid">
                <div className="result-card" data-track-id={data.id}>
                  <div className="result-thumbnail"></div>
                  <div className="result-info">
                    <h3 className="result-title">{data.title}</h3>
                    <p className="result-artist">{data.artist}</p>
                    <p className="result-duration">{data.duration}s</p>
                    <button className="play-btn" onClick={handleClickPlayTrack}>
                      Reproducir
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
                      <div className="result-thumbnail"></div>
                      <div className="result-info">
                        <h3 className="result-title">{datum.title}</h3>
                        <p className="result-artist">{datum.artist}</p>
                        <p className="result-duration">{datum.duration}s</p>
                        <button className="play-btn" onClick={handleClickPlayTrack}>
                          Reproducir
                        </button>
                      </div>
                    </div>
                  ) }
              </div>)
            ;
          break;
        case "notFound":
          return null;
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



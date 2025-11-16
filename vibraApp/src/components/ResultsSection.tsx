/*
  ResultsSection.tsx
 */

/* Dependencies  */
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

/* types */
import type {ResultProps} from "../types/resultProps";
import type {ReproduceProps} from "../types/reproduceProps";


/* hooks */
import { useSearchContext } from "../hooks/useSearchContext";
import { useMusicContext }  from "../context/MusicContext";

/* utils */
// Removed formatArtist and formatTitle - now showing raw data from DB

/* styles */
import './FavPage/Favorites.css';

const ResultsSection = () => {
    const {toReproduce, dataFromSearch} = useSearchContext();
    const { currentSong, currentPlaylistId } = useMusicContext();
    const vSt: string[] = ["init", "result", "results", "notFound"];
    const [state, setState] = useState(vSt[0]);

    useEffect(() => {
        if (Array.isArray(dataFromSearch)) {
          if (dataFromSearch.length === 0 || dataFromSearch[0]?.id === "") {
            setState(vSt[3]);
          } else if (dataFromSearch.length === 1) {
            setState(vSt[1]);
          } else {
            setState(vSt[2]);
          }
        }else if (dataFromSearch instanceof Object && dataFromSearch.hasOwnProperty("id") && dataFromSearch.id!=""){
           setState(vSt[1]);
        } else  {
           setState(vSt[3]);
        }
      }, [dataFromSearch]);


    const handleClickPlayTrack = (data:ReproduceProps) => {
      if (data){
        toReproduce(data);
      }
    };

    const displayResults = () => {
      switch (state) {
        case "init":
            return null;
        case "result":
            const data: ResultProps|null = Array.isArray(dataFromSearch) ? dataFromSearch[0] : dataFromSearch;
            if (data===null) 
              return <></>;
            const isPlayingSingle = currentSong?.id === data.id && currentPlaylistId === "search-results";
            return (
              <div className="suggestionsGrid">
                <div
                  key={data.id}
                  className={`suggestionCard ${isPlayingSingle ? 'suggestionCard--playing' : ''}`}
                  onClick={(e) =>{e.preventDefault; handleClickPlayTrack(data)}}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="cardCover">
                    <div
                      className="songCover"
                      style={{
                        backgroundImage: `url(https://img.youtube.com/vi/${data.youtubeId}/mqdefault.jpg)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="playOverlay">
                        <FontAwesomeIcon icon={faPlay} />
                      </div>
                    </div>
                  </div>

                  <div className="cardContent">
                    <h4 className="cardTitle">{data.title}</h4>
                    <p className="cardSubtitle">{data.artist}</p>
                    <div className="cardFooter">
                      <span className="cardStats">
                        {Math.floor(data.duration / 60)}:{String((data.duration) % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
        case "results":
            if (dataFromSearch===null)
              return <></>;
            return (
              <div className="suggestionsGrid">
                {
                dataFromSearch.map((datum: ResultProps) => {
                    const isPlaying = currentSong?.id === datum.id && currentPlaylistId === "search-results";
                    return (
                    <div
                      key={datum.id}
                      className={`suggestionCard ${isPlaying ? 'suggestionCard--playing' : ''}`}
                      onClick={(e) =>{e.preventDefault; handleClickPlayTrack(datum)}}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="cardCover">
                        <div
                          className="songCover"
                          style={{
                            backgroundImage: `url(https://img.youtube.com/vi/${datum.youtubeId}/mqdefault.jpg)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          <div className="playOverlay">
                            <FontAwesomeIcon icon={faPlay} />
                          </div>
                        </div>
                      </div>

                      <div className="cardContent">
                        <h4 className="cardTitle">{datum.title}</h4>
                        <p className="cardSubtitle">{datum.artist}</p>
                        <div className="cardFooter">
                          <span className="cardStats">
                            {Math.floor((datum.duration) / 60)}:{String((datum.duration) % 60).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                    );
                })}
              </div>
            );
        case "notFound":
          return null;
        default:
          break;
      }
    };

    const Results = () => {
      return displayResults();
    };

    return (
      <>
        <section className="suggestionsContainer">
          <div id="searchResults">
            <Results/>
          </div>
        </section>
      </>
    );
}

export default ResultsSection;



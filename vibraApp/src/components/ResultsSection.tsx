/*
  ResultsSection.tsx
 */

/* Dependencies  */
import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

/* types */
import type {ResultProps} from "../types/resultProps";

/* hooks */
import SearchContext from "../hooks/searchContext";
import { useMusicContext } from "../context/MusicContext";

/* styles */
import './FavPage/Favorites.css';

const ResultsSection = () => {
    const {toReproduce, dataFromSearch} = useContext(SearchContext);
    const { currentSong } = useMusicContext();
    const vSt: string[] = ["init", "result", "results", "notFound"];
    const [state, setState] = useState(vSt[0]);

    useEffect(() => {
        console.log("state: " + state);
        if (Array.isArray(dataFromSearch)) {
          console.log("Array");
          if (dataFromSearch.length === 0 || dataFromSearch[0].id === "") {
            setState(vSt[3]);
          } else if (dataFromSearch.length === 1) {
            setState(vSt[1]);
          } else {
            setState(vSt[2]);
          }
        } else {
           setState(vSt[3]);
        }
      }, [dataFromSearch]);

    const handleClickPlayTrack = (datum: ResultProps) => {
      toReproduce({ id: datum.id });
    };

    const displayResults = () => {
      switch (state) {
        case "init":
            return null;
        case "result":
            const data: ResultProps = Array.isArray(dataFromSearch) ? dataFromSearch[0] : dataFromSearch;
            const isPlayingSingle = currentSong?.id === data.id;
            return (
              <div className="suggestionsGrid">
                <div
                  key={data.id}
                  className={`suggestionCard ${isPlayingSingle ? 'suggestionCard--playing' : ''}`}
                  onClick={() => handleClickPlayTrack(data)}
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
                        {Math.floor(parseInt(data.duration) / 60)}:{String(parseInt(data.duration) % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
        case "results":
            return (
              <div className="suggestionsGrid">
                {dataFromSearch.map((datum: ResultProps) => {
                    const isPlaying = currentSong?.id === datum.id;
                    return (
                    <div
                      key={datum.id}
                      className={`suggestionCard ${isPlaying ? 'suggestionCard--playing' : ''}`}
                      onClick={() => handleClickPlayTrack(datum)}
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
                            {Math.floor(parseInt(datum.duration) / 60)}:{String(parseInt(datum.duration) % 60).padStart(2, '0')}
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



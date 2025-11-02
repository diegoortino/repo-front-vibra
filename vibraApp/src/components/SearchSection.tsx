/*
  SearchSection.tsx
 */

/* Dependencies  */
import { useContext, useEffect, useState } from "react";

/* hooks */
import SearchContext from "../hooks/searchContext";

/* styles */
import './search-section.css';

const SearchSection = () => {
  const { dataToSearch } = useContext(SearchContext);
  const [valueCurrent, setValueCurrent] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSearchSubmit = (event:any) => {
    event.preventDefault();

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 300);

    if(event.target["search"].value.length) {
      dataToSearch({search:event.target["search"].value});
    }
    setValueCurrent(event.target["search"].value);
  };

  const handleInputChange = async (event:any) => {
      const value = event.target.value;
      setValueCurrent(value);
      if (value.length >= 2) {
        setIsLoadingSuggestions(true);

        try {
          const response = await fetch(`http://localhost:3000/music/autocomplete?query=${encodeURIComponent(value)}&limit=5`);
          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Error fetching autocomplete:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValueCurrent(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    dataToSearch({search: suggestion});
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <>
      <section className="search-section">
          <div className="welcome-text">
              <h1 className="welcome-title">¿Qué quieres escuchar hoy?</h1>
          </div>

          <div className="search-container">
              <form className="search-form" onSubmit={handleSearchSubmit}>
                  <input
                      type="text"
                      className="search-input"
                      placeholder="Buscar por artista o canción..."
                      id="searchInput"
                      autoComplete="off"
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      value={valueCurrent}
                      name="search"
                  />

                  <button type="submit" className={`search-btn ${isSearching ? 'search-btn--searching' : ''}`} id="searchBtn">
                    Buscar
                  </button>
              </form>

              {(showSuggestions || isLoadingSuggestions) && (
                <div style={{
                  position: 'absolute',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  width: 'calc(100% - 32px)'
                }}>
                  {isLoadingSuggestions ? (
                    <div style={{
                      padding: '12px 16px',
                      color: '#999',
                      textAlign: 'center'
                    }}>
                      Buscando...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: index < suggestions.length - 1 ? '1px solid #333' : 'none',
                          transition: 'background-color 0.2s',
                          color: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        🎵 {suggestion}
                      </div>
                    ))
                  ) : null}
                </div>
              )}
          </div>
      </section>
    </>
  );
}


export default SearchSection;

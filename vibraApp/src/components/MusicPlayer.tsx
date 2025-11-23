import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useMusicContext } from "../context/MusicContext";
import { Icons } from "./Icons";

type Backend = "cloudinary" | "youtube" | null;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoadingPromise?: Promise<void>;
  }
}

// Loads the YouTube iframe API once and reuses the same promise for later calls.
function loadYouTubeAPI(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!window._ytApiLoadingPromise) {
    window._ytApiLoadingPromise = new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = () => resolve();
    });
  }
  return window._ytApiLoadingPromise!;
}

// Formats seconds into an hh:mm:ss or m:ss label.
function formatTime(totalSeconds: number) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function MusicPlayer() {
  // Shared context state (aliased to English names for clarity).
  const {
    playlist,
    currentSong,
    indiceActual: currentIndex,
    setIndiceActual: setCurrentIndex,
    urlsImagenes: imageUrls,
    reproduciendo: isPlaying,
    setReproduciendo: setIsPlaying,
  } = useMusicContext();

  // External players and DOM refs.
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<any>(null);
  const youtubeReadyRef = useRef<boolean>(false);
  const youtubeReadyResolvers = useRef<((value: void | PromiseLike<void>) => void)[]>([]);
  const playlistDropdownRef = useRef<HTMLDivElement | null>(null);
  const activeSongButtonRef = useRef<HTMLButtonElement | null>(null);
  const backendRef = useRef<Backend>(null);
  const imageIndexRef = useRef(0);

  // Local UI state.
  const [manualBackendOverride, setManualBackendOverride] = useState<Backend>(null);
  const [progress, setProgress] = useState({ time: 0, duration: 0, percent: 0 });
  const [volume, setVolume] = useState(1);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previousImageIndex, setPreviousImageIndex] = useState<number | null>(null);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);

  // Derived display data.
  const title = currentSong?.title;
  const artist = currentSong?.artist;
  const youtubeThumbnail = currentSong?.youtubeId
    ? `https://img.youtube.com/vi/${currentSong.youtubeId}/hqdefault.jpg`
    : undefined;

  const volumeIcon = useMemo(() => {
    const pct = Math.round((volume ?? 0) * 100);
    if (pct <= 0) return <Icons.Mute />;
    if (pct <= 50) return <Icons.VolLow />;
    return <Icons.Volume />;
  }, [volume]);

  // Resolves the first YouTube onReady event as a promise.
  const waitForYouTubeReady = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (youtubeReadyRef.current) return resolve();
        youtubeReadyResolvers.current.push(resolve);
      }),
    [],
  );

  // Remember the current index ref without rerenders.
  useEffect(() => {
    imageIndexRef.current = currentImageIndex;
  }, [currentImageIndex]);

  // When a track ends, move to the next one (looping).
  const handleTrackEnded = useCallback(() => {
    if (!playlist?.length) {
      setIsPlaying(false);
      return;
    }
    const nextIndex = currentIndex + 1 >= playlist.length ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  }, [currentIndex, playlist, setCurrentIndex, setIsPlaying]);

  // Forces playback to YouTube when Cloudinary fails.
  const fallbackToYouTube = useCallback(() => {
    if (!currentSong?.youtubeId) {
      console.warn("[MusicPlayer] Cloudinary failed and no YouTube id is available");
      setIsPlaying(false);
      return;
    }
    try {
      audioRef.current?.pause();
    } catch {
      /* ignore */
    }
    setManualBackendOverride("youtube");
  }, [currentSong, setIsPlaying]);

  // Decides which backend to use for the current track.
  const backend: Backend = useMemo(() => {
    if (!currentSong) return null;
    if (manualBackendOverride) return manualBackendOverride;
    return currentSong.cloudinaryUrl ? "cloudinary" : currentSong.youtubeId ? "youtube" : null;
  }, [currentSong, manualBackendOverride]);

  // Navigates to the previous track in a circular list.
  const handlePrevious = () => {
    if (!playlist?.length) return;
    const previousIndex = currentIndex - 1 < 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(previousIndex);
    setIsPlaying(true);
  };

  // Navigates to the next track in a circular list.
  const handleNext = () => {
    if (!playlist?.length) return;
    const nextIndex = currentIndex + 1 >= playlist.length ? 0 : currentIndex + 1;
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
  };

  // Toggles between play and pause.
  const handleTogglePlay = () => setIsPlaying(!isPlaying);

  // Updates progress when the range input is dragged.
  const handleProgressChange = (event: ChangeEvent<HTMLInputElement>) => {
    const percent = Number(event.target.value) || 0;
    const duration = progress.duration || 0;
    const target = (percent / 100) * duration;
    const activeBackend = backendRef.current;
    if (activeBackend === "cloudinary" && audioRef.current) {
      audioRef.current.currentTime = target;
    } else if (activeBackend === "youtube" && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo?.(target, true);
    }
  };

  // Adjusts volume for both backends.
  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Math.max(0, Math.min(1, Number(event.target.value) || 0));
    setVolume(nextVolume);
    const activeBackend = backendRef.current;
    if (activeBackend === "cloudinary" && audioRef.current) {
      audioRef.current.volume = nextVolume;
    } else if (activeBackend === "youtube" && youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume?.(Math.round(nextVolume * 100));
    }
  };

  // Remembers the previous volume and toggles mute on/off.
  const handleMuteToggle = () => {
    const activeBackend = backendRef.current;
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
      if (activeBackend === "cloudinary" && audioRef.current) {
        audioRef.current.volume = 0;
      } else if (activeBackend === "youtube" && youtubePlayerRef.current) {
        youtubePlayerRef.current.setVolume?.(0);
      }
    } else {
      const restoreVolume = previousVolume > 0 ? previousVolume : 1;
      setVolume(restoreVolume);
      if (activeBackend === "cloudinary" && audioRef.current) {
        audioRef.current.volume = restoreVolume;
      } else if (activeBackend === "youtube" && youtubePlayerRef.current) {
        youtubePlayerRef.current.setVolume?.(Math.round(restoreVolume * 100));
      }
    }
  };

  // Playlist info for the dropdown list.
  const playlistItems = useMemo(() => {
    const items =
      playlist?.map((song, index) => ({
        id: song.id || song.youtubeId || `track-${index}`,
        title: song.title || `Song ${index + 1}`,
        artist: song.artist,
        index,
      })) ?? [];
    return items;
  }, [playlist]);

  // Mounts the right backend (audio tag or YouTube iframe) whenever the song or backend changes.
  useEffect(() => {
    async function setupBackend() {
      if (!currentSong) return;

      backendRef.current = backend;

      try {
        audioRef.current?.pause();
      } catch {
        /* ignore */
      }
      try {
        youtubePlayerRef.current?.pauseVideo?.();
        youtubePlayerRef.current?.stopVideo?.();
      } catch {
        /* ignore */
      }

      if (backend === "cloudinary") {
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;

        audio.onerror = null;
        audio.onended = null;

        audio.preload = "auto";
        audio.crossOrigin = "anonymous";
        if (currentSong.cloudinaryUrl) audio.src = currentSong.cloudinaryUrl;

        audio.onerror = () => {
          if (manualBackendOverride !== "youtube") fallbackToYouTube();
        };

        audio.currentTime = 0;
        audio.volume = volume;
        audio.onended = () => handleTrackEnded();

        if (isPlaying) {
          audio.play().catch((error) => {
            if (manualBackendOverride !== "youtube") fallbackToYouTube();
            console.warn("[MusicPlayer] Cloudinary play() failed, moving to YouTube:", error);
          });
        } else {
          audio.pause();
        }
        return;
      }

      if (backend === "youtube" && youtubeContainerRef.current) {
        await loadYouTubeAPI();
        if (!youtubePlayerRef.current) {
          youtubePlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
            height: "0",
            width: "0",
            playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1 },
            events: {
              onReady: () => {
                youtubeReadyRef.current = true;
                while (youtubeReadyResolvers.current.length) youtubeReadyResolvers.current.shift()?.();
              },
              onStateChange: (event: any) => {
                if (event?.data === 0) handleTrackEnded();
              },
            },
          });
        }

        const player = youtubePlayerRef.current;
        const id = currentSong.youtubeId;
        if (!youtubeReadyRef.current) await waitForYouTubeReady();
        if (!id) return;

        try {
          if (isPlaying) player.loadVideoById(id);
          else player.cueVideoById(id);
          player.setVolume?.(Math.round(volume * 100));
        } catch (error) {
          setTimeout(() => {
            try {
              if (isPlaying) player.loadVideoById(id);
              else player.cueVideoById(id);
              player.setVolume?.(Math.round(volume * 100));
            } catch (retryError) {
              console.error("[MusicPlayer] YouTube API failed on retry", retryError);
            }
          }, 50);
        }
      }
    }

    setupBackend();
  }, [backend, currentSong, fallbackToYouTube, handleTrackEnded, isPlaying, manualBackendOverride, volume, waitForYouTubeReady]);

  // Sync play/pause intent with the active backend.
  useEffect(() => {
    const activeBackend = backendRef.current;
    if (activeBackend === "cloudinary") {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) audio.play().catch(() => {});
      else audio.pause();
    } else if (activeBackend === "youtube") {
      const player = youtubePlayerRef.current;
      if (!player) return;
      if (isPlaying) player.playVideo?.();
      else player.pauseVideo?.();
    }
  }, [isPlaying]);

  // Reset manual overrides when a new song is selected.
  useEffect(() => {
    setManualBackendOverride(null);
  }, [currentSong]);

  // Poll current progress to keep the UI updated.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const activeBackend = backendRef.current;
      let currentTime = 0;
      let duration = 0;

      if (activeBackend === "cloudinary" && audioRef.current) {
        currentTime = audioRef.current.currentTime || 0;
        duration = audioRef.current.duration || 0;
      } else if (activeBackend === "youtube" && youtubePlayerRef.current) {
        currentTime = youtubePlayerRef.current.getCurrentTime?.() || 0;
        const maybeDuration = youtubePlayerRef.current.getDuration?.();
        duration = Number.isFinite(maybeDuration) ? maybeDuration : 0;
      }

      const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
      setProgress({ time: currentTime, duration, percent });
    }, 50) as unknown as number;

    return () => window.clearInterval(intervalId);
  }, []);

  // Auto-rotate images inside the visualizer every 5s.
  useEffect(() => {
    if (!isVisualizerOpen || imageUrls.length === 0) return;

    const intervalId = window.setInterval(() => {
      setPreviousImageIndex(imageIndexRef.current);
      setIsImageTransitioning(true);
      setCurrentImageIndex((prev) => {
        const next = imageUrls.length ? (prev + 1) % imageUrls.length : 0;
        imageIndexRef.current = next;
        return next;
      });
      window.setTimeout(() => setIsImageTransitioning(false), 320);
    }, 5000) as unknown as number;

    return () => {
      window.clearInterval(intervalId);
      setIsImageTransitioning(false);
      setPreviousImageIndex(null);
    };
  }, [imageUrls, isVisualizerOpen]);

  // Clean transition flags when the visualizer closes.
  useEffect(() => {
    if (!isVisualizerOpen) {
      setIsImageTransitioning(false);
      setPreviousImageIndex(null);
    }
  }, [isVisualizerOpen]);

  // Close playlist dropdown when clicking outside.
  useEffect(() => {
    if (!isPlaylistOpen) return;
    const onDocumentClick = (event: MouseEvent) => {
      const node = playlistDropdownRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        setIsPlaylistOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [isPlaylistOpen]);

  // Scroll the active song into view when the dropdown opens.
  useEffect(() => {
    if (isPlaylistOpen && activeSongButtonRef.current) {
      activeSongButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isPlaylistOpen]);

  const currentTimeLabel = formatTime(progress.time);
  const totalTimeLabel = progress.duration > 0 ? formatTime(progress.duration) : "--:--";
  const isSongMissing = !currentSong;

  return (
    <>
      {/* Hidden mounts for both backends so they are ready when needed. */}
      <div className="playerHiddenIframes" aria-hidden="true">
        <div ref={youtubeContainerRef} />
        <audio ref={audioRef} style={{ display: "none" }} preload="auto" />
      </div>

      {/* Visualizer overlay with AI images. */}
      {isVisualizerOpen && (
        <div
          className="playerVisualizerOverlay"
          onClick={() => setIsVisualizerOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="playerVisualizerContent" onClick={(event) => event.stopPropagation()}>
            <div className={`playerVisualizerSlider ${isImageTransitioning ? "is-animating" : ""}`}>
              {previousImageIndex !== null && imageUrls[previousImageIndex] && (
                <img
                  key={`vis-out-${previousImageIndex}-${imageUrls[previousImageIndex]}`}
                  src={imageUrls[previousImageIndex]}
                  alt=""
                  className="playerSlide playerSlideOut"
                  draggable={false}
                />
              )}

              {imageUrls.length > 0 ? (
                <img
                  key={`vis-in-${currentImageIndex}-${imageUrls[currentImageIndex] || "placeholder"}`}
                  src={imageUrls[currentImageIndex] || undefined}
                  alt=""
                  className="playerSlide playerSlideIn"
                  draggable={false}
                />
              ) : (
                <div className="playerSlide playerSlideIn" aria-hidden="true">
                  No images available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main layout with cover, controls and extras. */}
      <div className="playerContainer">
        <div className="playerGridLayout">
          <nav className="playerLeftPanel">
            <div
              className="playerThumbnail"
              onClick={() => !isSongMissing && setIsVisualizerOpen(true)}
              title={isSongMissing ? "" : "Open image visualizer"}
              style={{ cursor: isSongMissing ? "default" : "pointer" }}
            >
              {youtubeThumbnail && (
                <img
                  src={youtubeThumbnail}
                  alt={title ? `Cover: ${title}` : "Cover"}
                  className="playerThumbnailImage"
                  draggable={false}
                />
              )}
            </div>
            <div className="playerTrackInfo">
              <div className="playerTrackTitle">{isSongMissing ? "No track" : title}</div>
              <div className="playerTrackArtist">
                {isSongMissing ? "Select a track to start playing" : artist}
              </div>
            </div>
          </nav>

          <nav className="playerCenterPanel">
            <div className="playerControls">
              <button
                className="playerControlButton"
                onClick={handlePrevious}
                aria-label="Previous"
                disabled={isSongMissing}
              >
                <span aria-hidden="true">
                  <Icons.Prev />
                </span>
              </button>
              <button
                className="playerControlButton"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                disabled={isSongMissing}
              >
                <span aria-hidden="true">{isPlaying ? <Icons.Pause /> : <Icons.Play />}</span>
              </button>
              <button
                className="playerControlButton"
                onClick={handleNext}
                aria-label="Next"
                disabled={isSongMissing}
              >
                <span aria-hidden="true">
                  <Icons.Next />
                </span>
              </button>
            </div>
            <div className="playerProgress">
              <div className="playerTimeLabel playerTimeCurrent">{currentTimeLabel}</div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress.percent}
                onChange={handleProgressChange}
                className="playerProgressSlider"
                aria-label="Progress bar"
                disabled={isSongMissing}
              />
              <div className="playerTimeLabel playerTimeTotal">{totalTimeLabel}</div>
            </div>
          </nav>

          <nav className="playerRightPanel">
            <button
              type="button"
              className="playerVolumeButton"
              onClick={handleMuteToggle}
              aria-label={volume > 0 ? "Mute" : "Unmute"}
              title={volume > 0 ? "Mute" : "Unmute"}
            >
              <span aria-hidden="true">{volumeIcon}</span>
            </button>
            <input
              className="playerVolumeSlider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume control"
            />

            <div className="playerListControlGroup" ref={playlistDropdownRef}>
              <button
                type="button"
                className="playerListToggle"
                onClick={() => setIsPlaylistOpen((value) => !value)}
                aria-haspopup="true"
                aria-expanded={isPlaylistOpen}
                aria-controls="playerListDropdown"
                title="Playlist"
              >
                <span aria-hidden="true">
                  <Icons.List />
                </span>
              </button>

              <div className={`playerListDropdownWrapper ${isPlaylistOpen ? "is-open" : ""}`}>
                {isPlaylistOpen && (
                  <div
                    className="playerListDropdown"
                    id="playerListDropdown"
                    role="menu"
                    aria-label="Playlist"
                  >
                    {playlistItems.length === 0 ? (
                      <p className="playerListEmpty">No songs available.</p>
                    ) : (
                      <ul className="playerListItems">
                        {playlistItems.map(({ id, title: songTitle, artist: songArtist, index }) => {
                          const isActive = index === currentIndex;
                          return (
                            <li key={id} role="none">
                              <button
                                ref={isActive ? activeSongButtonRef : null}
                                type="button"
                                className={`playerListItem ${isActive ? "is-active" : ""}`}
                                onClick={() => {
                                  setCurrentIndex(index);
                                  setIsPlaying(true);
                                  setIsPlaylistOpen(false);
                                }}
                                role="menuitemradio"
                                aria-checked={isActive}
                              >
                                <span className="playerListIndex">{index + 1}</span>
                                <span className="playerListText">
                                  <span className="playerListTitle">{songTitle}</span>
                                  {songArtist && <span className="playerListArtist">{songArtist}</span>}
                                </span>
                                {isActive && (
                                  <span className="playerListIcon" aria-hidden="true">
                                    <Icons.Play />
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="playerAiImagesButton"
              onClick={() => setIsVisualizerOpen(true)}
              title="AI visualizer"
              aria-label="AI visualizer"
              disabled={isSongMissing}
            >
              <span aria-hidden="true">
                <Icons.Image />
              </span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

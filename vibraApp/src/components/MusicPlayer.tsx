import { useEffect, useRef, useState } from "react";
import "./MusicPlayer.css";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoadingPromise?: Promise<void>;
  }
}

const PLAYLIST: { id: string; title?: string; artist?: string }[] = [
  { id: "iKI5q_hF0o0" },
  { id: "Ulnobym-Ouo" },
  { id: "N0Ovqd-epOI" },
  { id: "eUlGF_8r5Ac" },
  { id: "hXYCrTX-l24" },
];

/** Ajuste: activar o no el “warm-up” de los preloads (silenciado 1s y pausa) */
const PRELOAD_WARM_PLAY = true;

/** Carga única de la YouTube IFrame API */
function loadYouTubeAPI(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();

  if (!window._ytApiLoadingPromise) {
    window._ytApiLoadingPromise = new Promise<void>((resolve) => {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => resolve();
    });
  }
  return window._ytApiLoadingPromise!;
}

/** OEmbed para obtener title / author_name / thumbnail_url sin clave de API */
async function fetchVideoInfo(videoId: string) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("oEmbed error");
    return await res.json(); // { title, author_name, thumbnail_url, ... }
  } catch {
    return {
      title: "Unknown title",
      author_name: "Unknown artist",
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}

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
  /** Player principal oculto */
  const playerRef = useRef<any>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);

  /** Players ocultos para PRELOAD de anterior/siguiente */
  const preloadNextRef = useRef<any>(null);
  const preloadPrevRef = useRef<any>(null);
  const preloadNextHostRef = useRef<HTMLDivElement | null>(null);
  const preloadPrevHostRef = useRef<HTMLDivElement | null>(null);

  /** Estado de reproducción y metadatos */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  /** Info visual (título / canal / miniatura) */
  const [trackTitle, setTrackTitle] = useState("Cargando...");
  const [trackAuthor, setTrackAuthor] = useState("");
  const [trackThumb, setTrackThumb] = useState<string>("");

  /** Intervalo para el polling de progreso */
  const pollIntervalRef = useRef<number | null>(null);

  /** “Calienta” un player: cue + (opcional) play 1s en mute y pausa */
  async function primePlayer(player: any, videoId: string, doWarmPlay = PRELOAD_WARM_PLAY) {
    if (!player) return;
    try {
      player.mute?.();
      player.cueVideoById?.(videoId);
      if (doWarmPlay) {
        try {
          player.playVideo?.();
          setTimeout(() => {
            player.pauseVideo?.();
          }, 1000);
        } catch {
          // si el navegador bloquea autoplay silenciado, igualmente queda cue'd
        }
      }
    } catch {
      // silencioso
    }
  }

  /** Cargar título/autor/miniatura */
  const updateTrackInfo = async (id: string) => {
    const info = await fetchVideoInfo(id);
    setTrackTitle(info.title);
    setTrackAuthor(info.author_name);
    const fallback = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    setTrackThumb(info.thumbnail_url || fallback);
  };

  /** Inicialización de players (principal + preloads) y polling */
  useEffect(() => {
    let destroyed = false;

    (async () => {
      await loadYouTubeAPI();
      if (destroyed) return;

      // Player principal
      playerRef.current = new window.YT.Player(playerHostRef.current!, {
        width: 0,
        height: 0,
        videoId: PLAYLIST[currentIndex].id,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: (e: any) => {
            const d = e.target.getDuration?.() || 0;
            if (d) setDuration(d);
          },
          onStateChange: (e: any) => {
            const YTS = window.YT.PlayerState;
            if (e.data === YTS.PLAYING) setIsPlaying(true);
            if (e.data === YTS.PAUSED || e.data === YTS.ENDED) setIsPlaying(false);
            if (e.data === YTS.ENDED) nextTrack(true);
          },
        },
      });

      // Preloads (prev/next), ocultos y silenciados
      const prevIdx = (currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
      const nextIdx = (currentIndex + 1) % PLAYLIST.length;

      preloadPrevRef.current = new window.YT.Player(preloadPrevHostRef.current!, {
        width: 0,
        height: 0,
        videoId: PLAYLIST[prevIdx].id,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, fs: 0, enablejsapi: 1 },
        events: { onReady: (e: any) => e.target.mute?.() },
      });

      preloadNextRef.current = new window.YT.Player(preloadNextHostRef.current!, {
        width: 0,
        height: 0,
        videoId: PLAYLIST[nextIdx].id,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, fs: 0, enablejsapi: 1 },
        events: { onReady: (e: any) => e.target.mute?.() },
      });

      // Cargar info inicial
      updateTrackInfo(PLAYLIST[currentIndex].id);
    })();

    // Polling de tiempo/duración
    const startPolling = () => {
      if (pollIntervalRef.current != null) return;
      pollIntervalRef.current = window.setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        const ct = p.getCurrentTime?.() || 0;
        const d = p.getDuration?.() || duration;
        setCurrentTime(ct);
        if (d && d !== duration) setDuration(d);
      }, 250) as unknown as number;
    };
    startPolling();

    return () => {
      destroyed = true;
      try { playerRef.current?.destroy?.(); } catch {}
      try { preloadPrevRef.current?.destroy?.(); } catch {}
      try { preloadNextRef.current?.destroy?.(); } catch {}
      if (pollIntervalRef.current != null) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Carga una pista por índice y actualiza preloads */
  const loadTrack = (index: number, autoplay = false) => {
    const p = playerRef.current;
    if (!p) return;

    const safeIndex = ((index % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
    setCurrentIndex(safeIndex);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const videoId = PLAYLIST[safeIndex].id;
    autoplay ? p.loadVideoById(videoId) : p.cueVideoById(videoId);
    updateTrackInfo(videoId);

    // Calcular IDs adyacentes y “calentar” prev/next
    const prevIdx = (safeIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    const nextIdx = (safeIndex + 1) % PLAYLIST.length;
    primePlayer(preloadPrevRef.current, PLAYLIST[prevIdx].id, PRELOAD_WARM_PLAY);
    primePlayer(preloadNextRef.current, PLAYLIST[nextIdx].id, PRELOAD_WARM_PLAY);
  };

  const togglePlayPause = () => {
    const p = playerRef.current;
    if (!p) return;
    const YTS = window.YT.PlayerState;
    const state = p.getPlayerState?.();
    if (state !== YTS.PLAYING) p.playVideo();
    else p.pauseVideo();
  };

  const prevTrack = (autoplay = true) => loadTrack(currentIndex - 1, autoplay);
  const nextTrack = (autoplay = true) => loadTrack(currentIndex + 1, autoplay);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = playerRef.current;
    if (!p || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    const newTime = pct * duration;
    p.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Player principal oculto */}
      <div
        ref={playerHostRef}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Preloads ocultos (prev / next) */}
      <div
        ref={preloadPrevHostRef}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <div
        ref={preloadNextHostRef}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* UI del reproductor */}
      <div className="MusicPlayer__MainContainer">
        <nav className="MusicPlayer__LeftNav">
          <div className="MusicPlayer__albumArtContainer">
            {trackThumb && (
              <img
                src={trackThumb}
                alt={trackTitle ? `Cover: ${trackTitle}` : "Cover"}
                className="MusicPlayer__albumArtImage"
                loading="eager"
                decoding="async"
              />
            )}
          </div>
          <div className="MusicPlayer__trackInfoContainer">
            <div className="MusicPlayer__trackTitle">{trackTitle}</div>
            <div className="MusicPlayer__artistName">{trackAuthor}</div>
          </div>
        </nav>

        <nav className="MusicPlayer__CenterNav">
          <div className="MusicPlayer__musicControlsContainer">
            <div
              className="MusicPlayer__button_backTrack"
              id="MusicPlayer__button_backTrack"
              onClick={() => prevTrack(true)}
              role="button"
              title="Anterior"
              aria-label="Anterior"
            >
              ⏮
            </div>

            <div
              className="MusicPlayer__button_playStop"
              id="MusicPlayer__button_playStop"
              onClick={togglePlayPause}
              role="button"
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
              title={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? "⏸" : "▶"}
            </div>

            <div
              className="MusicPlayer__button_nextTrack"
              id="MusicPlayer__button_nextTrack"
              onClick={() => nextTrack(true)}
              role="button"
              title="Siguiente"
              aria-label="Siguiente"
            >
              ⏭
            </div>
          </div>

          {/* Barra de progreso + tiempos */}
          <div className="MusicPlayer__progressBarContainer">
            <div className="MusicPlayer__time MusicPlayer__currentTime">{formatTime(currentTime)}</div>

            <div
              className="MusicPlayer__progressTrack"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              onClick={handleSeek}
              title="Click para buscar en la pista"
            >
              <div className="MusicPlayer__progressFill" style={{ width: `${progress}%` }} />
            </div>

            <div className="MusicPlayer__time MusicPlayer__totalTime">{formatTime(duration)}</div>
          </div>
        </nav>

        <nav className="MusicPlayer__RightNav">
          <div className="MusicPlayer__volumeControl">🔊</div>
          <div className="MusicPlayer__playlistControl">📃</div>
          <div className="MusicPlayer__iaImagesControl">🖼️</div>
        </nav>
      </div>
    </>
  );
}
    
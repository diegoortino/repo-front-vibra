import { useEffect, useMemo, useRef, useState } from "react";
import YouTube from "react-youtube";
import type { YouTubeEvent } from "react-youtube";
import { useMusicContext } from "../context/MusicContext";
import './MusicPlayer.css';


/**
 * MusicPlayer — mantiene la lógica actual (3 iframes YouTube hidden, prev/cur/next,
 * progreso, volumen, etc.) pero renderiza con el HTML/clases que pediste.
 */
export default function MusicPlayer() {
  const {
    youtubeIdPrev: youtubeIdAnterior,
    youtubeIdCurrent: youtubeIdActual,
    youtubeIdNext: youtubeIdSiguiente,
    playlistName: nombrePlaylist,
    playlistSongs,
    imageLinks: urlsImagenes,
    setCurrentIndex: setIndiceActual,
  } = useMusicContext();

  // Utilidades derivadas
  const idsCanciones = useMemo(() => playlistSongs.map((t) => t.youtubeId), [playlistSongs]);
  const currentIndex = useMemo(() => {
    const id = youtubeIdActual ?? "";
    return Math.max(0, idsCanciones.indexOf(id));
  }, [youtubeIdActual, idsCanciones]);

  const track = playlistSongs[currentIndex] || null;
  const trackThumb = track?.imageUrl || urlsImagenes[currentIndex % Math.max(1, urlsImagenes.length)] || "";
  const trackTitle = track?.title || youtubeIdActual || "Sin selección";
  const trackAuthor = track?.artist || nombrePlaylist || "Playlist";

  // Refs de players YouTube
  const prevRef = useRef<YouTubePlayer | null>(null);
  const curRef = useRef<YouTubePlayer | null>(null);
  const nextRef = useRef<YouTubePlayer | null>(null);

  // Ref de <audio> (maqueta solicitada; no controla reproducción)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estado UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0); // seg
  const [currentTime, setCurrentTime] = useState(0); // seg

  // Volumen (UI en 0..1) y mute, pero player usa 0..100
  const [volume01, setVolume01] = useState(0.7); // slider 0..1
  const [isMuted, setIsMuted] = useState(false);
  const volume100 = Math.round((isMuted ? 0 : volume01) * 100);
  const volumePercentage = Math.round(volume01 * 100);

  // Sincroniza volumen en el player actual
  useEffect(() => {
    curRef.current?.setVolume?.(volume100);
  }, [volume100]);

  // Intervalo de progreso cuando está reproduciendo
  useEffect(() => {
    if (!isPlaying) return;
    const h = setInterval(() => {
      const t = curRef.current?.getCurrentTime?.() ?? 0;
      const d = curRef.current?.getDuration?.() ?? 0;
      setCurrentTime(t);
      if (Number.isFinite(d) && d > 0) setDuration(d);
    }, 250);
    return () => clearInterval(h);
  }, [isPlaying]);

  // Cargar videos en los 3 players cuando cambien los IDs
  useEffect(() => {
    try {
      if (prevRef.current && youtubeIdAnterior) prevRef.current.cueVideoById({ videoId: youtubeIdAnterior });
      if (nextRef.current && youtubeIdSiguiente) nextRef.current.cueVideoById({ videoId: youtubeIdSiguiente });
      if (curRef.current && youtubeIdActual) {
        curRef.current.cueVideoById({ videoId: youtubeIdActual });
        setTimeout(() => {
          if (isPlaying) curRef.current?.playVideo?.();
          else curRef.current?.pauseVideo?.();
        }, 150);
        setCurrentTime(0);
        const d = curRef.current.getDuration?.() ?? 0;
        if (Number.isFinite(d) && d > 0) setDuration(d);
      }
    } catch {}
  }, [youtubeIdAnterior, youtubeIdActual, youtubeIdSiguiente, isPlaying]);

  // Handlers onReady/onStateChange
  const onReady = (which: "prev" | "cur" | "next") => (e: YouTubeEvent) => {
    const player = e.target as unknown as YouTubePlayer;
    if (which === "prev") prevRef.current = player;
    if (which === "cur") {
      curRef.current = player;
      player.setVolume(volume100);
    }
    if (which === "next") nextRef.current = player;
  };

  const onStateChange = (e: YouTubeEvent) => {
    const state = e.target.getPlayerState?.(); // 0 ENDED, 1 PLAY, 2 PAUSE
    if (state === 1) setIsPlaying(true);
    if (state === 2) setIsPlaying(false);
    if (state === 0) nextSong();
  };

  // Controles (mapeados a nombres pedidos en el HTML)
  const play = () => {
    curRef.current?.playVideo?.();
    setIsPlaying(true);
  };
  const pause = () => {
    curRef.current?.pauseVideo?.();
    setIsPlaying(false);
  };
  const togglePlayPause = () => {
    isPlaying ? pause() : play();
  };
  const nextSong = () => setIndiceActual(currentIndex + 1);
  const prevSong = () => setIndiceActual(currentIndex - 1);

  // Seek por click en la barra de progreso
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const trackEl = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - trackEl.left) / trackEl.width));
    const sec = (duration || 0) * ratio;
    curRef.current?.seekTo?.(sec, true);
    setCurrentTime(sec);
  };

  // Volumen (slider 0..1)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(1, Math.max(0, Number(e.target.value)));
    setVolume01(v);
    if (isMuted && v > 0) setIsMuted(false);
  };
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      curRef.current?.setVolume?.(Math.round(volume01 * 100));
    } else {
      setIsMuted(true);
      curRef.current?.setVolume?.(0);
    }
  };

  // Utils UI
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString();
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // Opciones para los iframes (ocultos)
  const opts = useMemo(
    () => ({
      height: "0",
      width: "0",
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
      },
    }),
    []
  );

  return (
    <>
      {/* Audio element (oculto, controlado por JS) */}
      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />

      {/* Hidden YouTube players para la lógica actual */}
      <div style={{ display: "none" }} aria-hidden>
        <YouTube videoId={youtubeIdAnterior ?? ""} opts={opts} onReady={onReady("prev")} onStateChange={onStateChange} />
        <YouTube videoId={youtubeIdActual ?? ""} opts={opts} onReady={onReady("cur")} onStateChange={onStateChange} />
        <YouTube videoId={youtubeIdSiguiente ?? ""} opts={opts} onReady={onReady("next")} onStateChange={onStateChange} />
      </div>

      {/* UI del reproductor con tu maquetado/clases */}
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
              onClick={prevSong}
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
              onClick={nextSong}
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
          <div className="MusicPlayer__volumeControl">
            <button
              className="MusicPlayer__volumeButton"
              onClick={toggleMute}
              title={isMuted ? "Activar sonido" : "Silenciar"}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted || volume01 === 0 ? "🔇" : volume01 < 0.5 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume01}
              onChange={handleVolumeChange}
              className="MusicPlayer__volumeSlider"
              title={`Volumen: ${volumePercentage}%`}
              aria-label="Control de volumen"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volumePercentage}
            />
            <span className="MusicPlayer__volumePercentage">{volumePercentage}%</span>
          </div>
          <div className="MusicPlayer__playlistControl">📃</div>
          <div className="MusicPlayer__iaImagesControl">🖼️</div>
        </nav>
      </div>
    </>
  );
}

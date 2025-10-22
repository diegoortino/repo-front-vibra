import { useEffect, useRef, useState } from "react";
import "./MusicPlayer.css";
import { useMusicContext } from '../context';

function formatTime(totalSeconds: number) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Tipo de canción que devuelve tu API */
export type Cancion = {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  duration?: number; // en segundos (opcional)
  genre?: string;
  viewCount?: string;
  publishedAt?: string;
  audioPath?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function MusicPlayer() {
  // Conectar con el MusicContext
  const {
    currentSong,
    nextSong,
    prevSong,
    isPlaying: contextIsPlaying,
    togglePlayPause: contextTogglePlayPause
  } = useMusicContext();

  /** Audio element ref */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /** Estado de reproducción y metadatos */
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1); // 0.0 a 1.0 (100%)
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1); // Para restaurar al desmutear

  /** Info visual (título / canal / miniatura) */
  const [trackTitle, setTrackTitle] = useState("Selecciona una canción");
  const [trackAuthor, setTrackAuthor] = useState("");
  const [trackThumb, setTrackThumb] = useState<string>("");

  /** useEffect que escucha cambios en currentSong del Context (SOLO cuando cambia la canción) */
  useEffect(() => {
    if (!currentSong || !audioRef.current) {
      return;
    }

    // Actualizar la info visual
    setTrackTitle(currentSong.title);
    setTrackAuthor(currentSong.artist);

    // Obtener thumbnail de YouTube (si existe)
    if (currentSong.youtubeId) {
      const thumbUrl = `https://img.youtube.com/vi/${currentSong.youtubeId}/hqdefault.jpg`;
      setTrackThumb(thumbUrl);
    }

    // Solo usar Cloudinary URL
    if (!currentSong.cloudinaryUrl) {
      console.error('No hay URL de Cloudinary para esta canción');
      return;
    }

    audioRef.current.src = currentSong.cloudinaryUrl;
    audioRef.current.load();

    // Solo reproducir si el contexto indica que debe reproducirse
    if (contextIsPlaying) {
      audioRef.current.play().catch((error) => {
        console.error('Error al reproducir:', error);
      });
    } else {
      audioRef.current.pause();
    }

  }, [currentSong]); // Solo depende de currentSong, NO de contextIsPlaying

  /** useEffect separado para manejar play/pause sin recargar la canción */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (contextIsPlaying) {
      audio.play().catch((error) => {
        console.error('Error al reproducir:', error);
      });
    } else {
      audio.pause();
    }
  }, [contextIsPlaying, currentSong]);

  /** Sincronizar estado local con el contexto cuando cambia la canción */
  useEffect(() => {
    setIsPlaying(contextIsPlaying);
  }, [currentSong, contextIsPlaying]);

  /** Sincronizar volumen con el audio element */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  /** Event handlers para el audio element */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      nextSong();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      if (target.error) {
        console.error('Audio error:', target.error.code, target.error.message);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [nextSong]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      return;
    }

    contextTogglePlayPause();

    if (audio.paused) {
      audio.play().catch((error) => {
        console.error('Error al reproducir:', error);
      });
    } else {
      audio.pause();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    const newTime = pct * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Desmutear: restaurar volumen anterior
      setIsMuted(false);
      setVolume(previousVolume);
    } else {
      // Mutear: guardar volumen actual y silenciar
      setPreviousVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const volumePercentage = Math.round(volume * 100);

  /** ====================== UI ====================== */
  return (
    <>
      {/* Audio element (oculto, controlado por JS) */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
      />

      {mostrarVisualizador && (
        <div className="Reproductor__VisualizadorOverlay" onClick={cerrarVisualizador} role="dialog" aria-modal="true">
          <div className="Reproductor__VisualizadorContenido" onClick={(e) => e.stopPropagation()}>
            <div className={`Reproductor__VisualizadorSlider ${animandoSlide ? "is-animating" : ""}`}>
              {animandoSlide && imagenesVisualizador.length > 1 && (
                <img
                  key={`prev-${indicePrevioRef.current}-${imagenesVisualizador[indicePrevioRef.current] || "ph"}`}
                  src={imagenesVisualizador[indicePrevioRef.current] || undefined}
                  alt=""
                  className="Reproductor__Slide Reproductor__Slide--out"
                  draggable={false}
                />
              )}
              <img
                key={`cur-${indiceImagen}-${imagenesVisualizador[indiceImagen] || "ph"}`}
                src={imagenesVisualizador[indiceImagen] || undefined}
                alt=""
                className="Reproductor__Slide Reproductor__Slide--in"
                draggable={false}
              />
              {/* Fallback simple si no hay imágenes */}
              {imagenesVisualizador.length === 0 && (
                <div className="Reproductor__SlideFallback">Sin imágenes disponibles</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="Reproductor__ContenedorPrincipal">
        <nav className="Reproductor__ZonaIzquierda">
          <div className="Reproductor__ContenedorMiniatura" onClick={abrirVisualizador} title="Abrir visualizador de imágenes">
            {miniaturaPista && (
              <img
                src={miniaturaPista}
                alt={tituloPista ? `Portada: ${tituloPista}` : "Portada"}
                className="Reproductor__ImagenMiniatura"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            )}
          </div>
          <div className="Reproductor__ContenedorInfoPista">
            <div className="Reproductor__TituloPista">{tituloPista}</div>
            <div className="Reproductor__AutorPista">{autorPista}</div>
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
          <div className="Reproductor__ContenedorProgreso">
            <div className="Reproductor__Tiempo Reproductor__TiempoActual">{formatearTiempo(tiempoActual)}</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progreso}
              onChange={onCambiarProgreso}
              className="Reproductor__BarraProgreso"
              disabled={!lista.length}
            />
            <div className="Reproductor__Tiempo Reproductor__TiempoTotal">{formatearTiempo(duracion)}</div>
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
              {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
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

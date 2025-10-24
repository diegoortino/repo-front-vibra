// =============================
// File: src/components/MusicPlayer.tsx
// Requisitos acordados:
// - TypeScript + Vite, CSS plano
// - YouTube IFrame API nativo con 3 iframes ocultos (anterior / actual / siguiente)
// - Sin autoplay por defecto; controles nativos ocultos
// - Barra inferior fija (75% ancho), negro + acentos violeta
// - Título (nombre del video), autor (canal) y portada (thumbnail YouTube)
// - Controles: play/pause, prev, next, volumen (con mute), barra de progreso (click para seek)
// - Atajos: Space (play/pause), ←/→ (±5s), ↑/↓ (volumen ±5), M (mute)
// - Al terminar la pista: avanzar si hay siguiente, si no, detener
// - Si un video da error/bloqueo: saltar al siguiente
// - Overlay visualizador: cubre pantalla excepto el reproductor, slide cada 5s, pausa con la música, permanece abierto al cambiar pista
// - Nombres de variables/funciones en español

import React, { useEffect, useRef, useState } from "react";
import "./MusicPlayer.css";
import { useMusicContext } from "../context/MusicContext";

// Tipos globales mínimos para la IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Utilidades
const segundosAmmss = (s: number): string => {
  if (!isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return `${mm}:${ss}`;
};

const obtenerMiniatura = (id?: string) =>
  id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";

// Constantes de estilo/UX
const SALTO_SEGUNDOS = 5;
const ALTURA_REPRODUCTOR_PX = 92; // usado para calcular overlay sin tapar la barra

export default function MusicPlayer() {
  const {
    idsCanciones,
    indiceActual,
    setIndiceActual,
    urlsImagenes,
    nombrePlaylist,
    reproduciendo,
    setReproduciendo,
  } = useMusicContext();

  // Refs para contenedores donde montaremos los iframes
  const refContenedorAnterior = useRef<HTMLDivElement | null>(null);
  const refContenedorActual = useRef<HTMLDivElement | null>(null);
  const refContenedorSiguiente = useRef<HTMLDivElement | null>(null);

  // Instancias YT.Player
  const refPlayerAnterior = useRef<any>(null);
  const refPlayerActual = useRef<any>(null);
  const refPlayerSiguiente = useRef<any>(null);

  // Metadatos de la canción actual (para UI)
  const [tituloCancion, setTituloCancion] = useState<string>("");
  const [autorCancion, setAutorCancion] = useState<string>("");

  // Progreso y duración
  const [segundosActuales, setSegundosActuales] = useState(0);
  const [duracionTotal, setDuracionTotal] = useState(0);

  // Volumen (0-100) y mute
  const [volumen, setVolumen] = useState(100);
  const [muteado, setMuteado] = useState(false);

  // Overlay visualizador
  const [overlayAbierto, setOverlayAbierto] = useState(false);
  const indiceImagen = useRef(0);
  const [urlImagenActual, setUrlImagenActual] = useState<string>(urlsImagenes[0] || "");
  const intervaloSlideRef = useRef<number | null>(null);

  // IDs calculados según el índice actual
  const idActual = idsCanciones[indiceActual];
  const idAnterior = indiceActual > 0 ? idsCanciones[indiceActual - 1] : undefined;
  const idSiguiente = indiceActual < idsCanciones.length - 1 ? idsCanciones[indiceActual + 1] : undefined;

  // Cargar la API de YouTube una sola vez
  useEffect(() => {
    const existeAPI = typeof window !== "undefined" && (window as any).YT && (window as any).YT.Player;
    if (existeAPI) return; // Ya cargada

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      // no-op aquí; los players se crean cuando los contenedores existen
    };

    return () => {
      // Limpieza opcional del callback
      if (window.onYouTubeIframeAPIReady) delete window.onYouTubeIframeAPIReady;
    };
  }, []);

  // Crear / recrear players cuando la API esté disponible y los contenedores existan
  useEffect(() => {
    if (!window.YT || !window.YT.Player) return; // aún no lista

    // Función para crear un player en un contenedor dado con un videoId (cue, sin reproducir)
    const crearPlayer = (
      contenedor: HTMLDivElement | null,
      guardarRef: (p: any) => void,
      videoId?: string
    ) => {
      if (!contenedor) return;
      // Limpiar hijos previos si se re-crea
      contenedor.innerHTML = "";
      const div = document.createElement("div");
      contenedor.appendChild(div);

      const player = new window.YT.Player(div, {
        width: "0",
        height: "0",
        videoId: videoId || undefined,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          // Sin autoplay
          autoplay: 0,
        },
        events: {
          onReady: () => {
            if (videoId) {
              try {
                player.cueVideoById(videoId);
              } catch (_) {}
            }
            // Sincronizar volumen/mute inicial
            try {
              player.setVolume(volumen);
              if (muteado) player.mute(); else player.unMute();
            } catch (_) {}
          },
          onStateChange: (e: any) => {
            // Si es el player actual, actualizamos título/autor y manejamos fin de pista
            if (player === refPlayerActual.current) {
              if (e.data === window.YT.PlayerState.PLAYING) {
                // Actualizar metadatos al arrancar
                try {
                  const data = player.getVideoData();
                  setTituloCancion(data?.title || "");
                  setAutorCancion(data?.author || "");
                  setDuracionTotal(Math.floor(player.getDuration() || 0));
                } catch (_) {}
              }
              if (e.data === window.YT.PlayerState.ENDED) {
                // Si hay siguiente, avanzar; si no, detener reproducción
                if (indiceActual < idsCanciones.length - 1) {
                  manejarSiguiente();
                } else {
                  setReproduciendo(false);
                }
              }
            }
          },
          onError: () => {
            // Si el video falla (bloqueado, etc.), saltamos al siguiente
            if (player === refPlayerActual.current) {
              if (indiceActual < idsCanciones.length - 1) {
                manejarSiguiente();
              } else {
                setReproduciendo(false);
              }
            }
          },
        },
      });

      guardarRef(player);
    };

    // Crear o recrear los tres players
    crearPlayer(refContenedorAnterior.current, (p) => (refPlayerAnterior.current = p), idAnterior);
    crearPlayer(refContenedorActual.current, (p) => (refPlayerActual.current = p), idActual);
    crearPlayer(refContenedorSiguiente.current, (p) => (refPlayerSiguiente.current = p), idSiguiente);

    return () => {
      // Destruir players al desmontar o rehacer
      [refPlayerAnterior.current, refPlayerActual.current, refPlayerSiguiente.current].forEach((p) => {
        try { p?.destroy?.(); } catch (_) {}
      });
      refPlayerAnterior.current = null;
      refPlayerActual.current = null;
      refPlayerSiguiente.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.YT, idAnterior, idActual, idSiguiente]);

  // Cuando cambie el índice actual, actualizamos qué video está en cada player
  useEffect(() => {
    const pa = refPlayerAnterior.current;
    const pc = refPlayerActual.current;
    const ps = refPlayerSiguiente.current;

    try { if (pa && idAnterior) pa.cueVideoById(idAnterior); } catch (_) {}
    try { if (pc && idActual) pc.cueVideoById(idActual); } catch (_) {}
    try { if (ps && idSiguiente) ps.cueVideoById(idSiguiente); } catch (_) {}

    // Si estábamos reproduciendo, reanudar en el nuevo track
    if (reproduciendo && pc && idActual) {
      try { pc.playVideo(); } catch (_) {}
    } else {
      try { pc?.pauseVideo?.(); } catch (_) {}
    }
    // Reset de progreso para la nueva pista
    setSegundosActuales(0);
    setDuracionTotal(0);
  }, [indiceActual, idAnterior, idActual, idSiguiente, reproduciendo]);

  // Polling de progreso/tiempo (cada 500ms) mientras haya player actual
  useEffect(() => {
    const pc = refPlayerActual.current;
    if (!pc) return;
    const id = window.setInterval(() => {
      try {
        const t = pc.getCurrentTime?.() || 0;
        const d = pc.getDuration?.() || 0;
        setSegundosActuales(Math.floor(t));
        setDuracionTotal(Math.floor(d));
      } catch (_) {}
    }, 500);
    return () => window.clearInterval(id);
  }, [refPlayerActual.current]);

  // Sincronizar volumen/mute cuando cambia el estado local
  useEffect(() => {
    [refPlayerAnterior.current, refPlayerActual.current, refPlayerSiguiente.current].forEach((p) => {
      if (!p) return;
      try { p.setVolume(volumen); } catch (_) {}
    });
  }, [volumen]);

  useEffect(() => {
    [refPlayerAnterior.current, refPlayerActual.current, refPlayerSiguiente.current].forEach((p) => {
      if (!p) return;
      try { muteado ? p.mute() : p.unMute(); } catch (_) {}
    });
  }, [muteado]);

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Evitar interferir si se escribe dentro de inputs/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.code === "Space") {
        e.preventDefault();
        alternarPlayPausa();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        adelantar(SALTO_SEGUNDOS);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        retroceder(SALTO_SEGUNDOS);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        setMuteado((m) => !m);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setVolumen((v) => Math.min(100, v + 5));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setVolumen((v) => Math.max(0, v - 5));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lógica del overlay de imágenes (slide cada 5s, pausado si no reproduciendo)
  useEffect(() => {
    const limpiarIntervalo = () => {
      if (intervaloSlideRef.current) {
        window.clearInterval(intervaloSlideRef.current);
        intervaloSlideRef.current = null;
      }
    };

    if (overlayAbierto && reproduciendo && urlsImagenes.length > 0) {
      limpiarIntervalo();
      intervaloSlideRef.current = window.setInterval(() => {
        indiceImagen.current = (indiceImagen.current + 1) % urlsImagenes.length;
        setUrlImagenActual(urlsImagenes[indiceImagen.current]);
      }, 5000) as unknown as number;
    } else {
      limpiarIntervalo();
    }

    return () => limpiarIntervalo();
  }, [overlayAbierto, reproduciendo, urlsImagenes]);

  // Si el array de imágenes cambia “en caliente”, no cortamos el overlay; nos adaptamos
  useEffect(() => {
    if (urlsImagenes.length > 0) {
      // si el índice actual quedó fuera, reencuadrar
      indiceImagen.current = indiceImagen.current % urlsImagenes.length;
      setUrlImagenActual(urlsImagenes[indiceImagen.current]);
    }
  }, [urlsImagenes]);

  // Handlers UI
  const alternarPlayPausa = () => {
    const pc = refPlayerActual.current;
    if (!pc) return;
    try {
      const estado = pc.getPlayerState?.();
      if (estado === window.YT.PlayerState.PLAYING) {
        pc.pauseVideo();
        setReproduciendo(false);
      } else {
        pc.playVideo();
        setReproduciendo(true);
      }
    } catch (_) {}
  };

  const manejarSiguiente = () => {
    if (indiceActual < idsCanciones.length - 1) {
      setIndiceActual(indiceActual + 1);
    }
  };

  const manejarAnterior = () => {
    if (indiceActual > 0) {
      setIndiceActual(indiceActual - 1);
    }
  };

  const adelantar = (seg: number) => {
    const pc = refPlayerActual.current;
    if (!pc) return;
    try {
      const t = pc.getCurrentTime?.() || 0;
      pc.seekTo(t + seg, true);
    } catch (_) {}
  };

  const retroceder = (seg: number) => {
    const pc = refPlayerActual.current;
    if (!pc) return;
    try {
      const t = pc.getCurrentTime?.() || 0;
      pc.seekTo(Math.max(0, t - seg), true);
    } catch (_) {}
  };

  const manejarClickProgreso = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, x / rect.width));
    const nuevoSegundo = Math.floor(ratio * (duracionTotal || 0));
    const pc = refPlayerActual.current;
    try { pc?.seekTo?.(nuevoSegundo, true); } catch (_) {}
  };

  const manejarCambioVolumen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolumen(v);
    if (v === 0) setMuteado(true);
    if (v > 0 && muteado) setMuteado(false);
  };

  const portadaActual = obtenerMiniatura(idActual);

  // Estado vacío
  if (!idsCanciones || idsCanciones.length === 0) {
    return (
      <div className="mp-contenedor-vacio" style={{ height: ALTURA_REPRODUCTOR_PX }}>
        <div className="mp-vacio">No hay canciones disponibles</div>
      </div>
    );
  }

  return (
    <>
      {/* Iframes ocultos */}
      <div className="mp-iframes-ocultos" aria-hidden>
        <div ref={refContenedorAnterior} />
        <div ref={refContenedorActual} />
        <div ref={refContenedorSiguiente} />
      </div>

      {/* Overlay visualizador de imágenes */}
      {overlayAbierto && (
        <div
          className="mp-overlay"
          style={{ height: `calc(100vh - ${ALTURA_REPRODUCTOR_PX}px)` }}
        >
          <div className="mp-overlay-fondo" />
          <div className="mp-overlay-contenido">
            <div className="mp-overlay-slider" key={urlImagenActual}>
              <img src={urlImagenActual} alt="visual" className="mp-overlay-img" />
            </div>
            <button className="mp-overlay-cerrar" onClick={() => setOverlayAbierto(false)} aria-label="Cerrar visualizador">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Barra reproductor */}
      <div className="mp-root" style={{ height: ALTURA_REPRODUCTOR_PX }}>
        <div className="mp-barra">
          {/* Izquierda: portada + info */}
          <div className="mp-info">
            <div className="mp-portada">
              {portadaActual ? (
                <img src={portadaActual} alt="portada" />
              ) : (
                <div className="mp-portada-placeholder" />
              )}
            </div>
            <div className="mp-titulos">
              <div className="mp-titulo" title={tituloCancion || "Canción"}>
                {tituloCancion || "Canción actual"}
              </div>
              <div className="mp-autor" title={autorCancion || "Autor"}>
                {autorCancion || "Autor"}
              </div>
              {nombrePlaylist && (
                <div className="mp-playlist" title={nombrePlaylist}>
                  {nombrePlaylist}
                </div>
              )}
            </div>
          </div>

          {/* Centro: controles + progreso */}
          <div className="mp-centro">
            <div className="mp-controles">
              <button className="mp-btn" onClick={manejarAnterior} aria-label="Anterior">
                {/* Icono Prev */}
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 6h2v12H6zM9 12l10-6v12z"/></svg>
              </button>
              <button className="mp-btn mp-btn-play" onClick={alternarPlayPausa} aria-label="Play/Pause">
                {/* Iconos Play/Pause */}
                {reproduciendo ? (
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <button className="mp-btn" onClick={manejarSiguiente} aria-label="Siguiente">
                {/* Icono Next */}
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 6l10 6-10 6V6zm12 0h2v12h-2z"/></svg>
              </button>
              <button className="mp-btn" onClick={() => setOverlayAbierto((v) => !v)} aria-label="Visualizador de imágenes">
                {/* Icono Imagenes */}
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M21 19V5H3v14h18zM5 7h14v8l-4-4-3 3-2-2L5 17V7z"/></svg>
              </button>
            </div>

            <div className="mp-progreso" onClick={manejarClickProgreso} role="progressbar" aria-valuemin={0} aria-valuemax={duracionTotal} aria-valuenow={segundosActuales}>
              <div className="mp-tiempo">{segundosAmmss(segundosActuales)}</div>
              <div className="mp-barra-progreso">
                <div
                  className="mp-barra-progreso-llenado"
                  style={{ width: `${Math.min(100, (segundosActuales / (duracionTotal || 1)) * 100)}%` }}
                />
              </div>
              <div className="mp-tiempo">{segundosAmmss(duracionTotal)}</div>
            </div>
          </div>

          {/* Derecha: volumen */}
          <div className="mp-derecha">
            <button className="mp-btn" onClick={() => setMuteado((m) => !m)} aria-label="Mute">
              {muteado || volumen === 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M16.5 12l3.5 3.5-1.5 1.5L15 13.5 11.5 17H8v-6h3.5L15 7.5 18.5 11l1.5-1.5L16.5 6l-3 3-1-1-4 4H6v6h2l4-4 1 1 3-3z"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              )}
            </button>
            <input
              className="mp-volumen"
              type="range"
              min={0}
              max={100}
              value={volumen}
              onChange={manejarCambioVolumen}
              aria-label="Control de volumen"
            />
          </div>
        </div>
      </div>
    </>
  );
}


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useMusicContext } from "../context/MusicContext";
import "./MusicPlayer.css";

/** ----------------------------- Tipos utilitarios ---------------------------- */

type Slot = "prev" | "current" | "next";
type Backend = "cloudinary" | "youtube";

type SlotState = {
  backend: Backend | null;
  youtubeId?: string;
  cloudinaryUrl?: string;
  // Implementación concreta del backend:
  player?: any; // YT.Player | HTMLAudioElement
};

type DetalleCancion = {
  id: string;
  titulo: string;
  autor: string;
  index: number;
  
  mini?: string;
};

/** ----------------------------- API de YouTube ------------------------------ */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoadingPromise?: Promise<void>;
  }
}

function cargarAPIYouTube(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();

  if (!window._ytApiLoadingPromise) {
    window._ytApiLoadingPromise = new Promise<void>((resolver) => {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = () => resolver();
    });
  }
  return window._ytApiLoadingPromise!;
}

/** ------------------------------ Utilidades -------------------------------- */

function formatearTiempo(segundosTotales: number) {
  const seg = Math.max(0, Math.floor(segundosTotales || 0));
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** ================================ Componente =============================== */

export function MusicPlayer() {
  /* === Context ============================================================ */
  const {
    playlist,
    indiceActual,
    setIndiceActual,
    urlsImagenes,
    reproduciendo,
    setReproduciendo,
  } = useMusicContext();

  /* === Refs de contenedores (iframes ocultos) ============================= */
  const contenedorAnteriorRef = useRef<HTMLDivElement | null>(null);
  const contenedorActualRef = useRef<HTMLDivElement | null>(null);
  const contenedorSiguienteRef = useRef<HTMLDivElement | null>(null);

  /* === Estado/refs por slot ============================================== */
  const slotsRef = useRef<Record<Slot, SlotState>>({
    prev: { backend: null },
    current: { backend: null },
    next: { backend: null },
  });

  const progresoSegundosRef = useRef(0);
  const duracionSegundosRef = useRef(0);
  const idIntervaloProgresoRef = useRef<number | null>(null);

  // Visualizador: índice actual + timer 5s
  const [mostrarVisualizador, setMostrarVisualizador] = useState(false);
  const [indiceImagen, setIndiceImagen] = useState(0);

  // Panel y lista
  const [panelMovilExpandido, setPanelMovilExpandido] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);

  // Metadatos oEmbed fallback
  const [detallesCanciones, setDetallesCanciones] = useState<Record<string, { titulo?: string; autor?: string; mini?: string }>>({});

  const [volume, setVolume] = useState(1); // 0..1
  const [isMuted, setIsMuted] = useState(false); // Estado de mute
  const previousVolumeRef = useRef(1); // Guardar volumen antes de mute

  // Estado para forzar re-render del progreso
  const [, forceUpdate] = useState(0);

  /* === Derivados ========================================================== */

  // Determina backend según canción
  const backendDeCancion = useCallback((idx: number): Backend | null => {
    const song = playlist[idx];
    if (!song) return null;
    return song.cloudinaryUrl ? "cloudinary" : (song.youtubeId ? "youtube" : null);
  }, [playlist]);

  // IDs/URLs por índice
  const mediaKeys = useCallback((idx: number) => {
    const song = playlist[idx];
    return {
      youtubeId: song?.youtubeId,
      cloudinaryUrl: song?.cloudinaryUrl,
    };
  }, [playlist]);

  // Para la lista visible (título/autor con fallback a oEmbed)
  const itemsLista: DetalleCancion[] = useMemo(
    () =>
      playlist.map((song, index) => {
        const id = song.id || song.youtubeId || `track-${index}`;
        const detalles = detallesCanciones[id];
        // Construir miniatura: si tiene youtubeId, usar imagen de YouTube
        const miniatura = song.youtubeId
          ? `https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`
          : detalles?.mini;
        return {
          id,
          titulo: (song.title || detalles?.titulo || `Canción ${index + 1}`),
          autor: (song.artist || detalles?.autor || ""),
          index,
          mini: miniatura,
        };
      }),
    [playlist, detallesCanciones]
  );

  /* === Helpers de backend unificado ====================================== */

  // get/setCurrentTime + play/pause + duration detrás de una interfaz única
  const backendAPI = useMemo(() => {
    return {
      async ensure(slot: Slot, target: SlotState, mountIn?: HTMLDivElement | null) {
        // Si Cloudinary: creamos/reusamos Audio()
        if (target.backend === "cloudinary") {
          if (!target.player) {
            const a = new Audio();
            a.preload = "auto";
            a.crossOrigin = "anonymous";
            slotsRef.current[slot].player = a;
          }
          return;
        }
        // Si YouTube: montamos YT.Player en su contenedor
        if (target.backend === "youtube" && mountIn && !target.player) {
          await cargarAPIYouTube();

          // Crear una promesa que se resuelve cuando el player está listo
          await new Promise<void>((resolve) => {
            const p = new window.YT.Player(mountIn, {
              height: "0",
              width: "0",
              playerVars: {
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                rel: 0,
                modestbranding: 1,
              },
              events: {
                onReady: () => {
                  slotsRef.current[slot].player = p;
                  resolve();
                },
                onError: (event: any) => {
                  // Códigos de error de YouTube:
                  // 100: Video no encontrado o privado
                  // 101/150: Video no permite embedding
                  if (event.data === 100 || event.data === 101 || event.data === 150) {
                    // Auto-skip a la siguiente canción
                    if (slot === "current") {
                      setTimeout(() => {
                        const nextIdx = Math.min(indiceActual + 1, playlist.length - 1);
                        if (nextIdx !== indiceActual) {
                          setIndiceActual(nextIdx);
                          setReproduciendo(true);
                        }
                      }, 1000);
                    }
                  }
                }
              },
            });
          });
        }
      },
      cue(_slot: Slot, target: SlotState) {
        if (target.backend === "cloudinary") {
          const a: HTMLAudioElement = target.player;
          if (!a) return;
          if (target.cloudinaryUrl) a.src = target.cloudinaryUrl;
          a.currentTime = 0;
          a.pause();
        } else if (target.backend === "youtube") {
          const p = target.player;
          if (!p || !p.cueVideoById) return;
          if (target.youtubeId) p.cueVideoById(target.youtubeId);
        }
      },
      load(_slot: Slot, target: SlotState, autoplay: boolean) {
        if (target.backend === "cloudinary") {
          const a: HTMLAudioElement = target.player;
          if (!a) return;
          if (target.cloudinaryUrl) a.src = target.cloudinaryUrl;
          a.currentTime = 0;
          if (autoplay) a.play().catch(() => {});
          else a.pause();
        } else if (target.backend === "youtube") {
          const p = target.player;
          if (!p || !p.loadVideoById || !p.cueVideoById) return;
          if (target.youtubeId) {
            if (autoplay) p.loadVideoById(target.youtubeId);
            else p.cueVideoById(target.youtubeId);
          }
        }
      },
      play(target: SlotState) {
        if (target.backend === "cloudinary") {
          const a: HTMLAudioElement = target.player;
          a?.play().catch(() => {});
        } else if (target.backend === "youtube") {
          const p = target.player;
          if (p && typeof p.playVideo === 'function') {
            p.playVideo();
          }
        }
      },
      pause(target: SlotState) {
        if (target.backend === "cloudinary") {
          const a: HTMLAudioElement = target.player;
          a?.pause();
        } else if (target.backend === "youtube") {
          const p = target.player;
          if (p && typeof p.pauseVideo === 'function') {
            p.pauseVideo();
          }
        }
      },
      getCurrentTime(target: SlotState): number {
        if (target.backend === "cloudinary") {
          return target.player?.currentTime ?? 0;
        } else if (target.backend === "youtube") {
          return target.player?.getCurrentTime?.() ?? 0;
        }
        return 0;
      },
      getDuration(target: SlotState): number {
        if (target.backend === "cloudinary") {
          return target.player?.duration ?? 0;
        } else if (target.backend === "youtube") {
          const d = target.player?.getDuration?.();
          return Number.isFinite(d) ? d : 0;
        }
        return 0;
      },
      seekTo(target: SlotState, seconds: number) {
        if (target.backend === "cloudinary") {
          if (target.player) target.player.currentTime = seconds;
        } else if (target.backend === "youtube") {
          target.player?.seekTo?.(seconds, true);
        }
      },
      onEnded(_slot: Slot, target: SlotState, cb: () => void) {
        // Limpia listeners previos y vuelve a agregar
        if (target.backend === "cloudinary") {
          const a: HTMLAudioElement = target.player;
          if (!a) return;
          a.onended = cb;
        } else if (target.backend === "youtube") {
          const p = target.player;
          if (!p) return;
          p.addEventListener?.("onStateChange", (e: any) => {
            // 0 = ended
            if (e?.data === 0) cb();
          });
        }
      },
    };
  }, []);

  /* === Preparar slots para el índice actual =============================== */

  const prepararSlots = useCallback(
    async (idx: number, autoplay: boolean) => {
      const prev = Math.max(0, idx - 1);
      const next = Math.min(playlist.length - 1, idx + 1);

      const slots: Record<Slot, { idx: number; container: HTMLDivElement | null }> = {
        prev: { idx: prev, container: contenedorAnteriorRef.current },
        current: { idx, container: contenedorActualRef.current },
        next: { idx: next, container: contenedorSiguienteRef.current },
      };

      // Configurar cada slot con su backend/ids
      (Object.keys(slots) as Slot[]).forEach((slot) => {
        const i = slots[slot].idx;
        const backend = backendDeCancion(i);
        const keys = mediaKeys(i);

        slotsRef.current[slot] = {
          backend,
          youtubeId: keys.youtubeId,
          cloudinaryUrl: keys.cloudinaryUrl,
          player: slotsRef.current[slot].player, // reusar si ya existe
        };
      });

      // Asegurar instancias listas
      for (const slot of ["prev", "current", "next"] as Slot[]) {
        await backendAPI.ensure(slot, slotsRef.current[slot], slots[slot].container);
      }

      // Sincronización estilo “tres players”: cue prev/next, load current
      backendAPI.cue("prev", slotsRef.current.prev);
      backendAPI.cue("next", slotsRef.current.next);
      backendAPI.load("current", slotsRef.current.current, autoplay);

      // listeners de “ended” para auto-avance
      backendAPI.onEnded("current", slotsRef.current.current, () => {
        if (playlist.length <= 1) {
          setReproduciendo(false);
          return;
        }
        setIndiceActual(Math.min(idx + 1, playlist.length - 1));
        setReproduciendo(true);
      });
    },
    [playlist.length, backendAPI, backendDeCancion, mediaKeys, setIndiceActual, setReproduciendo]
  );

  /* === Efectos: inicialización y cambios de índice/reproducción =========== */

  // Inicialización de API YouTube (sólo si alguna canción usa YouTube)
  useEffect(() => {
    const usaYT = playlist.some((s) => !s.cloudinaryUrl && s.youtubeId);
    if (usaYT) cargarAPIYouTube();
  }, [playlist]);

  // Preparar slots SOLO al cambiar de pista (no en play/pause)
  useEffect(() => {
    const autoplay = reproduciendo; // si el estado global dice reproduciendo, cargamos reproduciendo
    prepararSlots(indiceActual, autoplay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceActual]); // Solo cuando cambia el índice

  // Responder a cambios de reproduciendo (play/pause) en el slot current
  useEffect(() => {
    const cur = slotsRef.current.current;
    if (!cur.backend) return;
    if (reproduciendo) backendAPI.play(cur);
    else backendAPI.pause(cur);
  }, [reproduciendo, backendAPI]);

  /* === Polling de progreso (250ms) ======================================== */

  const actualizarProgreso = useCallback(() => {
    const cur = slotsRef.current.current;
    if (!cur?.backend) return;
    const t = backendAPI.getCurrentTime(cur) || 0;
    const d = backendAPI.getDuration(cur) || 0;
    progresoSegundosRef.current = t;
    duracionSegundosRef.current = d;
    // Forzar re-render para actualizar UI
    forceUpdate(prev => prev + 1);
  }, [backendAPI]);

  useEffect(() => {
    if (idIntervaloProgresoRef.current) window.clearInterval(idIntervaloProgresoRef.current);
    idIntervaloProgresoRef.current = window.setInterval(actualizarProgreso, 250) as unknown as number;
    return () => {
      if (idIntervaloProgresoRef.current) window.clearInterval(idIntervaloProgresoRef.current);
    };
  }, [actualizarProgreso]);

  /* === Visualizador: cambio cada 5s ======================================= */

  useEffect(() => {
    if (!mostrarVisualizador) return;
    const id = window.setInterval(() => {
      setIndiceImagen((prev) => (prev + 1) % Math.max(1, urlsImagenes.length));
    }, 5000) as unknown as number;
    return () => window.clearInterval(id);
  }, [mostrarVisualizador, urlsImagenes.length]);

  const cerrarVisualizador = () => setMostrarVisualizador(false);

  /* === Interacciones de UI =============================================== */

  const onTogglePlay = () => setReproduciendo(!reproduciendo);
  const onPrev = () => {
    const nuevo = Math.max(0, indiceActual - 1);
    setIndiceActual(nuevo);
    setReproduciendo(true);
  };
  const onNext = () => {
    const nuevo = Math.min(playlist.length - 1, indiceActual + 1);
    setIndiceActual(nuevo);
    setReproduciendo(true);
  };

  const onChangeProgress = (e: ChangeEvent<HTMLInputElement>) => {
    const porcentaje = Number(e.target.value) || 0;
    const cur = slotsRef.current.current;
    if (!cur?.backend) return;
    const dur = duracionSegundosRef.current || backendAPI.getDuration(cur) || 0;
    const nuevo = (porcentaje / 100) * dur;
    backendAPI.seekTo(cur, nuevo);
  };

  const onChangeVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(1, Math.max(0, Number(e.target.value) || 0));
    setVolume(v);
    if (v > 0) setIsMuted(false); // Si cambias el volumen manualmente, desmutear
  };

  const toggleMute = () => {
    if (isMuted) {
      // Desmutear: restaurar volumen anterior
      setVolume(previousVolumeRef.current);
      setIsMuted(false);
    } else {
      // Mutear: guardar volumen actual y poner a 0
      previousVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Efecto para aplicar volumen a todos los players cuando cambia
  useEffect(() => {
    const aplicar = (s: SlotState) => {
      if (s.backend === "cloudinary") {
        const a: HTMLAudioElement = s.player;
        if (a) a.volume = volume;
      } else if (s.backend === "youtube") {
        // API YT: 0-100
        s.player?.setVolume?.(Math.round(volume * 100));
      }
    };
    aplicar(slotsRef.current.current);
    aplicar(slotsRef.current.prev);
    aplicar(slotsRef.current.next);
  }, [volume]);

  const alternarLista = () =>
    setMostrarLista((prev) => {
      const siguiente = !prev;
      if (siguiente) setPanelMovilExpandido(true);
      return siguiente;
    });

  const onSeleccionarCancion = (index: number) => {
    setIndiceActual(index);
    setReproduciendo(true);
  };

  /* === oEmbed fallback para títulos/autor/mini ============================ */

  useEffect(() => {
    // Trae datos faltantes sólo para los que no tengan title/artist en contexto
    const pendientes = playlist
      .map((song, index) => ({ song, index }))
      .filter(({ song }) => (!song?.title || !song?.artist))
      .map(({ song }) => song.youtubeId)
      .filter(Boolean) as string[];

    if (pendientes.length === 0) return;

    (async () => {
      const entradas = await Promise.allSettled(
        pendientes.map((id) =>
          fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`).then((r) => r.json())
        )
      );

      const patch: Record<string, { titulo?: string; autor?: string; mini?: string }> = {};
      entradas.forEach((res, i) => {
        const id = pendientes[i];
        if (res.status === "fulfilled" && res.value) {
          patch[id] = {
            titulo: res.value.title,
            autor: res.value.author_name,
            mini: res.value.thumbnail_url,
          };
        }
      });
      setDetallesCanciones((prev) => ({ ...prev, ...patch }));
    })();
  }, [playlist]);

  /* === Derivados de UI: tiempos y porcentaje ============================== */

  const tiempoActual = formatearTiempo(progresoSegundosRef.current);
  const tiempoTotal = duracionSegundosRef.current > 0 ? formatearTiempo(duracionSegundosRef.current) : "--:--";
  const porcentaje = duracionSegundosRef.current > 0 ? Math.min(100, (progresoSegundosRef.current / duracionSegundosRef.current) * 100) : 0;

  /* ======================================================================== */
  /* === 11. RENDER ======================================================== */
  /* ======================================================================== */

  // Valores derivados para la UI (usamos lo ya definido arriba)
  const pistaActual = itemsLista[indiceActual] || { titulo: "", autor: "", mini: undefined };
  const tituloPista = pistaActual.titulo || "";
  const autorPista = pistaActual.autor || "";
  const miniaturaPista = pistaActual.mini;
  const progreso = porcentaje; // 0..100
  const duracion = tiempoTotal; // cadena ya formateada
  const tiempo = tiempoActual; // cadena ya formateada

  return (
    <>
      {/* Iframes ocultos que manejan prev / current / next */}
      <div className="mp-iframes-ocultos" aria-hidden="true">
        <div ref={contenedorAnteriorRef} />
        <div ref={contenedorActualRef} />
        <div ref={contenedorSiguienteRef} />
      </div>

      {/* Overlay de visualizador IA (simplificado a una única imagen) */}
      {mostrarVisualizador && (
        <div className="Reproductor__VisualizadorOverlay" onClick={cerrarVisualizador} role="dialog" aria-modal="true">
          <div className="Reproductor__VisualizadorContenido" onClick={(e) => e.stopPropagation()}>
            <div className="Reproductor__VisualizadorSlider">
              {urlsImagenes.length > 0 ? (
                <img
                  key={`vis-${indiceImagen}-${urlsImagenes[indiceImagen] || "ph"}`}
                  src={urlsImagenes[indiceImagen] || undefined}
                  alt=""
                  className="Reproductor__Slide Reproductor__Slide--in"
                  draggable={false}
                />
              ) : (
                <div className="Reproductor__Slide Reproductor__Slide--in" aria-hidden="true">No hay imágenes</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`Reproductor__ContenedorPrincipal ${panelMovilExpandido ? "is-mobile-expanded" : ""}`}>
        <div className="Reproductor__MobileBar">
          <div className="Reproductor__MobileControls">
            <div className="Reproductor__MobileButtons">
              <button
                type="button"
                className="Reproductor__BotonControl"
                onClick={onPrev}
                aria-label="Anterior"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                className="Reproductor__BotonControl"
                onClick={onTogglePlay}
                aria-label={reproduciendo ? "Pausar" : "Reproducir"}
              >
                <span aria-hidden="true">{reproduciendo ? "❚❚" : "▶"}</span>
              </button>
              <button
                type="button"
                className="Reproductor__BotonControl"
                onClick={onNext}
                aria-label="Siguiente"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
            <div className="Reproductor__MobileTrack" title={tituloPista}>
              {tituloPista}
            </div>
          </div>
          <div className="Reproductor__MobileActions">
            <button
              type="button"
              className="Reproductor__MobileActionButton"
              onClick={() => setMostrarVisualizador(true)}
              aria-label="Visualizador de imágenes"
              title="Visualizador de imágenes"
            >
              <span aria-hidden="true">🖼️</span>
            </button>
            <button
              type="button"
              className={`Reproductor__MobileActionButton Reproductor__MobileActionButton--toggle ${panelMovilExpandido ? "is-expanded" : ""}`}
              onClick={() => setPanelMovilExpandido((p) => !p)}
              aria-label={panelMovilExpandido ? "Cerrar panel" : "Abrir panel"}
              title={panelMovilExpandido ? "Cerrar panel" : "Abrir panel"}
            >
              <span aria-hidden="true">{panelMovilExpandido ? "▾" : "▸"}</span>
            </button>
          </div>
        </div>

        <div className="Reproductor__LayoutDetallado">
          {/* Zona izquierda: portada y datos de la pista */}
          <nav className="Reproductor__ZonaIzquierda">
            <div className="Reproductor__ContenedorMiniatura" onClick={() => setMostrarVisualizador(true)} title="Abrir visualizador de imágenes">
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

          {/* Zona central: controles principales y barra de progreso */}
          <nav className="Reproductor__ZonaCentral">
            <div className="Reproductor__ContenedorControles">
              <button className="Reproductor__BotonControl" onClick={onPrev} aria-label="Anterior">
                <span aria-hidden="true">‹</span>
              </button>
              <button className="Reproductor__BotonControl" onClick={onTogglePlay} aria-label={reproduciendo ? "Pausar" : "Reproducir"}>
                <span aria-hidden="true">{reproduciendo ? "❚❚" : "▶"}</span>
              </button>
              <button className="Reproductor__BotonControl" onClick={onNext} aria-label="Siguiente">
                <span aria-hidden="true">›</span>
              </button>
            </div>
            <div className="Reproductor__ContenedorProgreso">
              <div className="Reproductor__Tiempo Reproductor__TiempoActual">{tiempo}</div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progreso}
                onChange={onChangeProgress}
                className="Reproductor__BarraProgreso"
                aria-label="Barra de progreso"
              />
              <div className="Reproductor__Tiempo Reproductor__TiempoTotal">{duracion}</div>
            </div>
          </nav>

          {/* Zona derecha: volumen y accesos directos */}
          <nav className="Reproductor__ZonaDerecha">
            <button
              type="button"
              className="Reproductor__VolumenBtn"
              onClick={toggleMute}
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
              title={isMuted ? "Activar sonido" : "Silenciar"}
            >
              <span aria-hidden="true">{isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}</span>
            </button>

            <input
              className="Reproductor__VolumenRange"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={onChangeVolume}
              aria-label="Control de volumen"
            />

            <div className={`Reproductor__ControlListaWrapper ${mostrarLista ? "is-open" : ""}`}>
              <button
                type="button"
                className="Reproductor__ControlLista"
                onClick={alternarLista}
                aria-haspopup="true"
                aria-expanded={mostrarLista}
                aria-controls="Reproductor__ListaDropdown"
                title="Lista de reproducción"
              >
                <span aria-hidden="true">☰</span>
              </button>

              {mostrarLista && (
                <div
                  className="Reproductor__ListaDropdown"
                  id="Reproductor__ListaDropdown"
                  role="menu"
                  aria-label="Lista de reproducción"
                >
                  {itemsLista.length === 0 ? (
                    <p className="Reproductor__ListaVacia">No hay canciones en la lista.</p>
                  ) : (
                    <ul className="Reproductor__ListaElementos">
                      {itemsLista.map(({ id, titulo, autor, index }) => {
                        const activo = index === indiceActual;
                        return (
                          <li key={id} role="none">
                            <button
                              type="button"
                              className={`Reproductor__ListaCancion ${activo ? "is-active" : ""}`}
                              onClick={() => onSeleccionarCancion(index)}
                              role="menuitemradio"
                              aria-checked={activo}
                            >
                              <span className="Reproductor__ListaIndice">{index + 1}</span>
                              <span className="Reproductor__ListaTexto">
                                <span className="Reproductor__ListaTitulo">{titulo}</span>
                                {autor && <span className="Reproductor__ListaAutor">{autor}</span>}
                              </span>
                              {activo && (
                                <span className="Reproductor__ListaIcono" aria-hidden="true">
                                  ▶
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
            <button
              type="button"
              className="Reproductor__ControlImagenesIA"
              onClick={() => setMostrarVisualizador(true)}
              title="Visualizador IA"
              aria-label="Visualizador IA"
            >
              <span aria-hidden="true">🖼️</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

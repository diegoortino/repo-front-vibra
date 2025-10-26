/**
 * Componente central del reproductor.
 *
 * El objetivo del refactor es ordenar el archivo y documentar cada parte del flujo para
 * que resulte sencillo seguir cómo se arma el reproductor, cómo se sincronizan los iframes
 * de YouTube, cómo se controlan los estados internos (volumen, progreso, visualizador, etc.)
 * y cómo se conectan los callbacks.  La estructura general queda así:
 *
 *   1. Dependencias e iconografía.
 *   2. Valores constantes compartidos (lista de reproducción, imágenes, API de YouTube).
 *   3. Helpers puros reutilizables.
 *   4. Definición del componente `MusicPlayer` con secciones claramente comentadas:
 *        4.1. Referencias persistentes a iframes y valores derivados.
 *        4.2. Estados de React que disparan re-renders.
 *        4.3. Efectos de volumen, progreso, polling y visualizador.
 *        4.4. Callbacks de sincronización entre slots prev/actual/next.
 *        4.5. Renderizado JSX del reproductor y del visualizador de imágenes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, MutableRefObject } from "react";

import { imagelistToPlayer, playlistToPlayer, songToPlayer } from "../context/MusicContext";

import "./MusicPlayer.css";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoadingPromise?: Promise<void>;
  }
}

/** ====== Iconos SVG (heredan currentColor) ====== */
const Icon = {
  Prev: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M208,47.88V208.12a16,16,0,0,1-24.43,13.43L64,146.77V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0v69.23L183.57,34.45A15.95,15.95,0,0,1,208,47.88Z"></path></svg>
  ),
  Next: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M208,40V216a8,8,0,0,1-16,0V146.77L72.43,221.55A15.95,15.95,0,0,1,48,208.12V47.88A15.95,15.95,0,0,1,72.43,34.45L192,109.23V40a8,8,0,0,1,16,0Z"></path></svg>
  ),
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"></path></svg>
  ),
  Pause: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z"></path></svg>
  ),
  List: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM64,72H192a8,8,0,0,1,0,16H64a8,8,0,0,1,0-16Zm0,48h72a8,8,0,0,1,0,16H64a8,8,0,0,1,0-16Zm40,64H64a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Zm103.59-53.47a8,8,0,0,1-10.12,5.06L184,131.1V176a24,24,0,1,1-16-22.62V120a8,8,0,0,1,10.53-7.59l24,8A8,8,0,0,1,207.59,130.53Z"></path></svg>
  ),
  Playing: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 256 256"
      fill="currentColor"
    >
      <path d="M56,216a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V208A8,8,0,0,1,56,216Zm56-24V64a8,8,0,0,0-16,0V192a8,8,0,0,0,16,0Zm40,16a8,8,0,0,0,16,0V48a8,8,0,0,0-16,0Zm64-8V88a8,8,0,0,0-16,0v112a8,8,0,0,0,16,0Z"></path>
    </svg>
  ),
  Image: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM156,88a12,12,0,1,1-12,12A12,12,0,0,1,156,88Zm60,112H40V160.69l46.34-46.35a8,8,0,0,1,11.32,0h0L165,181.66a8,8,0,0,0,11.32-11.32l-17.66-17.65L173,138.34a8,8,0,0,1,11.31,0L216,170.07V200Z"></path></svg>
  ),
  VolMute: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M245.66,146.34a8,8,0,0,1-11.32,11.32L216,139.31l-18.34,18.35a8,8,0,0,1-11.32-11.32L204.69,128l-18.35-18.34a8,8,0,0,1,11.32-11.32L216,116.69l18.34-18.35a8,8,0,0,1,11.32,11.32L227.31,128ZM60,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H60a4,4,0,0,0,4-4V84A4,4,0,0,0,60,80Zm97.15-54.15a8,8,0,0,0-10-.16l-65.57,51A4,4,0,0,0,80,79.84v96.32a4,4,0,0,0,1.55,3.15l65.57,51a8,8,0,0,0,9,.56,8.29,8.29,0,0,0,3.91-7.18V32.25A8.27,8.27,0,0,0,157.12,25.85Z"></path></svg>
  ),
  VolLow: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M160,32.25V223.69a8.29,8.29,0,0,1-3.91,7.18,8,8,0,0,1-9-.56l-65.57-51A4,4,0,0,1,80,176.16V79.84a4,4,0,0,1,1.55-3.15l65.57-51a8,8,0,0,1,10,.16A8.27,8.27,0,0,1,160,32.25ZM60,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H60a4,4,0,0,0,4-4V84A4,4,0,0,0,60,80ZM198,101.56a8,8,0,1,0-12,10.58,24,24,0,0,1,0,31.72,8,8,0,1,0,12,10.58,40,40,0,0,0,0-52.88Z"></path></svg>
  ),
  VolMid: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M168,32V224a8,8,0,0,1-12.91,6.31L85.25,176H40a16,16,0,0,1-16-16V96A16,16,0,0,1,40,80H85.25l69.84-54.31A8,8,0,0,1,168,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,200,96Zm32-16a8,8,0,0,0-8,8v80a8,8,0,0,0,16,0V88A8,8,0,0,0,232,80Z"></path></svg>
  ),
  VolHigh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M160,32.25V223.69a8.29,8.29,0,0,1-3.91,7.18,8,8,0,0,1-9-.56l-65.57-51A4,4,0,0,1,80,176.16V79.84a4,4,0,0,1,1.55-3.15l65.57-51a8,8,0,0,1,10,.16A8.27,8.27,0,0,1,160,32.25ZM60,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H60a4,4,0,0,0,4-4V84A4,4,0,0,0,60,80Zm126.77,20.84a8,8,0,0,0-.72,11.3,24,24,0,0,1,0,31.72,8,8,0,1,0,12,10.58,40,40,0,0,0,0-52.88A8,8,0,0,0,186.74,100.84Zm40.89-26.17a8,8,0,1,0-11.92,10.66,64,64,0,0,1,0,85.34,8,8,0,1,0,11.92,10.66,80,80,0,0,0,0-106.66Z"></path></svg>
  ),  ChevronUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
      <path d="M208.49,168.49a12,12,0,0,1-17,0L128,105,64.49,168.49a12,12,0,0,1-17-17l72-72a12,12,0,0,1,17,0l72,72A12,12,0,0,1,208.49,168.49Z"></path>
    </svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
      <path d="M207.51,87.51a12,12,0,0,0-17,0L128,150.06,65.49,87.51a12,12,0,0,0-17,17l72,72a12,12,0,0,0,17,0l72-72A12,12,0,0,0,207.51,87.51Z"></path>
    </svg>
  ),

};

/** Lista de videos (YouTube IDs) */
const LISTA_REPRODUCCION = playlistToPlayer();

/** Arreglo de url de imágenes para el visualizador */
const IMAGENES_VISUALIZADOR = imagelistToPlayer();

/**
 * Precarga básica/templada de iframes.
 *
 * El flujo ideal es:
 *   1. Si la API ya está disponible devolvemos una promesa resuelta.
 *   2. Si la API no se ha solicitado aún guardamos la promesa de carga globalmente.
 *   3. Cuando la API termine de cargar resolvemos la promesa.
 */
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

/**
 * Formatea un tiempo (en segundos) a un string legible mm:ss o hh:mm:ss.
 */
function formatearTiempo(segundosTotales: number) {
  const seg = Math.max(0, Math.floor(segundosTotales || 0));
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/**
 * Tipo de slot que usamos para manejar tres instancias de iframe en paralelo:
 *   - prev: pista anterior
 *   - current: pista actual
 *   - next: pista siguiente
 */
type Slot = "prev" | "current" | "next";

export function MusicPlayer() {
  /* ======================================================================== */
  /* === 1. REFERENCIAS PERSISTENTES (sobreviven entre renders)            === */
  /* ======================================================================== */

  /** Referencias a los contenedores HTML donde se montan los iframes. */
  const contenedorAnteriorRef = useRef<HTMLDivElement | null>(null);
  const contenedorActualRef = useRef<HTMLDivElement | null>(null);
  const contenedorSiguienteRef = useRef<HTMLDivElement | null>(null);

  /** Instancias reales de YT.Player (una por slot). */
  const playerAnteriorRef = useRef<any>(null);
  const playerActualRef = useRef<any>(null);
  const playerSiguienteRef = useRef<any>(null);

  /**
   * Callbacks y referencias auxiliares que necesitamos para coordinar acciones sin
   * re-renderizar el componente:
   *   - `pistaSiguienteRef`: callback que avanza a la pista siguiente.
   *   - `videosObjetivoRef`: mapea cada slot al ID de video que debe mostrar.
   *   - `autoplayPendienteRef`: indica si debemos reproducir automáticamente tras un cambio.
   *   - `indiceActualRef`: espejo mutable del índice actual (para eventos externos).
   *   - `estaReproduciendoRef`: espejo mutable del estado de reproducción.
   */
  const pistaSiguienteRef = useRef<(autoplay?: boolean) => void>(() => {});
  const videosObjetivoRef = useRef<Record<Slot, string | undefined>>({ prev: undefined, current: undefined, next: undefined });
  const autoplayPendienteRef = useRef(false);
  const indiceActualRef = useRef(0);
  const estaReproduciendoRef = useRef(false);

  /**
   * Valores iniciales provenientes del contexto: `songToPlayer` nos da la pista inicial.
   * Calculamos la posición dentro de la lista y almacenamos un override temporal para que
   * el primer iframe cargue exactamente ese ID aunque la lista cambie posteriormente.
   */
  const inicioContexto = songToPlayer();
  const indiceInicialEnLista = LISTA_REPRODUCCION.findIndex((entrada) => entrada?.id === inicioContexto?.id);
  const indiceInicial = indiceInicialEnLista >= 0 ? indiceInicialEnLista : 0;
  const idInicialOverrideRef = useRef<string | null>(inicioContexto?.id || null);

  /** Identificador del intervalo usado para actualizar el progreso con polling. */
  const idIntervaloProgresoRef = useRef<number | null>(null);

  /** Cache in-memory de imágenes precargadas para el visualizador. */
  const cacheImagenesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  /** Control de timeout para la animación del slider en el visualizador. */
  const animacionTimeoutRef = useRef<number | null>(null);

  /** Guardamos el índice anterior (en el visualizador) para animaciones. */
  const indicePrevioRef = useRef(0);

  /* ======================================================================== */
  /* === 2. ESTADOS REACTIVOS (disparan re-render)                          === */
  /* ======================================================================== */

  /** Índice actual dentro de la lista de reproducción. */
  const [indiceActual, setIndiceActual] = useState(0);

  /**
   * Estados derivados de la reproducción: si el player actual está sonando, duración total
   * y tiempo transcurrido (ambos en segundos).
   */
  const [estaReproduciendo, setEstaReproduciendo] = useState(false);
  const [duracion, setDuracion] = useState(0);
  const [tiempoActual, setTiempoActual] = useState(0);

  /**
   * Metadatos de la pista actual (obtenidos vía oEmbed): título, autor y miniatura.
   */
  const [tituloPista, setTituloPista] = useState("Cargando...");
  const [autorPista, setAutorPista] = useState("");
  const [miniaturaPista, setMiniaturaPista] = useState<string>("");

  /**
   * Estados y refs derivados del control de volumen/mute.  El rango es 0..1 porque lo
   * utilizamos directamente en los sliders `<input type="range">`.
   */
  const [volumen, setVolumen] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const prevVolRef = useRef(0.8);
  const volumenRef = useRef(volumen);
  const mutedRef = useRef(muted);

  /**
   * Estado y refs de la lista desplegable con las canciones de la playlist.
   */
  const [mostrarLista, setMostrarLista] = useState(false);
  const listaWrapperRef = useRef<HTMLDivElement | null>(null);
  const [detallesCanciones, setDetallesCanciones] = useState<Record<string, { titulo: string; autor: string }>>({});

  /**
   * Estados del visualizador de imágenes (overlay con transiciones).
   */
  const [mostrarVisualizador, setMostrarVisualizador] = useState(false);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [animandoSlide, setAnimandoSlide] = useState(false);
  const [panelMovilExpandido, setPanelMovilExpandido] = useState(false);

  /* ======================================================================== */
  /* === 3. EFECTOS RELACIONADOS CON EL VOLUMEN ============================ */
  /* ======================================================================== */

  useEffect(() => {
    const players = [playerAnteriorRef.current, playerActualRef.current, playerSiguienteRef.current];
    const vol0a100 = Math.round(volumen * 100);

    players.forEach((player) => {
      if (!player || typeof player.setVolume !== "function") return;

      if (muted || vol0a100 <= 0) {
        player.mute?.();
        player.setVolume?.(0);
      } else {
        player.unMute?.();
        player.setVolume?.(vol0a100);
      }
    });
  }, [volumen, muted]);

  useEffect(() => {
    volumenRef.current = volumen;
  }, [volumen]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  /* ======================================================================== */
  /* === 3.b LISTA DESPLEGABLE DE PLAYLIST ================================= */
  /* ======================================================================== */

  useEffect(() => {
    let cancelado = false;
    const idsUnicos = Array.from(
      new Set(
        LISTA_REPRODUCCION.map((entrada) => entrada?.id).filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    if (!idsUnicos.length) return;

    const cargarMetadatos = async () => {
      const resultados = await Promise.all(
        idsUnicos.map(async (id) => {
          try {
            const respuesta = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
            );
            if (!respuesta.ok) throw new Error(`Respuesta ${respuesta.status}`);
            const data = await respuesta.json();
            return [id, { titulo: data.title || "Sin título", autor: data.author_name || "" }] as const;
          } catch (error) {
            console.warn("No se pudieron precargar metadatos de la lista", id, error);
            return [id, { titulo: `Canción ${id}`, autor: "" }] as const;
          }
        })
      );

      if (cancelado) return;

      setDetallesCanciones((prev) => {
        const actualizado = { ...prev };
        resultados.forEach(([id, detalle]) => {
          actualizado[id] = detalle;
        });
        return actualizado;
      });
    };

    cargarMetadatos();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!mostrarLista) return;

    const manejarClickFuera = (event: MouseEvent | TouchEvent) => {
      const nodo = listaWrapperRef.current;
      if (nodo && !nodo.contains(event.target as Node)) {
        setMostrarLista(false);
      }
    };

    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMostrarLista(false);
    };

    document.addEventListener("mousedown", manejarClickFuera);
    document.addEventListener("touchstart", manejarClickFuera);
    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
      document.removeEventListener("touchstart", manejarClickFuera);
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [mostrarLista]);

  useEffect(() => {
    if (!panelMovilExpandido && mostrarLista) {
      setMostrarLista(false);
    }
  }, [panelMovilExpandido, mostrarLista]);

  /* ======================================================================== */
  /* === 4. EFECTOS Y CALLBACKS DEL POLLING DE PROGRESO ==================== */
  /* ======================================================================== */

  const iniciarPollingProgreso = () => {
    if (idIntervaloProgresoRef.current != null) return;

    idIntervaloProgresoRef.current = window.setInterval(() => {
      const playerActual = playerActualRef.current;
      if (!playerActual) return;

      const tiempo = playerActual.getCurrentTime?.() || 0;
      const duracionActual = playerActual.getDuration?.() || duracion;

      setTiempoActual(tiempo);
      if (duracionActual && duracionActual !== duracion) setDuracion(duracionActual);
    }, 250) as unknown as number;
  };

  const detenerPollingProgreso = () => {
    if (idIntervaloProgresoRef.current == null) return;
    clearInterval(idIntervaloProgresoRef.current);
    idIntervaloProgresoRef.current = null;
  };

  /* ======================================================================== */
  /* === 5. HANDLERS DE VOLUMEN, MUTE Y CONTROLES MANUALES ================= */
  /* ======================================================================== */

  const onCambiarVolumen = (event: ChangeEvent<HTMLInputElement>) => {
    const valor = Number(event.target.value);
    const clamped = Math.min(1, Math.max(0, Number.isNaN(valor) ? 0 : valor));

    setVolumen(clamped);

    if (clamped > 0) {
      prevVolRef.current = clamped;
    }

    if (clamped > 0 && muted) setMuted(false);
    if (clamped === 0 && !muted) setMuted(true);
  };

  const alternarMute = () => {
    setMuted((mutedActual) => {
      if (mutedActual) {
        const restore = prevVolRef.current > 0 ? prevVolRef.current : 0.8;
        setVolumen(restore);
        return false;
      }

      prevVolRef.current = volumen;
      setVolumen(0);
      return true;
    });
  };

  const VolumeIcon = () => {
    if (muted || volumen === 0) return <Icon.VolMute />;
    if (volumen < 0.34) return <Icon.VolLow />;
    if (volumen < 0.67) return <Icon.VolMid />;
    return <Icon.VolHigh />;
  };

  /* ======================================================================== */
  /* === 6. VISUALIZADOR DE IMÁGENES ======================================= */
  /* ======================================================================== */

  const imagenesEfectivas = useMemo(() => {
    const limpias = IMAGENES_VISUALIZADOR.filter((url) => !!url);
    return limpias.length ? limpias : [""];
  }, []);

  useEffect(() => {
    imagenesEfectivas.forEach((url) => {
      if (!url) return;
      if (cacheImagenesRef.current.has(url)) return;

      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = url;

      cacheImagenesRef.current.set(url, img);
    });
  }, [imagenesEfectivas]);

  useEffect(() => {
    if (!mostrarVisualizador) {
      setAnimandoSlide(false);

      if (animacionTimeoutRef.current != null) {
        window.clearTimeout(animacionTimeoutRef.current);
        animacionTimeoutRef.current = null;
      }
      return;
    }

    if (!duracion || !imagenesEfectivas.length) return;

    const totalImagenes = imagenesEfectivas.length;
    const progresoCancion = duracion ? Math.min(1, Math.max(0, tiempoActual / duracion)) : 0;
    const indiceCalculado = Math.min(totalImagenes - 1, Math.floor(progresoCancion * totalImagenes));

    if (indiceCalculado !== indiceImagen) {
      indicePrevioRef.current = indiceImagen;
      setAnimandoSlide(true);
      setIndiceImagen(indiceCalculado);

      if (animacionTimeoutRef.current != null) {
        window.clearTimeout(animacionTimeoutRef.current);
      }

      animacionTimeoutRef.current = window.setTimeout(() => {
        setAnimandoSlide(false);
        animacionTimeoutRef.current = null;
      }, 420) as unknown as number;
    }
  }, [duracion, imagenesEfectivas.length, indiceImagen, mostrarVisualizador, tiempoActual]);

  useEffect(() => {
    setIndiceImagen(0);
    indicePrevioRef.current = 0;

    if (animacionTimeoutRef.current != null) {
      window.clearTimeout(animacionTimeoutRef.current);
      animacionTimeoutRef.current = null;
    }
  }, [indiceActual]);

  useEffect(() => () => {
    if (animacionTimeoutRef.current != null) {
      window.clearTimeout(animacionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!mostrarVisualizador) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMostrarVisualizador(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mostrarVisualizador]);

  const abrirVisualizador = () => setMostrarVisualizador(true);
  const cerrarVisualizador = () => setMostrarVisualizador(false);
  const alternarPanelMovil = () => setPanelMovilExpandido((prev) => !prev);

  /* ======================================================================== */
  /* === 7. FUNCIONES DE SINCRONIZACIÓN ENTRE SLOTS ======================== */
  /* ======================================================================== */

  const obtenerPlayerPorSlot = (slot: Slot) => {
    if (slot === "prev") return playerAnteriorRef.current;
    if (slot === "next") return playerSiguienteRef.current;
    return playerActualRef.current;
  };

  const normalizarIndice = useCallback((indice: number) => {
    const total = LISTA_REPRODUCCION.length;
    if (!total) return 0;
    return ((indice % total) + total) % total;
  }, []);

  const sincronizarSlot = useCallback((slot: Slot, reproducir = false) => {
    const player = obtenerPlayerPorSlot(slot);
    const videoId = videosObjetivoRef.current[slot];

    if (!player || !videoId) return;

    try {
      const videoActual = player.getVideoData?.()?.video_id;
      const necesitaCarga = videoActual !== videoId;

      if (slot === "current") {
        if (reproducir) {
          if (necesitaCarga) player.loadVideoById?.(videoId);
          player.playVideo?.();
        } else {
          if (necesitaCarga) player.cueVideoById?.(videoId);
          player.pauseVideo?.();
        }
      } else {
        if (necesitaCarga) player.cueVideoById?.(videoId);
        player.pauseVideo?.();
      }
    } catch (error) {
      console.warn("No se pudo sincronizar el iframe", slot, error);
    }
  }, []);

  const sincronizarTodos = useCallback(
    (indice: number, omitirAutoplay = false) => {
      const total = LISTA_REPRODUCCION.length;
      if (!total) return;

      const prevIdx = normalizarIndice(indice - 1);
      const nextIdx = normalizarIndice(indice + 1);

      videosObjetivoRef.current = {
        prev: LISTA_REPRODUCCION[prevIdx]?.id,
        current: LISTA_REPRODUCCION[normalizarIndice(indice)]?.id,
        next: LISTA_REPRODUCCION[nextIdx]?.id,
      };

      const debeReproducir = !omitirAutoplay && (autoplayPendienteRef.current || estaReproduciendoRef.current);

      sincronizarSlot("prev");
      sincronizarSlot("next");
      sincronizarSlot("current", debeReproducir);

      if (!debeReproducir) {
        setEstaReproduciendo(false);
      }

      autoplayPendienteRef.current = false;
      setTiempoActual(0);
      setDuracion(0);
    },
    [normalizarIndice, sincronizarSlot]
  );

  /* ======================================================================== */
  /* === 8. CICLO DE VIDA DE LOS IFRAMES DE YOUTUBE ======================== */
  /* ======================================================================== */

  useEffect(() => {
    let desmontado = false;

    const crearPlayer = (slot: Slot, contenedor: HTMLDivElement | null) => {
      if (!contenedor) return;

      contenedor.innerHTML = "";
      const host = document.createElement("div");
      contenedor.appendChild(host);

      const manejarEstado = (playerRef: MutableRefObject<any>) => (event: any) => {
        if (playerRef.current !== event.target) return;

        const ESTADO = window.YT.PlayerState;

        if (event.data === ESTADO.PLAYING) {
          setEstaReproduciendo(true);
        }
        if (event.data === ESTADO.PAUSED) {
          setEstaReproduciendo(false);
        }
        if (event.data === ESTADO.ENDED) {
          setEstaReproduciendo(false);
          pistaSiguienteRef.current(true);
        }
      };

      const player = new window.YT.Player(host, {
        width: 0,
        height: 0,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, fs: 0, enablejsapi: 1 },
        events: {
          onReady: (event: any) => {
            const vol0a100 = Math.round((mutedRef.current ? 0 : volumenRef.current) * 100);

            if (mutedRef.current || vol0a100 <= 0) {
              event.target.mute?.();
              event.target.setVolume?.(0);
            } else {
              event.target.unMute?.();
              event.target.setVolume?.(vol0a100);
            }

            if (slot === "current") {
              const dur = event.target.getDuration?.() || 0;
              const time = event.target.getCurrentTime?.() || 0;
              setDuracion(dur);
              setTiempoActual(time);
            }

            const reproducir = slot === "current" && (autoplayPendienteRef.current || estaReproduciendoRef.current);
            sincronizarSlot(slot, reproducir);
          },
          onStateChange: manejarEstado(slot === "prev" ? playerAnteriorRef : slot === "next" ? playerSiguienteRef : playerActualRef),
        },
      });

      if (slot === "prev") playerAnteriorRef.current = player;
      if (slot === "current") playerActualRef.current = player;
      if (slot === "next") playerSiguienteRef.current = player;
    };

    const prepararPlayers = async () => {
      try {
        await cargarAPIYouTube();
      } catch (error) {
        console.error("No se pudo cargar la API de YouTube", error);
        return;
      }

      if (desmontado) return;

      crearPlayer("prev", contenedorAnteriorRef.current);
      crearPlayer("current", contenedorActualRef.current);
      crearPlayer("next", contenedorSiguienteRef.current);

      const idx = indiceInicial;
      const prevIdx = normalizarIndice(idx - 1);
      const nextIdx = normalizarIndice(idx + 1);

      videosObjetivoRef.current = {
        prev: LISTA_REPRODUCCION[prevIdx]?.id,
        current: idInicialOverrideRef.current || LISTA_REPRODUCCION[idx]?.id,
        next: LISTA_REPRODUCCION[nextIdx]?.id,
      };

      sincronizarSlot("prev");
      sincronizarSlot("next");
      sincronizarSlot("current", false);

      indiceActualRef.current = idx;
      setIndiceActual(idx);

      iniciarPollingProgreso();
      actualizarMetadatos(idx, idInicialOverrideRef.current || undefined);

      idInicialOverrideRef.current = null;
    };

    prepararPlayers();

    return () => {
      desmontado = true;
      detenerPollingProgreso();

      [playerAnteriorRef.current, playerActualRef.current, playerSiguienteRef.current].forEach((player) => {
        try {
          player?.destroy?.();
        } catch (error) {
          console.warn("No se pudo destruir el player", error);
        }
      });

      playerAnteriorRef.current = null;
      playerActualRef.current = null;
      playerSiguienteRef.current = null;
    };
  }, [indiceInicial, normalizarIndice, sincronizarSlot]);

  useEffect(() => {
    indiceActualRef.current = indiceActual;
    sincronizarTodos(indiceActual);
  }, [indiceActual, sincronizarTodos]);

  useEffect(() => {
    estaReproduciendoRef.current = estaReproduciendo;
  }, [estaReproduciendo]);

  /* ======================================================================== */
  /* === 9. NAVEGACIÓN ENTRE PISTAS ======================================== */
  /* ======================================================================== */

  //  cambiarPista se encarga de cambiar la canción actual en una lista de reproducción
  //  ((a % n) + n) % n → siempre da un número entre 0 y n - 1
  function cambiarPista(nuevoIndice: number, autoplay = true) {
    const total = LISTA_REPRODUCCION.length;
    if (!total) return;

    const idx = ((nuevoIndice % total) + total) % total;
    autoplayPendienteRef.current = autoplay;
    setIndiceActual(idx);
    actualizarMetadatos(idx);
  }

  const pistaSiguiente = (autoplay = true) => cambiarPista(indiceActual + 1, autoplay);
  pistaSiguienteRef.current = pistaSiguiente;

  const alternarPlayPause = () => {
    const player = playerActualRef.current;
    if (!player) return;

    const ESTADO = window.YT.PlayerState;
    const estado = player.getPlayerState?.();

    if (estado === ESTADO.PLAYING) player.pauseVideo?.();
    else player.playVideo?.();
  };

  const onCambiarProgreso = (event: ChangeEvent<HTMLInputElement>) => {
    const valor = Number(event.target.value) || 0;
    const nuevo = Math.min(1, Math.max(0, valor));
    const segundos = (duracion || 0) * nuevo;

    playerActualRef.current?.seekTo?.(segundos, true);
    setTiempoActual(segundos);
  };

  async function actualizarMetadatos(idx = indiceActual, videoIdOverride?: string) {
    try {
      const entrada = LISTA_REPRODUCCION[idx];
      const videoId = videoIdOverride || entrada?.id;
      if (!videoId) return;

      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const respuesta = await fetch(oembedUrl);
      if (!respuesta.ok) throw new Error(`Respuesta ${respuesta.status}`);

      const data = await respuesta.json();
      setTituloPista(data.title || "Sin título");
      setAutorPista(data.author_name || "");
      setMiniaturaPista(data.thumbnail_url || "");
    } catch (error) {
      console.warn("No se pudieron cargar los metadatos", error);
      setTituloPista("Reproduciendo...");
      setAutorPista("");
      setMiniaturaPista("");
    }
  }

  useEffect(() => {
    actualizarMetadatos(indiceActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceActual]);

  /* ======================================================================== */
  /* === 10. DERIVADOS DE RENDER (PROGRESO Y ESTILOS) ====================== */
  /* ======================================================================== */

  const progreso = duracion ? Math.min(1, Math.max(0, tiempoActual / duracion)) : 0;

  const estiloBarraProgreso = useMemo(
    () => ({ "--mp-progreso": `${(progreso * 100).toFixed(2)}%` }) as CSSProperties,
    [progreso]
  );

  const estiloBarraVolumen = useMemo(
    () => ({ "--mp-progreso": `${(volumen * 100).toFixed(2)}%` }) as CSSProperties,
    [volumen]
  );

  const pistasDetalladas = useMemo(
    () =>
      LISTA_REPRODUCCION.map((entrada, index) => {
        const id = entrada?.id;
        const detalles = id ? detallesCanciones[id] : undefined;

        const titulo = detalles?.titulo || (entrada as { title?: string })?.title || `Canción ${index + 1}`;
        const autor = detalles?.autor || (entrada as { author?: string; artist?: string })?.author || (entrada as { artist?: string })?.artist || "";

        return {
          id: id ?? `track-${index}`,
          titulo,
          autor,
          index,
        };
      }),
    [detallesCanciones]
  );

  const iconoDespliegueMovil = panelMovilExpandido ? <Icon.ChevronDown /> : <Icon.ChevronUp />;
  const etiquetaDespliegueMovil = panelMovilExpandido ? "Contraer reproductor" : "Expandir reproductor";

  const alternarLista = () =>
    setMostrarLista((prev) => {
      const siguiente = !prev;
      if (siguiente) setPanelMovilExpandido(true);
      return siguiente;
    });

  const onSeleccionarCancion = (indice: number) => {
    cambiarPista(indice, true);
  };

  /* ======================================================================== */
  /* === 11. RENDER ======================================================== */
  /* ======================================================================== */

  return (
    <>
      {/* Iframes ocultos que manejan prev / current / next */}
      <div className="mp-iframes-ocultos" aria-hidden="true">
        <div ref={contenedorAnteriorRef} />
        <div ref={contenedorActualRef} />
        <div ref={contenedorSiguienteRef} />
      </div>

      {/* Overlay de visualizador IA */}
      {mostrarVisualizador && (
        <div className="Reproductor__VisualizadorOverlay" onClick={cerrarVisualizador} role="dialog" aria-modal="true">
          <div className="Reproductor__VisualizadorContenido" onClick={(e) => e.stopPropagation()}>
            <div className={`Reproductor__VisualizadorSlider ${animandoSlide ? "is-animating" : ""}`}>
              {animandoSlide && imagenesEfectivas.length > 1 && (
                <img
                  key={`prev-${indicePrevioRef.current}-${imagenesEfectivas[indicePrevioRef.current] || "ph"}`}
                  src={imagenesEfectivas[indicePrevioRef.current] || undefined}
                  alt=""
                  className="Reproductor__Slide Reproductor__Slide--out"
                  draggable={false}
                />
              )}
              <img
                key={`cur-${indiceImagen}-${imagenesEfectivas[indiceImagen] || "ph"}`}
                src={imagenesEfectivas[indiceImagen] || undefined}
                alt=""
                className="Reproductor__Slide Reproductor__Slide--in"
                draggable={false}
              />
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
                onClick={() => cambiarPista(indiceActual - 1, true)}
                aria-label="Anterior"
              >
                <Icon.Prev />
              </button>
              <button
                type="button"
                className="Reproductor__BotonControl"
                onClick={alternarPlayPause}
                aria-label={estaReproduciendo ? "Pausar" : "Reproducir"}
              >
                {estaReproduciendo ? <Icon.Pause /> : <Icon.Play />}
              </button>
              <button
                type="button"
                className="Reproductor__BotonControl"
                onClick={() => cambiarPista(indiceActual + 1, true)}
                aria-label="Siguiente"
              >
                <Icon.Next />
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
              onClick={abrirVisualizador}
              aria-label="Visualizador de imágenes"
              title="Visualizador de imágenes"
            >
              <Icon.Image />
            </button>
            <button
              type="button"
              className={`Reproductor__MobileActionButton Reproductor__MobileActionButton--toggle ${panelMovilExpandido ? "is-expanded" : ""}`}
              onClick={alternarPanelMovil}
              aria-label={etiquetaDespliegueMovil}
              title={etiquetaDespliegueMovil}
            >
              {iconoDespliegueMovil}
            </button>
          </div>
        </div>

        <div className="Reproductor__LayoutDetallado">
          {/* Zona izquierda: portada y datos de la pista */}
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

          {/* Zona central: controles principales y barra de progreso */}
          <nav className="Reproductor__ZonaCentral">
            <div className="Reproductor__ContenedorControles">
              <button className="Reproductor__BotonControl" onClick={() => cambiarPista(indiceActual - 1, true)} aria-label="Anterior">
                <Icon.Prev />
              </button>
              <button className="Reproductor__BotonControl" onClick={alternarPlayPause} aria-label={estaReproduciendo ? "Pausar" : "Reproducir"}>
                {estaReproduciendo ? <Icon.Pause /> : <Icon.Play />}
              </button>
              <button className="Reproductor__BotonControl" onClick={() => cambiarPista(indiceActual + 1, true)} aria-label="Siguiente">
                <Icon.Next />
              </button>
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
                aria-label="Barra de progreso"
                style={estiloBarraProgreso}
              />
              <div className="Reproductor__Tiempo Reproductor__TiempoTotal">{formatearTiempo(duracion)}</div>
            </div>
          </nav>

          {/* Zona derecha: volumen y accesos directos */}
          <nav className="Reproductor__ZonaDerecha">
            <button
              type="button"
              className="Reproductor__VolumenBtn"
              onClick={alternarMute}
              aria-label={muted || volumen === 0 ? "Activar sonido" : "Silenciar"}
              title={muted || volumen === 0 ? "Activar sonido" : "Silenciar"}
            >
              <VolumeIcon />
            </button>

            <input
              className="Reproductor__VolumenRange"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volumen}
              onChange={onCambiarVolumen}
              aria-label="Control de volumen"
              style={estiloBarraVolumen}
            />

            <div
              className={`Reproductor__ControlListaWrapper ${mostrarLista ? "is-open" : ""}`}
              ref={listaWrapperRef}
            >
              <button
                type="button"
                className="Reproductor__ControlLista"
                onClick={alternarLista}
                aria-haspopup="true"
                aria-expanded={mostrarLista}
                aria-controls="Reproductor__ListaDropdown"
                title="Lista de reproducción"
              >
                <Icon.List />
              </button>

              {mostrarLista && (
                <div
                  className="Reproductor__ListaDropdown"
                  id="Reproductor__ListaDropdown"
                  role="menu"
                  aria-label="Lista de reproducción"
                >
                  {LISTA_REPRODUCCION.length === 0 ? (
                    <p className="Reproductor__ListaVacia">No hay canciones en la lista.</p>
                  ) : (
                    <ul className="Reproductor__ListaElementos">
                      {pistasDetalladas.map(({ id, titulo, autor, index }) => {
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
                                  <Icon.Playing />
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
              onClick={abrirVisualizador}
              title="Visualizador IA"
              aria-label="Visualizador IA"
            >
              <Icon.Image />
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

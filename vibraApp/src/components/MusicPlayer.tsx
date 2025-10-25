import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import "./MusicPlayer.css";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoadingPromise?: Promise<void>;
  }
}

/** ====== Iconos SVG (heredan currentColor) ====== */
const iconProps = { width: 20, height: 20, viewBox: "0 0 24 24", role: "img", "aria-hidden": true } as const;

const Icon = {
  Prev: () => (
    <svg {...iconProps}><path fill="currentColor" d="M6 5a1 1 0 0 1 1 1v4.382l7.553-4.534C16.532 5.19 18 5.969 18 7.133v9.734c0 1.164-1.469 1.943-3.447 1.285L7 13.618V18a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z"/></svg>
  ),
  Next: () => (
    <svg {...iconProps}><path fill="currentColor" d="M18 6v12a1 1 0 1 1-2 0v-4.382l-7.553 4.534C6.468 18.81 5 18.031 5 16.867V7.133c0-1.164 1.469-1.943 3.447-1.285L16 10.382V6a1 1 0 1 1 2 0Z"/></svg>
  ),
  Play: () => (
    <svg {...iconProps}><path fill="currentColor" d="M8 6.82v10.36c0 .73.79 1.19 1.42.82l8.36-5.18a.96.96 0 0 0 0-1.64L9.42 6c-.63-.39-1.42.09-1.42.82Z"/></svg>
  ),
  Pause: () => (
    <svg {...iconProps}><path fill="currentColor" d="M7 6h3v12H7zM14 6h3v12h-3z"/></svg>
  ),
  List: () => (
    <svg {...iconProps}><path fill="currentColor" d="M5 7h14v2H5zM5 11h14v2H5zM5 15h14v2H5z"/></svg>
  ),
  Image: () => (
    <svg {...iconProps}><path fill="currentColor" d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2 0h12v10H6zm2 8 3-4 3 3 2-2 2 3zM8.75 8.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"/></svg>
  ),
  VolMute: () => (
    <svg {...iconProps}><path fill="currentColor" d="M4 10h3l4-3v10l-4-3H4zM20 8.41 18.59 7 16 9.59 13.41 7 12 8.41 14.59 11 12 13.59 13.41 15 16 12.41 18.59 15 20 13.59 17.41 11 20 8.41Z"/></svg>
  ),
  VolLow: () => (
    <svg {...iconProps}><path fill="currentColor" d="M4 10h3l4-3v10l-4-3H4zM16 9a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Z"/></svg>
  ),
  VolMid: () => (
    <svg {...iconProps}><path fill="currentColor" d="M4 10h3l4-3v10l-4-3H4z"/><path fill="currentColor" d="M17 8a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm2.5-3.5a1 1 0 0 1 1.415 1.414A7 7 0 0 0 22 12a7 7 0 0 0-1.085 3.586 1 1 0 1 1-1.998-.172C18.805 13.88 19.5 13.023 19.5 12s-.695-1.88-1.083-3.414A1 1 0 0 1 19.5 4.5Z"/></svg>
  ),
  VolHigh: () => (
    <svg {...iconProps}><path fill="currentColor" d="M4 10h3l4-3v10l-4-3H4z"/><path fill="currentColor" d="M17 7a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm2.5-3.5a1 1 0 0 1 1.415 1.414A9 9 0 0 1 22 12a9 9 0 0 1-1.085 4.086 1 1 0 1 1-1.83-.912C19.89 13.88 20.5 13.023 20.5 12s-.61-1.88-1.415-3.174A1 1 0 0 1 19.5 4.5Z"/></svg>
  ),
};

/** Lista de videos (YouTube IDs) */
const LISTA_REPRODUCCION = [
  { id: "iKI5q_hF0o0" },
  { id: "Ulnobym-Ouo" },
  { id: "N0Ovqd-epOI" },
  { id: "eUlGF_8r5Ac" },
  { id: "hXYCrTX-l24" },
];

/** Arreglo hardcodeado de imágenes para el visualizador (rellená con tus URLs) */
const IMAGENES_VISUALIZADOR: string[] = [
    "https://indiehoy.com/wp-content/uploads/2025/08/eterna-inocencia.webp",
    "https://es.rollingstone.com/wp-content/uploads/2022/11/eterna-inocencia.jpg",
    "https://www.nacionrock.com/wp-content/uploads/IMG_2236.webp",
    "https://www.ultrabrit.com/wp-content/uploads/2017/08/eterna-inocencia-guillermo-marmol-1.jpg",
    "https://static.esnota.com/uploads/2021/12/Guille.jpg",
    "https://planetacabezon.com/06-2023/resize_1686602016.jpg",
    "https://www.notaalpie.com.ar/wp-content/uploads/2023/08/6-Credito-Yoel-Alderisi-1.jpg",
    "https://www.futuro.cl/wp-content/uploads/2023/11/eterna-inocencia-768x433.webp",
    "https://acordesweb.com/img/eterna-inocencia-f7cc82cdfecfa0e11aa8168dee01fa8a.jpg",
    "https://cdn.rock.com.ar/wp-content/uploads/2024/01/eterna-inocencia-2.jpeg"
  ];

/** Precarga básica/templada de iframes */
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

function formatearTiempo(segundosTotales: number) {
  const seg = Math.max(0, Math.floor(segundosTotales || 0));
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function MusicPlayer() {
  const reproductorRef = useRef<any>(null);
  const hostReproductorRef = useRef<HTMLDivElement | null>(null);

  const [indiceActual, setIndiceActual] = useState(0);
  const [estaReproduciendo, setEstaReproduciendo] = useState(false);
  const [duracion, setDuracion] = useState(0);
  const [tiempoActual, setTiempoActual] = useState(0);

  const [tituloPista, setTituloPista] = useState("Cargando...");
  const [autorPista, setAutorPista] = useState("");
  const [miniaturaPista, setMiniaturaPista] = useState<string>("");

  const idIntervaloProgresoRef = useRef<number | null>(null);

  /* ===== Volumen + mute dinámico ===== */
  const [volumen, setVolumen] = useState(0.8); // 0..1
  const [muted, setMuted] = useState(false); // estado visual/control
  const prevVolRef = useRef(0.8); // para restaurar post-mute

  // Aplica volumen/mute al player cuando cambien
  useEffect(() => {
    const p = reproductorRef.current;
    if (!p || typeof p.setVolume !== "function") return;
    const vol0a100 = Math.round(volumen * 100);

    if (muted || vol0a100 <= 0) {
      p.mute?.();
      p.setVolume?.(0);
    } else {
      p.unMute?.();
      p.setVolume?.(vol0a100);
    }
  }, [volumen, muted]);

  const onCambiarVolumen = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    const clamped = Math.min(1, Math.max(0, isNaN(v) ? 0 : v));
    setVolumen(clamped);
    if (clamped > 0) {
      prevVolRef.current = clamped;
    }
    // si el usuario sube el volumen por encima de 0, desmuteamos visualmente
    if (clamped > 0 && muted) setMuted(false);
    if (clamped === 0 && !muted) setMuted(true);
  };

  const alternarMute = () => {
    setMuted((m) => {
      if (m) {
        // unmute: restaurar volumen previo (>0) o un default
        const restore = prevVolRef.current > 0 ? prevVolRef.current : 0.8;
        setVolumen(restore);
        return false;
      } else {
        // mute: recordar volumen y bajar a 0
        prevVolRef.current = volumen;
        setVolumen(0);
        return true;
      }
    });
  };

  // Elige el icono según volumen/mute
  const VolumeIcon = () => {
    if (muted || volumen === 0) return <Icon.VolMute />;
    if (volumen < 0.34) return <Icon.VolLow />;
    if (volumen < 0.67) return <Icon.VolMid />;
    return <Icon.VolHigh />;
  };

  /* ============== VISUALIZADOR ============== */
  const [mostrarVisualizador, setMostrarVisualizador] = useState(false);
  const cacheImagenesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const imagenesEfectivas = useMemo(() => {
    const limpias = IMAGENES_VISUALIZADOR.filter((u) => !!u);
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

  const [indiceImagen, setIndiceImagen] = useState(0);
  const indicePrevioRef = useRef(0);
  const [animandoSlide, setAnimandoSlide] = useState(false);
  const animacionTimeoutRef = useRef<number | null>(null);

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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMostrarVisualizador(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mostrarVisualizador]);

  const abrirVisualizador = () => setMostrarVisualizador(true);
  const cerrarVisualizador = () => setMostrarVisualizador(false);

  /* =========================================== */

  useEffect(() => {
    let desmontado = false;
    (async () => {
      try {
        await cargarAPIYouTube();
      } catch (error) {
        console.error("No se pudo cargar la API de YouTube", error);
        return;
      }
      if (desmontado) return;

      reproductorRef.current = new window.YT.Player(hostReproductorRef.current!, {
        width: 0,
        height: 0,
        videoId: LISTA_REPRODUCCION[indiceActual].id,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, fs: 0, enablejsapi: 1 },
        events: {
          onReady: (e: any) => {
            const d = e.target.getDuration?.() || 0;
            setDuracion(d);
            const t = e.target.getCurrentTime?.() || 0;
            setTiempoActual(t);
            // aplicar estado de volumen/mute inicial
            const vol0a100 = Math.round((muted ? 0 : volumen) * 100);
            if (muted || vol0a100 <= 0) { e.target.mute?.(); e.target.setVolume?.(0); }
            else { e.target.unMute?.(); e.target.setVolume?.(vol0a100); }
          },
          onStateChange: (e: any) => {
            const ESTADO = window.YT.PlayerState;
            if (e.data === ESTADO.PLAYING) setEstaReproduciendo(true);
            if (e.data === ESTADO.PAUSED || e.data === ESTADO.ENDED) setEstaReproduciendo(false);
            if (e.data === ESTADO.ENDED) pistaSiguiente(true);
          },
        },
      });

      iniciarPollingProgreso();
      actualizarMetadatos();
    })();

    return () => {
      desmontado = true;
      detenerPollingProgreso();
      try { reproductorRef.current?.destroy?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iniciarPollingProgreso = () => {
    if (idIntervaloProgresoRef.current != null) return;
    idIntervaloProgresoRef.current = window.setInterval(() => {
      const p = reproductorRef.current;
      if (!p) return;
      const t = p.getCurrentTime?.() || 0;
      const d = p.getDuration?.() || duracion;
      setTiempoActual(t);
      if (d && d !== duracion) setDuracion(d);
    }, 250) as unknown as number;
  };
  const detenerPollingProgreso = () => {
    if (idIntervaloProgresoRef.current != null) {
      clearInterval(idIntervaloProgresoRef.current);
      idIntervaloProgresoRef.current = null;
    }
  };

  function cambiarPista(nuevoIndice: number, autoplay = true) {
    const total = LISTA_REPRODUCCION.length;
    const idx = (nuevoIndice + total) % total;
    setIndiceActual(idx);
    setTiempoActual(0);
    setDuracion(0);

    const video = LISTA_REPRODUCCION[idx].id;
    const player = reproductorRef.current;
    if (player) {
      if (autoplay) {
        player.loadVideoById?.(video);
      } else {
        player.cueVideoById?.(video);
        player.pauseVideo?.();
      }
    }
    actualizarMetadatos(idx);
  }

  const pistaSiguiente = (autoplay = true) => cambiarPista(indiceActual + 1, autoplay);

  const alternarPlayPause = () => {
    const p = reproductorRef.current;
    if (!p) return;
    const ESTADO = window.YT.PlayerState;
    const estado = p.getPlayerState?.();
    if (estado === ESTADO.PLAYING) p.pauseVideo?.();
    else p.playVideo?.();
  };

  const onCambiarProgreso = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) || 0;
    const nuevo = Math.min(1, Math.max(0, v));
    const segundos = (duracion || 0) * nuevo;
    reproductorRef.current?.seekTo?.(segundos, true);
    setTiempoActual(segundos);
  };

  async function actualizarMetadatos(idx = indiceActual) {
    try {
      const videoId = LISTA_REPRODUCCION[idx].id;
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const resp = await fetch(oembedUrl);
      if (!resp.ok) throw new Error(`Respuesta ${resp.status}`);
      const data = await resp.json();
      setTituloPista(data.title || "Sin título");
      setAutorPista(data.author_name || "");
      setMiniaturaPista(data.thumbnail_url || "");
    } catch {
      setTituloPista("Reproduciendo...");
      setAutorPista("");
      setMiniaturaPista("");
    }
  }

  useEffect(() => {
    actualizarMetadatos(indiceActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceActual]);

  const progreso = duracion ? Math.min(1, Math.max(0, tiempoActual / duracion)) : 0;
  const estiloBarraProgreso = useMemo(
    () => ({ "--mp-progreso": `${(progreso * 100).toFixed(2)}%` }) as CSSProperties,
    [progreso]
  );
  const estiloBarraVolumen = useMemo(
    () => ({ "--mp-progreso": `${(volumen * 100).toFixed(2)}%` }) as CSSProperties,
    [volumen]
  );

  return (
    <>
      <div ref={hostReproductorRef} style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0 }} aria-hidden="true" />

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

        <nav className="Reproductor__ZonaDerecha">
          {/* Botón de mute/unmute con icono dinámico */}
          <button
            type="button"
            className="Reproductor__VolumenBtn"
            onClick={alternarMute}
            aria-label={muted || volumen === 0 ? "Activar sonido" : "Silenciar"}
            title={muted || volumen === 0 ? "Activar sonido" : "Silenciar"}
          >
            <VolumeIcon />
          </button>

          {/* Slider de volumen */}
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

          <div className="Reproductor__ControlLista" title="Lista" aria-hidden="true"><Icon.List /></div>
          <div className="Reproductor__ControlImagenesIA" onClick={abrirVisualizador} title="Visualizador IA" aria-hidden="true">
            <Icon.Image />
          </div>
        </nav>
      </div>
    </>
  );
}

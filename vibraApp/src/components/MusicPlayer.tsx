import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useMusicContext } from "../context/MusicContext";
import "./MusicPlayer.css";
import { Icons } from "./Icons";

type Backend = "cloudinary" | "youtube" | null;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytApiLoadingPromise?: Promise<void>;
  }
}

function loadYouTubeAPI(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!window._ytApiLoadingPromise) {
    window._ytApiLoadingPromise = new Promise<void>((resolve) => {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
      window.onYouTubeIframeAPIReady = () => resolve();
    });
  }
  return window._ytApiLoadingPromise!;
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
  const {
    playlist,
    currentSong,
    indiceActual,
    setIndiceActual,
    urlsImagenes,
    reproduciendo,
    setReproduciendo,
  } = useMusicContext();

  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytReadyRef = useRef<boolean>(false);
  const ytReadyResolvers = useRef<((value: void | PromiseLike<void>) => void)[]>([]);
  const waitForYTReady = useCallback(() => new Promise<void>((res) => {
    if (ytReadyRef.current) return res();
    ytReadyResolvers.current.push(res);
  }), []);
  const backendRef = useRef<Backend>(null);
  const listaRef = useRef<HTMLDivElement | null>(null);
  const activeSongRef = useRef<HTMLButtonElement | null>(null);
  const [overrideBackend, setOverrideBackend] = useState<Backend>(null);
  const [progress, setProgress] = useState({ t: 0, d: 0, pct: 0 });
  const [volume, setVolume] = useState(1);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(1);
  const [mostrarVisualizador, setMostrarVisualizador] = useState(false);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [mostrarLista, setMostrarLista] = useState(false);

  const titulo = currentSong?.title;
  const artista = currentSong?.artist;
  const miniYT = currentSong?.youtubeId
    ? `https://img.youtube.com/vi/${currentSong.youtubeId}/hqdefault.jpg`
    : undefined;

  const volumeIcon = useMemo(() => {
    const pct = Math.round((volume ?? 0) * 100);
    if (pct <= 0) return <Icons.Mute />;
    if (pct <= 50) return <Icons.VolLow />;
    return <Icons.Volume />;
  }, [volume]);

    // NUEVO: función utilitaria
  const fallbackToYouTube = useCallback(() => {
    // evitamos loops si no hay youtubeId
    if (!currentSong?.youtubeId) {
      console.warn("[MusicPlayer] Cloudinary falló y no hay youtubeId para fallback");
      setReproduciendo(false);
      return;
    }
    console.warn("[MusicPlayer] Fallback a YouTube por error de Cloudinary");
    // pausamos cualquier audio que haya quedado intentando cargar
    try { audioRef.current?.pause(); } catch {}
    // forzamos override al backend
    setOverrideBackend("youtube");
    // mantenemos la intención de reproducción actual
    // (el effect de `reproduciendo` hará play/pause en YT)
  }, [currentSong, setReproduciendo]);

  const backend: Backend = useMemo(() => {
    if (!currentSong) return null;
    if (overrideBackend) return overrideBackend;
    return currentSong.cloudinaryUrl ? "cloudinary" : (currentSong.youtubeId ? "youtube" : null);
  }, [currentSong, overrideBackend]);

  // Inicializar/montar backend cuando cambia la canción o el backend
  useEffect(() => {
    let cancel = false;

    async function setup() {
      if (!currentSong) return;

      backendRef.current = backend;

      // Asegurar exclusividad: nunca dos fuentes sonando a la vez
      try {
        if (audioRef.current) audioRef.current.pause();
      } catch {}
      try {
        if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
        if (ytPlayerRef.current?.stopVideo) ytPlayerRef.current.stopVideo();
      } catch {}


      // CLOUDINARY => <audio>
      if (backend === "cloudinary") {
        console.log("[MusicPlayer] Reproduciendo vía Cloudinary:", currentSong?.title, currentSong?.id);
        const a = (audioRef.current ?? new Audio());
        audioRef.current = a;

        // Limpieza de handlers previos (evita duplicados)
        a.onerror = null;
        a.onended = null;

        a.preload = "auto";
        a.crossOrigin = "anonymous";
        if (currentSong.cloudinaryUrl) a.src = currentSong.cloudinaryUrl;

        // NUEVO: si falla la carga/reproducción (404, CORS, etc.), hacemos fallback
        a.onerror = () => {
          // Algunas veces el error llega asincrónico, hacemos un pequeño guard
          // y nos aseguramos de caer a YouTube solo una vez.
          if (overrideBackend !== "youtube") {
            fallbackToYouTube();
          }
        };

        // Reiniciar solo al cargar NUEVA canción (no en toggle play/pause)
        a.currentTime = 0;
        a.volume = volume;
        a.onended = () => onEnded();

        if (reproduciendo) {
          a.play().catch((err) => {
            console.warn("[MusicPlayer] Error en play() de Cloudinary, forzando fallback:", err);
            if (overrideBackend !== "youtube") {
              fallbackToYouTube();
            }
          });
        } else {
          a.pause();
        }
        return;
      }

      // YOUTUBE => Iframe API
      if (backend === "youtube" && ytContainerRef.current) {
        console.log("[MusicPlayer] Reproduciendo vía YouTube:", currentSong?.title, currentSong?.youtubeId);
        await loadYouTubeAPI();
        if (!ytPlayerRef.current) {
          ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
            height: "0",
            width: "0",
            playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1 },
            events: {
              onReady: () => {
                ytReadyRef.current = true;
                console.log("[MusicPlayer] YT onReady");
                while (ytReadyResolvers.current.length) ytReadyResolvers.current.shift()?.();
              },
              onStateChange: (e: any) => {
                if (e?.data === 0) onEnded();
              },
            },
          });
        }
        const p = ytPlayerRef.current;
        const id = currentSong.youtubeId;
        if (!ytReadyRef.current) await waitForYTReady();
        if (id) {
          try {
            if (reproduciendo) p.loadVideoById(id); else p.cueVideoById(id);
            p.setVolume?.(Math.round(volume * 100));
            console.log("[MusicPlayer] YT set id:", id, "reproduciendo:", reproduciendo);
          } catch (err) {
            console.warn("[MusicPlayer] YT no listo aún, reintento suave", err);
            setTimeout(() => {
              try {
                if (reproduciendo) p.loadVideoById(id); else p.cueVideoById(id);
                p.setVolume?.(Math.round(volume * 100));
              } catch (e) {
                console.error("[MusicPlayer] Falló segunda invocación YT API", e);
              }
            }, 50);
          }
        }
      }
    }

    setup();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, currentSong]);

  // Reaccionar si cambia "reproduciendo"
  useEffect(() => {
    const b = backendRef.current;
    if (b === "cloudinary") {
      const a = audioRef.current; if (!a) return;
      if (reproduciendo) a.play().catch(() => {}); else a.pause();
    } else if (b === "youtube") {
      const p = ytPlayerRef.current; if (!p) return;
      if (reproduciendo) p.playVideo?.(); else p.pauseVideo?.();
    }
  }, [reproduciendo]);

  useEffect(() => {
    setOverrideBackend(null);
  }, [currentSong]);

  // Polling de progreso (250ms)
  useEffect(() => {
    const id = window.setInterval(() => {
      const b = backendRef.current;
      let t = 0, d = 0;
      if (b === "cloudinary" && audioRef.current) {
        t = audioRef.current.currentTime || 0;
        d = audioRef.current.duration || 0;
      } else if (b === "youtube" && ytPlayerRef.current) {
        t = ytPlayerRef.current.getCurrentTime?.() || 0;
        const maybeD = ytPlayerRef.current.getDuration?.();
        d = Number.isFinite(maybeD) ? maybeD : 0;
      }
      const pct = d > 0 ? Math.min(100, (t / d) * 100) : 0;
      setProgress({ t, d, pct });
    }, 50) as unknown as number;
    return () => window.clearInterval(id);
  }, []);

  // Visualizador (5s)
  useEffect(() => {
    if (!mostrarVisualizador) return;
    const id = window.setInterval(() => {
      setIndiceImagen((p) => (
        urlsImagenes.length ? (p + 1) % urlsImagenes.length : 0
      ));
    }, 5000) as unknown as number;
    return () => window.clearInterval(id);
  }, [mostrarVisualizador, urlsImagenes.length]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!mostrarLista) return;
    const onDocClick = (e: MouseEvent) => {
      const node = listaRef.current;
      if (!node) return;
      if (e.target instanceof Node && !node.contains(e.target)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [mostrarLista]);

  // Scroll automático a la canción activa cuando se abre el dropdown
  useEffect(() => {
    if (mostrarLista && activeSongRef.current) {
      activeSongRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [mostrarLista]);

  const onEnded = useCallback(() => {
    if (!playlist?.length) { setReproduciendo(false); return; }
    // Si es la última canción, volver a la primera (loop)
    const next = indiceActual + 1 >= playlist.length ? 0 : indiceActual + 1;
    setIndiceActual(next);
    setReproduciendo(true);
  }, [indiceActual, playlist, setIndiceActual, setReproduciendo]);

  const onPrev = () => {
    // Si estoy en la primera canción, ir a la última (circular)
    const prev = indiceActual - 1 < 0 ? playlist.length - 1 : indiceActual - 1;
    setIndiceActual(prev);
    setReproduciendo(true);
  };
  const onNext = () => {
    // Si estoy en la última canción, ir a la primera (circular)
    const next = indiceActual + 1 >= playlist.length ? 0 : indiceActual + 1;
    setIndiceActual(next);
    setReproduciendo(true);
  };

  const onTogglePlay = () => setReproduciendo(!reproduciendo);

  const onChangeProgress = (e: ChangeEvent<HTMLInputElement>) => {
    const pct = Number(e.target.value) || 0;
    const d = progress.d || 0;
    const target = (pct / 100) * d;
    const b = backendRef.current;
    if (b === "cloudinary" && audioRef.current) {
      audioRef.current.currentTime = target;
    } else if (b === "youtube" && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo?.(target, true);
    }
  };

  const onChangeVolume = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.min(1, Number(e.target.value) || 0));
    setVolume(v);
    const b = backendRef.current;
    if (b === "cloudinary" && audioRef.current) {
      audioRef.current.volume = v;
    } else if (b === "youtube" && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume?.(Math.round(v * 100));
    }
  };

  const onToggleMute = () => {
    const b = backendRef.current;
    if (volume > 0) {
      // Silenciar: guardar volumen actual y setear a 0
      setVolumeBeforeMute(volume);
      setVolume(0);
      if (b === "cloudinary" && audioRef.current) {
        audioRef.current.volume = 0;
      } else if (b === "youtube" && ytPlayerRef.current) {
        ytPlayerRef.current.setVolume?.(0);
      }
    } else {
      // Reactivar: restaurar volumen anterior
      const restoreVolume = volumeBeforeMute > 0 ? volumeBeforeMute : 1;
      setVolume(restoreVolume);
      if (b === "cloudinary" && audioRef.current) {
        audioRef.current.volume = restoreVolume;
      } else if (b === "youtube" && ytPlayerRef.current) {
        ytPlayerRef.current.setVolume?.(Math.round(restoreVolume * 100));
      }
    }
  };

  // Lista visible (títulos desde el contexto directamente)
  const itemsLista = useMemo(() => {
    const items = playlist?.map((s, index) => ({
      id: s.id || s.youtubeId || `track-${index}`,
      titulo: s.title || `Canción ${index + 1}`,
      autor: s.artist,
      index,
    })) ?? [];
    console.log('🎵 [MusicPlayer] itemsLista actualizado. Total canciones:', items.length);
    return items;
  }, [playlist]);

  const tiempoActual = formatTime(progress.t);
  const tiempoTotal = progress.d > 0 ? formatTime(progress.d) : "--:--";

  const noHayCancion = !currentSong;

  return (
    <>
      {/* Montaje oculto del backend */}
      <div className="mp-iframes-ocultos" aria-hidden="true">
        {/* YouTube container (alto/ancho 0 por CSS) */}
        <div ref={ytContainerRef} />
        {/* Audio HTML (oculto) */}
        <audio ref={audioRef} style={{ display: "none" }} preload="auto" />
      </div>

      {/* Overlay de visualizador */}
      {mostrarVisualizador && (
        <div className="Reproductor__VisualizadorOverlay" onClick={() => setMostrarVisualizador(false)} role="dialog" aria-modal="true">
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

      {/* Layout principal (conserva clases existentes) */}
      <div className="Reproductor__ContenedorPrincipal">
        <div className="Reproductor__LayoutDetallado">
          {/* IZQ: portada + info */}
          <nav className="Reproductor__ZonaIzquierda">
            <div className="Reproductor__ContenedorMiniatura" onClick={() => !noHayCancion && setMostrarVisualizador(true)} title={noHayCancion ? "" : "Abrir visualizador de imágenes"} style={{ cursor: noHayCancion ? 'default' : 'pointer' }}>
              {miniYT && (
                <img src={miniYT} alt={titulo ? `Portada: ${titulo}` : "Portada"} className="Reproductor__ImagenMiniatura" draggable={false} />
              )}
            </div>
            <div className="Reproductor__ContenedorInfoPista">
              <div className="Reproductor__TituloPista">{noHayCancion ? "Sin canción" : titulo}</div>
              <div className="Reproductor__AutorPista">{noHayCancion ? "Selecciona una canción para reproducir" : artista}</div>
            </div>
          </nav>

          {/* CENTRO: controles + progreso */}
          <nav className="Reproductor__ZonaCentral">
            <div className="Reproductor__ContenedorControles">
              <button className="Reproductor__BotonControl" onClick={onPrev} aria-label="Anterior" disabled={noHayCancion}>
                <span aria-hidden="true"><Icons.Prev /></span>
              </button>
              <button className="Reproductor__BotonControl" onClick={onTogglePlay} aria-label={reproduciendo ? "Pausar" : "Reproducir"} disabled={noHayCancion}>
                <span aria-hidden="true">{reproduciendo ? <Icons.Pause /> : <Icons.Play />}</span>
              </button>
              <button className="Reproductor__BotonControl" onClick={onNext} aria-label="Siguiente" disabled={noHayCancion}>
                <span aria-hidden="true"><Icons.Next /></span>
              </button>
            </div>
            <div className="Reproductor__ContenedorProgreso">
              <div className="Reproductor__Tiempo Reproductor__TiempoActual">{tiempoActual}</div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress.pct}
                onChange={onChangeProgress}
                className="Reproductor__BarraProgreso"
                aria-label="Barra de progreso"
                disabled={noHayCancion}
              />
              <div className="Reproductor__Tiempo Reproductor__TiempoTotal">{tiempoTotal}</div>
            </div>
          </nav>

          {/* DER: volumen + lista + visualizador */}
          <nav className="Reproductor__ZonaDerecha">
            <button
              type="button"
              className="Reproductor__VolumenBtn"
              onClick={onToggleMute}
              aria-label={volume > 0 ? "Silenciar" : "Activar sonido"}
              title={volume > 0 ? "Silenciar" : "Activar sonido"}
            >
              <span aria-hidden="true">{volumeIcon}</span>
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

            {/* Lista simple */}
            <div className="Reproductor__ListaControlGroup" ref={listaRef}>
              <button
                type="button"
                className="Reproductor__ControlLista"
                onClick={() => setMostrarLista((v) => !v)}
                aria-haspopup="true"
                aria-expanded={mostrarLista}
                aria-controls="Reproductor__ListaDropdown"
                title="Lista de reproducción"
              >
                <span aria-hidden="true"><Icons.List /></span>
              </button>

              <div className={`Reproductor__ControlListaWrapper ${mostrarLista ? "is-open" : ""}`}>
                {mostrarLista && (
                  <div className="Reproductor__ListaDropdown" id="Reproductor__ListaDropdown" role="menu" aria-label="Lista de reproducción">
                    {itemsLista.length === 0 ? (
                      <p className="Reproductor__ListaVacia">No hay canciones.</p>
                    ) : (
                      <ul className="Reproductor__ListaElementos">
                        {itemsLista.map(({ id, titulo, autor, index }) => {
                          const activo = index === indiceActual;
                          return (
                            <li key={id} role="none">
                              <button
                                ref={activo ? activeSongRef : null}
                                type="button"
                                className={`Reproductor__ListaCancion ${activo ? "is-active" : ""}`}
                                onClick={() => { setIndiceActual(index); setReproduciendo(true); setMostrarLista(false); }}
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
              className="Reproductor__ControlImagenesIA"
              onClick={() => setMostrarVisualizador(true)}
              title="Visualizador IA"
              aria-label="Visualizador IA"
              disabled={noHayCancion}
            >
              <span aria-hidden="true"><Icons.Image /></span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

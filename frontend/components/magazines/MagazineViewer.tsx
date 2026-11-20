"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Search as SearchIcon,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { NavMagazine } from "@/lib/use-public-magazines";
import styles from "./magazines.module.css";

interface PdfRenderTask {
  promise: Promise<void>;
  cancel: () => Promise<void>;
}

interface PdfPage {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  getTextContent: () => Promise<{ items: { str: string }[] }>;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: unknown;
    transform?: number[];
  }) => PdfRenderTask;
}

interface PdfDocument {
  numPages: number;
  getPage: (page: number) => Promise<PdfPage>;
  destroy: () => Promise<void>;
}

const documentCache = new Map<string, Promise<PdfDocument>>();
const cacheOrder: string[] = [];
const MAX_CACHED = 3;

/**
 * PDF.js lanza `RenderingCancelledException` cuando cancelamos una tarea de
 * render en curso (cambio de zoom, de página o desmontaje). No es un fallo:
 * la tarea que gana es la nueva.
 */
function isRenderCancellation(failure: unknown): boolean {
  if (!failure || typeof failure !== "object") return false;
  return (failure as { name?: string }).name === "RenderingCancelledException";
}

async function loadDocument(url: string, onProgress?: (value: number) => void) {
  const cached = documentCache.get(url);
  if (cached) return cached;
  const promise = (async () => {
    const PDFJS_URL: string = "/pdf/pdf.min.mjs";
    const pdfjs = (await import(
      /* webpackIgnore: true */ /* @vite-ignore */ PDFJS_URL
    )) as unknown as {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (params: {
        url: string;
        isEvalSupported?: boolean;
      }) => {
        promise: Promise<unknown>;
        onProgress?: (progress: { loaded: number; total: number }) => void;
      };
    };
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
    const task = pdfjs.getDocument({ url, isEvalSupported: false });
    task.onProgress = (progress: { loaded: number; total: number }) => {
      if (progress.total > 0) onProgress?.(progress.loaded / progress.total);
    };
    return (await task.promise) as unknown as PdfDocument;
  })();
  documentCache.set(url, promise);
  cacheOrder.push(url);
  while (cacheOrder.length > MAX_CACHED) {
    const oldest = cacheOrder.shift();
    if (!oldest) break;
    const stale = documentCache.get(oldest);
    documentCache.delete(oldest);
    stale?.then((pdf) => pdf.destroy()).catch(() => undefined);
  }
  promise.catch(() => documentCache.delete(url));
  return promise;
}

export function MagazineViewer({
  magazine,
  magazines,
  onClose,
  onSelect,
  onOpenLibrary,
}: {
  magazine: NavMagazine;
  magazines: NavMagazine[];
  onClose: () => void;
  onSelect: (magazine: NavMagazine) => void;
  onOpenLibrary: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const lastTapRef = useRef<{ at: number; x: number; y: number } | null>(null);
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const textCache = useRef(new Map<number, string>());
  const [results, setResults] = useState<{ page: number; snippet: string }[]>(
    [],
  );

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    setPage(1);
    setNumPages(0);
    setProgress(0);
    setError("");
    setLoading(true);
    setPdf(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFrame({ width: 0, height: 0 });
    setDragging(false);
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    setSearchDone(false);
    setSearchProgress(0);
    textCache.current.clear();
    let active = true;
    loadDocument(magazine.pdfUrl, (value) => {
      if (active) setProgress(value);
    })
      .then((loaded) => {
        if (!active) return;
        setPdf(loaded);
        setNumPages(loaded.numPages);
        setLoading(false);
      })
      .catch((failure) => {
        if (!active) return;
        setError(
          failure instanceof Error
            ? failure.message
            : "No se pudo abrir la revista.",
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [magazine.pdfUrl]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setStage({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onFullscreen = () =>
      setFullscreen(Boolean(window.document.fullscreenElement));
    window.document.addEventListener("fullscreenchange", onFullscreen);
    return () =>
      window.document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const clampPan = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(0, (frame.width - stage.width) / 2);
      const maxY = Math.max(0, (frame.height - stage.height) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [frame.width, frame.height, stage.width, stage.height],
  );

  // Tras cada cambio de tamaño o de zoom el desplazamiento se reajusta solo.
  useEffect(() => {
    setPan((current) => {
      const next = clampPan(current.x, current.y);
      return next.x === current.x && next.y === current.y ? current : next;
    });
  }, [clampPan]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || stage.width < 40) return;
    let cancelled = false;
    let currentTask: PdfRenderTask | null = null;

    const cancelPrevious = async () => {
      const previous = renderTaskRef.current;
      if (!previous) return;
      try {
        await previous.cancel();
      } catch {
        /* la tarea ya había terminado */
      }
      if (renderTaskRef.current === previous) renderTaskRef.current = null;
    };

    (async () => {
      setRendering(true);
      // Nunca dos render() vivos sobre el mismo canvas: PDF.js pierde el frame.
      await cancelPrevious();
      if (cancelled) return;
      try {
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const fit = Math.min(
          stage.width / base.width,
          stage.height / base.height,
          1.7,
        );
        const scale = Math.min(4, fit * zoom);
        const viewport = pdfPage.getViewport({ scale });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // Se dibuja fuera de pantalla y se vuelca solo al terminar: mientras
        // tanto el canvas visible conserva el último frame bueno.
        const work = window.document.createElement("canvas");
        work.width = Math.floor(viewport.width * dpr);
        work.height = Math.floor(viewport.height * dpr);
        const workContext = work.getContext("2d");
        if (!workContext) return;
        workContext.clearRect(0, 0, work.width, work.height);
        const task = pdfPage.render({
          canvasContext: workContext,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        currentTask = task;
        renderTaskRef.current = task;
        await task.promise;
        if (renderTaskRef.current === task) renderTaskRef.current = null;
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = work.width;
        canvas.height = work.height;
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(work, 0, 0);
        setFrame({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });
        if (page < pdf.numPages) {
          pdf.getPage(page + 1).catch(() => undefined);
        }
      } catch (failure) {
        if (currentTask && renderTaskRef.current === currentTask) {
          renderTaskRef.current = null;
        }
        if (cancelled) return;
        // Una cancelación no es un error: la sustituye el render nuevo.
        if (isRenderCancellation(failure)) return;
        setError("No se pudo dibujar esta página.");
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      const task = renderTaskRef.current;
      if (task) {
        try {
          void task.cancel().catch(() => undefined);
        } catch {
          /* la tarea ya había terminado */
        }
      }
    };
  }, [pdf, page, stage.width, stage.height, numPages, zoom]);

  const go = useCallback(
    (next: number) => {
      if (!numPages) return;
      setPan({ x: 0, y: 0 });
      setPage(Math.min(numPages, Math.max(1, next)));
    },
    [numPages],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        go(page + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go(page - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        go(1);
      } else if (event.key === "End") {
        event.preventDefault();
        go(numPages);
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((value) => Math.min(3, value + 0.25));
        setPan({ x: 0, y: 0 });
      } else if (event.key === "-") {
        event.preventDefault();
        setZoom((value) => Math.max(1, value - 0.25));
        setPan({ x: 0, y: 0 });
      } else if (event.key === "0") {
        event.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, numPages, page]);

  const toggleFullscreen = async () => {
    try {
      if (window.document.fullscreenElement) await window.document.exitFullscreen();
      else await layerRef.current?.requestFullscreen();
    } catch {
      /* el navegador puede bloquear pantalla completa */
    }
  };

  const changeMagazine = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = magazines.find((item) => item.id === event.target.value);
    if (next) onSelect(next);
  };

  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const runSearch = async () => {
    const term = normalize(query.trim());
    if (!pdf || term.length < 2) return;
    setSearching(true);
    setSearchDone(false);
    setResults([]);
    const found: { page: number; snippet: string }[] = [];
    try {
      for (let number = 1; number <= pdf.numPages; number += 1) {
        setSearchProgress(number);
        let text = textCache.current.get(number);
        if (!text) {
          const pdfPage = await pdf.getPage(number);
          const content = await pdfPage.getTextContent();
          text = content.items
            .map((item) => item.str)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          textCache.current.set(number, text);
        }
        const index = normalize(text).indexOf(term);
        if (index >= 0) {
          const start = Math.max(0, index - 48);
          const end = Math.min(text.length, index + term.length + 72);
          found.push({
            page: number,
            snippet:
              (start > 0 ? "… " : "") +
              text.slice(start, end).trim() +
              (end < text.length ? " …" : ""),
          });
        }
      }
      setResults(found);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  };

  const zoomBy = (delta: number) => {
    setZoom((value) => Math.min(3, Math.max(1, value + delta)));
    setPan({ x: 0, y: 0 });
  };

  const fitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const endGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (element.hasPointerCapture(event.pointerId)) {
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        /* el navegador ya había liberado la captura */
      }
    }
    if (gestureRef.current?.pointerId === event.pointerId) {
      gestureRef.current = null;
    }
    setDragging(false);
  };

  const zoomAtPoint = (clientX: number, clientY: number) => {
    const element = stageRef.current;
    if (!element) return;
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const rect = element.getBoundingClientRect();
    const offsetX = clientX - (rect.left + rect.width / 2);
    const offsetY = clientY - (rect.top + rect.height / 2);
    const ratio = 2 / zoom;
    setZoom(2);
    // El punto pulsado se queda quieto: el desplazamiento compensa el
    // crecimiento del contenido.
    setPan({
      x: offsetX - (offsetX - pan.x) * ratio,
      y: offsetY - (offsetY - pan.y) * ratio,
    });
  };

  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    if (zoom > 1) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* el puntero ya se había soltado */
      }
      setDragging(true);
    }
  };

  const onStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (zoom <= 1) return;
    setPan(
      clampPan(
        gesture.originX + (event.clientX - gesture.startX),
        gesture.originY + (event.clientY - gesture.startY),
      ),
    );
  };

  const onStagePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    endGesture(event);
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const moved = Math.hypot(deltaX, deltaY);
    // Con zoom, el arrastre recorre la página y nunca cambia de página.
    if (zoom === 1 && Math.abs(deltaX) >= 60) {
      lastTapRef.current = null;
      go(deltaX < 0 ? page + 1 : page - 1);
      return;
    }
    if (moved > 10) {
      lastTapRef.current = null;
      return;
    }
    const now = Date.now();
    const last = lastTapRef.current;
    if (
      last &&
      now - last.at < 320 &&
      Math.hypot(event.clientX - last.x, event.clientY - last.y) < 30
    ) {
      lastTapRef.current = null;
      zoomAtPoint(event.clientX, event.clientY);
      return;
    }
    lastTapRef.current = { at: now, x: event.clientX, y: event.clientY };
  };

  const onStagePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    endGesture(event);
  };

  const chips = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages],
  );

  return (
    <div
      ref={layerRef}
      className={styles.viewerLayer}
      role="dialog"
      aria-modal="true"
      aria-label={`${magazine.title} · ${magazine.edition}`}
    >
      <header className={styles.viewerHead}>
        <div className={styles.viewerTitle}>
          <span className={styles.kicker}>Revista</span>
          <b>{magazine.title}</b>
          <em>{magazine.edition}</em>
        </div>
        <div className={styles.viewerTools}>
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className={styles.toolButton}
            aria-expanded={searchOpen}
            aria-label="Buscar en la revista"
          >
            <SearchIcon size={16} aria-hidden="true" />
            <span className={styles.toolLabel}>Buscar</span>
          </button>
          <select
            aria-label="Elegir revista"
            value={magazine.id}
            onChange={changeMagazine}
            className={styles.viewerSelect}
          >
            {magazines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.edition}
              </option>
            ))}
          </select>
          <button type="button" onClick={onOpenLibrary} className={styles.toolButton}>
            Ver todas
          </button>
          <a
            href={magazine.pdfUrl}
            download
            className={styles.toolButton}
            aria-label="Descargar PDF"
          >
            <Download size={16} aria-hidden="true" />
            <span className={styles.toolLabel}>Descargar</span>
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={styles.toolButton}
            aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {fullscreen ? (
              <Minimize2 size={16} aria-hidden="true" />
            ) : (
              <Maximize2 size={16} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            autoFocus
            onClick={close}
            className={styles.closeButton}
            aria-label="Cerrar revista"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className={styles.searchPanel}>
          <div className={styles.searchRow}>
            <SearchIcon size={16} aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void runSearch();
                }
                if (event.key === "Escape") setSearchOpen(false);
              }}
              placeholder="Buscar ingrediente, referencia o marca…"
              aria-label="Buscar en la revista"
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching || query.trim().length < 2}
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar búsqueda"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.searchResults} aria-live="polite">
            {searching ? (
              <p>
                Buscando en la página {searchProgress || 1} de {numPages || 0}…
              </p>
            ) : searchDone ? (
              results.length ? (
                <ul>
                  {results.map((result) => (
                    <li key={result.page}>
                      <button
                        type="button"
                        onClick={() => {
                          go(result.page);
                          setSearchOpen(false);
                        }}
                      >
                        <b>Página {result.page}</b>
                        <span>{result.snippet}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Sin resultados. Prueba con otra palabra o revisa la edición.</p>
              )
            ) : (
              <p>Busca en el texto completo de esta edición.</p>
            )}
          </div>
        </div>
      )}

      <div className={styles.viewerBody}>
        <button
          type="button"
          className={`${styles.navArrow} ${styles.navPrev}`}
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>

        <div
          ref={stageRef}
          className={`${styles.stage} ${zoom > 1 ? styles.stageZoomed : ""} ${
            dragging ? styles.stageDragging : ""
          }`}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerCancel}
          onLostPointerCapture={onStagePointerCancel}
        >
          <div className={styles.stageScroll}>
            {loading ? (
              <div className={styles.loading}>
                <span className={styles.loader} aria-hidden="true" />
                <p>Abriendo revista…</p>
                <div className={styles.progressTrack}>
                  <i style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              </div>
            ) : error ? (
              <div className={styles.loading}>
                <p>{error}</p>
                <a href={magazine.pdfUrl} target="_blank" rel="noopener noreferrer">
                  Abrir PDF directamente
                </a>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className={`${styles.pageCanvas} ${rendering ? styles.pageRendering : ""} ${
                  dragging ? "" : styles.panSnap
                }`}
                style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }}
                role="img"
                aria-label={`Página ${page} de ${numPages || 1}`}
              />
            )}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.navArrow} ${styles.navNext}`}
          onClick={() => go(page + 1)}
          disabled={page >= numPages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      </div>

      <footer className={styles.viewerFoot}>
        <div className={styles.zoomControls}>
          <button
            type="button"
            onClick={() => zoomBy(-0.25)}
            disabled={zoom <= 1}
            aria-label="Reducir zoom"
          >
            <ZoomOut size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.zoomValue}
            onClick={fitToScreen}
            aria-label="Ajustar a la pantalla"
            title="Ajustar a la pantalla"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => zoomBy(0.25)}
            disabled={zoom >= 3}
            aria-label="Aumentar zoom"
          >
            <ZoomIn size={15} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.pageCounter} aria-live="polite">
          <b>{String(page).padStart(2, "0")}</b>
          <span>/ {String(numPages || 1).padStart(2, "0")}</span>
        </div>
        <input
          type="range"
          min={1}
          max={numPages || 1}
          value={Math.min(page, numPages || 1)}
          onChange={(event) => go(Number(event.target.value))}
          className={styles.pageRange}
          aria-label="Ir a la página"
        />
        <div className={styles.chips} aria-label="Páginas">
          {chips.map((number) => (
            <button
              key={number}
              type="button"
              className={number === page ? styles.chipActive : styles.chip}
              onClick={() => go(number)}
              aria-label={`Ir a la página ${number}`}
              aria-current={number === page ? "page" : undefined}
            >
              {number}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}

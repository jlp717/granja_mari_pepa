"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useKageValue } from "./navigation/useKageValue";
interface Layer {
  key: string;
  chapterId: string;
  name: string;
  className: string;
  children: ReactNode;
  mounted: boolean;
}
type Registry = (layer: Omit<Layer, "mounted">) => () => void;
const RegistryContext = createContext<Registry | null>(null);
export interface ForegroundProps {
  chapterId: string;
  name?: string;
  className?: string;
  children: ReactNode;
}
/** React owns presence; Kage's original 820ms parking and CSS curves are retained. */
export function Foreground({
  chapterId,
  name = chapterId,
  className = "",
  children,
}: ForegroundProps) {
  const register = useContext(RegistryContext);
  const key = useId();
  useEffect(
    () => register?.({ key, chapterId, name, className, children }),
    [register, key, chapterId, name, className, children],
  );
  return null;
}
function Stage({
  layer,
  remove,
}: {
  layer: Layer;
  remove: (key: string) => void;
}) {
  const owner = useKageValue((snapshot) => snapshot.foregroundOwner);
  const reduce = useKageValue((snapshot) => snapshot.reducedMotion);
  const [phase, setPhase] = useState<"parked" | "active" | "retiring">(
    "parked",
  );
  const prior = useRef(false);
  const element = useRef<HTMLDivElement>(null);
  const active = layer.mounted && owner === layer.chapterId;
  useEffect(() => {
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (active) {
      if (element.current) {
        element.current.inert = true;
        void element.current.offsetWidth;
      }
      frame = requestAnimationFrame(() => setPhase("active"));
      prior.current = true;
    } else if (prior.current && !reduce) {
      setPhase("retiring");
      timer = setTimeout(() => {
        prior.current = false;
        setPhase("parked");
        if (!layer.mounted) remove(layer.key);
      }, 820);
    } else {
      prior.current = false;
      setPhase("parked");
      if (!layer.mounted) remove(layer.key);
    }
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [active, reduce, layer.mounted, layer.key, remove]);
  return (
    <div
      ref={element}
      className={`fg ${phase === "active" ? "fg-active" : phase === "retiring" ? "fg-retiring" : "kage-fg-parked"} ${layer.className}`}
      data-fg={layer.name}
      aria-hidden="true"
      data-fx="layer-handoff"
    >
      {layer.children}
    </div>
  );
}
export function ForegroundProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const mode = useKageValue((snapshot) => snapshot.mode);
  const register = useRef<Registry>((layer) => {
    setLayers((current) => [
      ...current.filter((item) => item.key !== layer.key),
      { ...layer, mounted: true },
    ]);
    return () =>
      setLayers((current) =>
        current.map((item) =>
          item.key === layer.key ? { ...item, mounted: false } : item,
        ),
      );
  }).current;
  const remove = useRef((key: string) =>
    setLayers((current) => current.filter((item) => item.key !== key)),
  ).current;
  return (
    <RegistryContext.Provider value={register}>
      {children}
      <div
        id="fg-sky"
        aria-hidden="true"
        hidden={mode === "internal" || mode === "static"}
      >
        {layers.map((layer) => (
          <Stage key={layer.key} layer={layer} remove={remove} />
        ))}
      </div>
    </RegistryContext.Provider>
  );
}

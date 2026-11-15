"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { usePublicMagazines, type NavMagazine } from "@/lib/use-public-magazines";

interface ViewerProps {
  magazine: NavMagazine;
  magazines: NavMagazine[];
  onClose: () => void;
  onSelect: (magazine: NavMagazine) => void;
  onOpenLibrary: () => void;
}

interface LibraryProps {
  magazines: NavMagazine[];
  onClose: () => void;
  onSelect: (magazine: NavMagazine) => void;
}

interface MagazineContextValue {
  magazines: NavMagazine[];
  openMagazine: (magazine: NavMagazine) => void;
  openLibrary: () => void;
}

const MagazineContext = createContext<MagazineContextValue | null>(null);

export function useMagazines(): MagazineContextValue {
  const value = useContext(MagazineContext);
  if (!value) {
    return { magazines: [], openMagazine: () => {}, openLibrary: () => {} };
  }
  return value;
}

export function MagazineProvider({ children }: { children: ReactNode }) {
  const magazines = usePublicMagazines();
  const [viewer, setViewer] = useState<NavMagazine | null>(null);
  const [library, setLibrary] = useState(false);
  const [Viewer, setViewerComponent] = useState<ComponentType<ViewerProps> | null>(null);
  const [Library, setLibraryComponent] = useState<ComponentType<LibraryProps> | null>(null);

  const openMagazine = useCallback(
    (magazine: NavMagazine) => {
      setLibrary(false);
      setViewer(magazine);
      if (!Viewer) {
        import("./MagazineViewer").then((module) => {
          setViewerComponent(() => module.MagazineViewer);
        });
      }
    },
    [Viewer],
  );

  const openLibrary = useCallback(() => {
    setViewer(null);
    setLibrary(true);
    if (!Library) {
      import("./MagazineLibrary").then((module) => {
        setLibraryComponent(() => module.MagazineLibrary);
      });
    }
  }, [Library]);

  const closeViewer = useCallback(() => setViewer(null), []);
  const closeLibrary = useCallback(() => setLibrary(false), []);

  useEffect(() => {
    if (!viewer && !library) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [viewer, library]);

  useEffect(() => {
    if (!viewer && !library) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (viewer) setViewer(null);
      else setLibrary(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, library]);

  const value = useMemo(
    () => ({ magazines, openMagazine, openLibrary }),
    [magazines, openMagazine, openLibrary],
  );

  return (
    <MagazineContext.Provider value={value}>
      {children}
      {viewer && Viewer ? (
        <Viewer
          magazine={viewer}
          magazines={magazines}
          onClose={closeViewer}
          onSelect={openMagazine}
          onOpenLibrary={openLibrary}
        />
      ) : null}
      {library && Library ? (
        <Library magazines={magazines} onClose={closeLibrary} onSelect={openMagazine} />
      ) : null}
    </MagazineContext.Provider>
  );
}

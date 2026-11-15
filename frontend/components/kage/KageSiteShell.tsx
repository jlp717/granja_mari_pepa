"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/lib/navigation";
import { useAuthStore } from "@/lib/store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getKageNavigationCopy } from "@/lib/kage-navigation-copy";
import { KageRuntimeProvider } from "./KageRuntimeProvider";
import { ForegroundProvider } from "./Foreground";
import { Cursor } from "./Cursor";
import { BootPreloader } from "./BootPreloader";
import { ChapterRail, NavigationContinuity } from "./navigation/ChapterRail";
import { FrameEffects } from "./navigation/FrameEffects";
import { useKageValue } from "./navigation/useKageValue";
import { CookieConsent } from "./navigation/CookieConsent";
import { MagazineProvider } from "@/components/magazines/magazine-context";
import { MagazineTicker } from "@/components/magazines/MagazineTicker";
import { CompanyBackdrop } from "./CompanyBackdrop";
import "./navigation/navigation.css";
function EnvironmentClasses({ allowed }: { allowed: boolean }) {
  const mode = useKageValue((snapshot) => snapshot.mode);
  const ready = useKageValue((snapshot) => snapshot.ready);
  const fallback = useKageValue((snapshot) => snapshot.fallback);
  const reduced = useKageValue((snapshot) => snapshot.reducedMotion);
  const publicRoute = mode === "journey" || mode === "ambient";
  const live = publicRoute && allowed && ready && !fallback && !reduced;
  const still = publicRoute && (!allowed || fallback || reduced);
  useEffect(() => {
    const elements = [document.documentElement, document.body];
    elements.forEach((element) => {
      element.classList.toggle("kage-live", live);
      element.classList.toggle("no-webgl", still);
    });
    return () =>
      elements.forEach((element) => {
        element.classList.remove("kage-live", "no-webgl");
      });
  }, [live, still]);
  return null;
}
export function KageSiteShell({
  children,
  auxiliary,
}: {
  children: ReactNode;
  auxiliary?: ReactNode;
}) {
  const pathname = usePathname(),
    locale = useLocale(),
    copy = getKageNavigationCopy(locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsubscribe = useAuthStore.persist.onFinishHydration(finish);
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsubscribe;
  }, []);
  const privateArea = pathname.startsWith("/area-clientes") && authenticated;
  const allowWebGL = hydrated && !privateArea;
  return (
    <KageRuntimeProvider allowWebGL={allowWebGL}>
      <ForegroundProvider>
        <MagazineProvider>
        <EnvironmentClasses allowed={allowWebGL} />
        <div
          className="kage-shell"
          data-kage-webgl-allowed={allowWebGL ? "true" : "false"}
        >
          <a className="kage-skip" href="#main-content">
            {copy.skip}
          </a>
          <CompanyBackdrop />
          <MagazineTicker />
          <Header />
          <div className="page" id="top">
            <main id="main-content" tabIndex={-1} data-kage-background>
              {children}
            </main>
            <Footer />
          </div>
          <ChapterRail />
          <NavigationContinuity />
          <FrameEffects />
          <Cursor />
          <BootPreloader allowed={allowWebGL} />
          <CookieConsent />
          <div className="kage-auxiliary" data-kage-background>
            {auxiliary}
          </div>
        </div>
        </MagazineProvider>
      </ForegroundProvider>
    </KageRuntimeProvider>
  );
}

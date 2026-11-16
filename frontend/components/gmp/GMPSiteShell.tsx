"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/lib/navigation";
import { useAuthStore } from "@/lib/store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getGMPNavigationCopy } from "@/lib/gmp-navigation-copy";
import { GMPRuntimeProvider } from "./GMPRuntimeProvider";
import { ForegroundProvider } from "./Foreground";
import { Cursor } from "./Cursor";
import { BootPreloader } from "./BootPreloader";
import { ChapterRail, NavigationContinuity } from "./navigation/ChapterRail";
import { FrameEffects } from "./navigation/FrameEffects";
import { useGMPValue } from "./navigation/useGMPValue";
import { CookieConsent } from "./navigation/CookieConsent";
import { MagazineProvider } from "@/components/magazines/magazine-context";
import { MagazineTicker } from "@/components/magazines/MagazineTicker";
import { CompanyBackdrop } from "./CompanyBackdrop";
import "./navigation/navigation.css";
function EnvironmentClasses({ allowed }: { allowed: boolean }) {
  const mode = useGMPValue((snapshot) => snapshot.mode);
  const ready = useGMPValue((snapshot) => snapshot.ready);
  const visible = useGMPValue((snapshot) => snapshot.visible);
  const fallback = useGMPValue((snapshot) => snapshot.fallback);
  const reduced = useGMPValue((snapshot) => snapshot.reducedMotion);
  const publicRoute = mode === "journey" || mode === "ambient";
  const live =
    publicRoute && allowed && ready && visible && !fallback && !reduced;
  const still = publicRoute && (!allowed || !visible || fallback || reduced);
  useEffect(() => {
    const elements = [document.documentElement, document.body];
    elements.forEach((element) => {
      element.classList.toggle("gmp-live", live);
      element.classList.toggle("no-webgl", still);
    });
    return () =>
      elements.forEach((element) => {
        element.classList.remove("gmp-live", "no-webgl");
      });
  }, [live, still]);
  return null;
}
export function GMPSiteShell({
  children,
  auxiliary,
}: {
  children: ReactNode;
  auxiliary?: ReactNode;
}) {
  const pathname = usePathname(),
    locale = useLocale(),
    copy = getGMPNavigationCopy(locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsubscribe = useAuthStore.persist.onFinishHydration(finish);
    const frame = requestAnimationFrame(finish);
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, []);
  const privateArea = pathname.startsWith("/area-clientes") && authenticated;
  const allowWebGL = hydrated && !privateArea;
  return (
    <GMPRuntimeProvider allowWebGL={allowWebGL}>
      <ForegroundProvider>
        <MagazineProvider>
          <EnvironmentClasses allowed={allowWebGL} />
          <div
            className="gmp-shell"
            data-gmp-webgl-allowed={allowWebGL ? "true" : "false"}
          >
            <a className="gmp-skip" href="#main-content">
              {copy.skip}
            </a>
            <CompanyBackdrop />
            <MagazineTicker />
            <Header />
            <div className="page" id="top">
              <main id="main-content" tabIndex={-1} data-gmp-background>
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
            <div className="gmp-auxiliary" data-gmp-background>
              {auxiliary}
            </div>
          </div>
        </MagazineProvider>
      </ForegroundProvider>
    </GMPRuntimeProvider>
  );
}

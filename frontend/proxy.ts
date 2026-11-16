import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

function normalize(value: string | null): string {
  return String(value || "")
    .replace(/^::ffff:/i, "")
    .trim();
}

function isPrivate172(ip: string): boolean {
  const match = /^172\.(\d{1,3})\./.exec(ip);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

function isInternalIp(ip: string): boolean {
  if (!ip) return false;
  if (ip === "::1" || ip.startsWith("127.") || ip === "localhost") {
    return (
      process.env.NODE_ENV !== "production" ||
      process.env.ADMIN_TRUST_LOOPBACK === "1"
    );
  }
  const exact = (process.env.ADMIN_ALLOWED_IPS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (exact.includes(ip)) return true;
  const allow = (process.env.ADMIN_ALLOWED_CIDRS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (allow.some((prefix) => ip === prefix || ip.startsWith(prefix)))
    return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return true;
  }
  return isPrivate172(ip);
}

function clientIp(request: NextRequest): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return normalize(cf);
  const real = request.headers.get("x-real-ip");
  if (real) return normalize(real);
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return normalize(forwarded.split(",")[0]);
  return "";
}

function denied(request: NextRequest, ip: string): NextResponse {
  console.warn(
    "[admin-gate] denied " +
      JSON.stringify({
        ip: ip || "unknown",
        cf: request.headers.has("cf-connecting-ip"),
        xr: request.headers.has("x-real-ip"),
        xff: request.headers.has("x-forwarded-for"),
      }),
  );
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<meta name="robots" content="noindex, nofollow" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Acceso restringido | Granja Maripepa</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100svh; display: grid; place-items: center;
    background: radial-gradient(70% 60% at 70% 0%, #0b1a20, #05070a 65%);
    color: #dfe7e0; font-family: ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", sans-serif;
    padding: 24px; }
  main { width: 100%; max-width: 480px; border: 1px solid rgba(223,231,224,.14);
    background: #070b0e; padding: clamp(24px, 5vw, 40px); }
  .kicker { display: block; font-size: 9px; letter-spacing: .24em;
    text-transform: uppercase; color: #78837c; margin-bottom: 14px; }
  h1 { margin: 0 0 12px; font-size: clamp(26px, 4vw, 34px); font-weight: 300;
    letter-spacing: -.02em; line-height: 1.05; }
  p { margin: 0 0 10px; font-size: 13px; line-height: 1.65; color: #aab4ad; }
  small { display: block; margin-top: 22px; font-size: 10px; letter-spacing: .12em;
    text-transform: uppercase; color: #78837c; }
  a { display: inline-block; margin-top: 26px; padding-bottom: 3px; color: #dfe7e0;
    font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
    text-decoration: none; border-bottom: 1px solid rgba(223,231,224,.3); }
</style></head><body><main>
  <span class="kicker">Granja Maripepa · Administración</span>
  <h1>Acceso restringido</h1>
  <p>Este panel solo está disponible desde la red interna de la empresa. La VPN debe permanecer conectada mientras lo usas.</p>
  <p>Con la VPN activa, entra por la dirección interna:</p>
  <p><strong>http://192.168.1.230:3001/admin</strong></p>
  <p>Si la VPN se desconecta, la sesión dejará de responder de inmediato.</p>
  <small>Área privada · no indexable</small>
  <a href="/es">Volver a la web pública</a>
</main></body></html>`;
  return new NextResponse(html, {
    status: 403,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  if (isAdminPath) {
    const ip = clientIp(request);
    const noIpAllowed = process.env.NODE_ENV !== "production";
    /* Direct LAN/VPN access uses a private literal host (192.168.x.x:3001).
     * Cloudflare and nginx requests carry the public domain as Host, so a
     * spoofed header cannot turn a proxied request into a direct one. */
    const host = (request.headers.get("host") || "").toLowerCase();
    const direct = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(
      host,
    );
    if (!isInternalIp(ip) && !direct && !(noIpAllowed && !ip)) {
      return denied(request, ip);
    }
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Todas las rutas localizadas excepto API, internals, admin y estáticos
    "/((?!api|_next|_vercel|admin|.*\\..*).*)",
    // Raíz
    "/",
    // Panel interno y su API: primera barrera de red
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
  ],
};

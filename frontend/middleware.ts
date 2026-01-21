import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
    // Lista de locales soportados
    locales,

    // Locale por defecto
    defaultLocale,

    // 'as-needed': Solo muestra prefijo para locales no-default (/en/page pero / para español)
    // 'always': Siempre muestra prefijo (/es/page, /en/page)
    localePrefix: 'as-needed',

    // Detectar idioma del navegador
    localeDetection: true
});

export const config = {
    // Matcher que excluye API routes, Next.js internals y archivos estáticos
    matcher: [
        // Todas las rutas excepto:
        '/((?!api|_next|_vercel|.*\\..*).*)',
        // Incluir la raíz
        '/'
    ]
};

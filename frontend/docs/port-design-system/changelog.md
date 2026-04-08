# Port Design System - Migration Changelog

Date: 2026-04-08

## Modified files

- frontend/app/[locale]/acerca/page.tsx
- frontend/app/[locale]/contacto/page.tsx
- frontend/app/[locale]/layout.tsx
- frontend/app/[locale]/legal/privacidad/page.tsx
- frontend/app/[locale]/legal/terminos/page.tsx
- frontend/app/[locale]/lorca/page.tsx
- frontend/app/[locale]/offline/page.tsx
- frontend/app/[locale]/page.tsx
- frontend/app/[locale]/productos/page.tsx
- frontend/app/globals.css
- frontend/components/home/cinematic-hero.tsx
- frontend/components/home/distributors-section.tsx
- frontend/components/home/product-categories.tsx
- frontend/components/layout/footer.tsx
- frontend/components/layout/header.tsx
- frontend/package-lock.json
- frontend/package.json
- frontend/tailwind.config.ts

## Summary

- Applied clone visual system to global styles, layout shell, header/footer, home and key content pages.
- Added Lenis smooth-scroll provider and local clone fonts.
- Copied clone asset packs into frontend/public/clone.
- Preserved existing business logic, routes, API handlers, and server actions.
- Verified production build succeeds with npm run build.

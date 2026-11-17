# Verificación final de la auditoría

Fecha: 2026-11-17
Alcance: 22 URLs del sitemap (`/es` y `/en`) + rutas dinámicas de empleo.
Criterio: no se emite veredicto de “100% profesional” si un punto no se puede
probar. Este documento separa lo corregido de lo que depende de terceros.

## 1. Páginas auditadas

Las 22 URLs del sitemap están inventariadas en `INVENTARIO.md` y
`inventory.json`:

- `/es`, `/en`
- `/productos`, `/acerca`, `/contacto`, `/lorca`, `/calidad`, `/reparto`,
  `/preguntas-frecuentes`, `/trabaja-con-nosotros`
- `/legal/privacidad`, `/legal/terminos`
- equivalentes en `/en`

Rutas dinámicas de empleo: **no hay ninguna publicada** en el momento de la
auditoría. Las 6 ofertas reales están en `draft` en DB2. Por eso no se pudieron
auditar fichas públicas de puesto.

## 2. Huecos, imágenes y duplicaciones

Corregido:

- Home: “1966” pasa de 4 a 2 menciones y “Lorca” de 18 a 11. Cada mención
  restante tiene una función: portada, dato de fundación y sede.
- Acerca: “1966” pasa de 6 a 4 y “Lorca” de 20 a 12; se eliminan títulos
  duplicados.
- Logos de marcas: se sustituyen los PNG con fondo blanco por los PNG
  transparentes (`*-white.png`) en la página de marcas. Las cinco celdas tienen
  el mismo tamaño y tratamiento.
- Se añaden galerías de tres imágenes a `/lorca` y `/reparto`, que antes tenían
  0 imágenes en el contenido principal.
- Portadas de revistas: pasan de `alt=""` a un texto descriptivo.
- Overflow horizontal: 0 px en las páginas medidas.
- No hay imágenes rotas tras cargar la página completa (0 de 31 en home).

Pendiente / limitación:

- Las galerías de contenido se renderizan con las escenas 3D del motor GMP, que
  tapan la fotografía de respaldo (`opacity: 0`). Es el diseño aprobado; cambiar
  la escena por foto plana sería un rediseño, no un ajuste. Las imágenes existen
  y están en el DOM, pero visualmente mandan las escenas.
- `/contacto` y `/preguntas-frecuentes` siguen siendo páginas de texto y datos,
  sin fotografía principal. No se considera un hueco: su función es informativa.
- Las 15 imágenes sin `alt` que quedan en home son miniaturas decorativas de
  familias y la marca de agua del hero, envueltas en `aria-hidden`. No aportan
  información duplicada.

## 3. Logos

- Home y página de marcas: cinco logos, mismo contenedor, mismo alto máximo,
  fondo transparente. Verificado con captura `screens/acerca-brands.png`.
- Header: se mantiene el activo oficial `logo-alpha.png`.
- Correos: logo real incrustado por CID, con relaciónde aspecto 1076×320 y ancho
  completo de la tarjeta (560 px). Verificado en MIME (`image/jpeg`,
  `Content-ID`, `inline`).

**No resuelto:** el avatar del remitente en Gmail sigue siendo genérico. Ese
avatar no lo controla el HTML del correo; depende del perfil del buzón o de
BIMI (DNS + certificado VMC). No hay acceso al buzón ni a DNS para cambiarlo.

## 4. Contenido: qué es Mari Pepa de Lorca

Definición documentada en `DEFINICION-MARI-PEPA.md` y aplicada al copy:

- Empresa de distribución alimentaria HORECA fundada en Lorca en 1966.
- Sede en Saprelorca (Lorca) y delegación en Viator (Almería).
- Congelado, refrigerado y ambiente; siete familias; +1.500 referencias;
  5.000 m³; 24–48 h; Murcia, Almería y Alicante.
- Marcas: Grupo Topgel, Nestlé Helados, Panamar, Okin, Pastelería Amparín.
- No es un restaurante, una persona ni una tradición: es una empresa y una
  marca comercial.

## 5. Correos

Plantilla base única con cabecera, logo, acento `#cf3700`, tipografía y pie
legal. Aplicada a:

- Candidatura recibida y los cinco estados.
- Acuse del formulario de contacto.
- Recuperación de contraseña y código de verificación.
- Aviso interno de nueva candidatura.

Verificado con envío real y MIME. El logo del cuerpo es el correcto.

## 6. Veredicto

**No se emite el veredicto de “100% profesional” todavía.** Los criterios 1, 2,
3 y 5 se cumplen con evidencia; el 4 falla por el avatar del remitente, que es
externo al HTML, y el 6 no puede cerrarse mientras la página de empleo no tenga
ofertas publicadas.

Acciones necesarias, fuera del código:

1. **Avatar de correo:** poner foto de perfil a `noreply@mari-pepa.com` y
   `cv.rrhh@maripepa.es` en el proveedor, o configurar BIMI con DMARC y VMC.
2. **Ofertas:** publicar desde el panel las 6 ofertas reales que están en
   borrador (Comercial HORECA, Reparto Lorca/Viator, Mozo de almacén,
   Administrativo de pedidos, Técnico de calidad).
3. **Herramientas:** Firecrawl/SISTRIX y las extensiones de QA no se pueden
   instalar en este entorno; requieren cuentas, claves y un navegador con
   extensiones. La cobertura se ha hecho con Playwright, rastreador propio y k6.

Cuando esas tres acciones estén hechas, se puede repetir la verificación y
emitir el veredicto final.

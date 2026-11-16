# Diseño V3 — Kage literal y adaptación de marca

## 1. Fuente y límites

Esta versión parte del worktree nuevo592d3a8 y de `C:/Users/Javier/Desktop/Repositorios/kage-main/index.html`. La referencia inmutable es `reference/kage-verbatim/`. No se reutiliza un sistema visual anterior. Los números de línea de este documento corresponden al originalKage, no al archivo portado.

El CSS fuente completo del bloque `<style>` (líneas11–883) está en `frontend/components/kage/styles/kage.css`: reset, tipos, reveals, preloader, navegación, todos los layoutsB, foregrounds, breakpoints y movimiento reducido. Se conserva su orden. No se ha resumido en una rejilla genérica ni redondeado a un sistema de8px.

Las adaptaciones aprobadas se enumeran; no se presentan como medicionesKage. Los hashes de extracción y archivos están en `docs/redesign/discovery/tokens.json`. La comprobación de fuentes no prueba identidad visual con el live; ésta requiere navegador.

## 2. Tipografía real

Las siete WOFF2 proceden de las siete líneas de `secret-pathways-assets/fonts.css`, que las contiene embebidas enBase64. Se extraen sin modificar bytes a `frontend/components/kage/fonts/`; no se instala ninguna familia.

| Línea fuente | Familia/registro | Archivo            | Bytes | Metadata comprobada                              |
| ------------ | ---------------- | ------------------ | ----: | ------------------------------------------------ |
| 1            | Onest300         | onest-300.woff2    | 14448 | estática, OS/2 peso300,213 codepoints            |
| 2            | Onest400         | onest-400.woff2    | 14032 | estática, peso400,213 codepoints                 |
| 3            | Onest500         | onest-500.woff2    | 14668 | estática, peso500,213 codepoints                 |
| 4            | Onest700         | onest-700.woff2    | 14760 | estática, peso700,213 codepoints                 |
| 5            | NotoJP400        | notojp-400.woff2   | 12644 | variablewght100–900/default100; CSS400; subset35 |
| 6            | Wordmark500      | wordmark-500.woff2 |  1608 | estática, peso500, subset22, name table vacía    |
| 7            | Wordmark600      | wordmark-600.woff2 |  1636 | estática, peso600, subset22, name table vacía    |

Onest cubre ÁÉÍÓÚÜÑ/áéíóúüñ/¿¡. Wordmark sólo cubre `0123456789AEGKSacegkrt`: no permite escribir GRANJA/MARI/PEPA sin mezclar fuentes de respaldo. No existe un nombre interno que permita atribuirle una familia completa o añadir una fuente supuestamente equivalente. NotoJP tampoco se declara fuente CJK completa.

**Adaptación de marca aprobada por Root:** identidad mediante el logo auténtico deMain en cabecera y textura3D, conservando encuadre/math del motor. UI y texto vertical español usan Onest original. `.jp.kage-latin` permite esa excepción explícita sin alterar el `.jp` de la referencia. No se genera un logotipo nuevo.

`fonts/index.ts` usa `next/font/local` con los pesos anteriores, `style:normal`, `display:block` idéntico al origen y `adjustFontFallback:false`; no introduce métricasArial ajenas. Exporta:

- `kageFontVariables`: string para className dehtml.
- `kageFontFamilies.onest/jp/wordmark`: familias resueltas para canvas y FontFaceSet.
- `kageOnest`, `kageJapanese`, `kageWordmark`: objetosNextFont.

Es necesario resolver el nombre real deNext: Kage usa la familia literalWordmark en3027,3045 y4704, que no coincidiría con el nombre generado. El puente cambia la referencia de familia, no320px/SZ/track ni geometría. Los siete hashes completos están en el manifiesto.

## 3. Paleta y marca

Valores Kage: ink#05070a, ink-2#0a0e12, bone#dfe7e0, bone-dim#aab4ad, muted#78837c, line rgba(223,231,224,.13), line-soft rgba(223,231,224,.07), gold#c9a24a. fuente:index12–22.

**Acento fresco aprobado:** `hsl(190 95%40%)`, sRGB8#05a7c7. Art lo midió en producción y coincide conMain globals.css:77. No se confunde con el azulprimary deMain ni con los píxeles oscuros del JPEG del logo. `--vermilion`, `--ember` y los dos lavadosUI rgba(224,35,28,.09/.13) se mapean al únicoacento aprobado; no se sustituyen luces cálidas físicas ni los gradientes de fallback de escena.

Se conservan los colores locales del original: body-lg#b4bfb7, body#9aa5a0, chip#7d8781, lead#c2cdc5, lesson#909b95, tiempo#8b958f, footer#8f9a93/#79847e, además de todos los scrims y sombras fuente. No se consolidan por parecido.

`--muted` de Kage se renombra únicamente a `--kage-muted`: Main/shadcn utiliza ese nombre para una tripletaHSL y no puede compartir la misma variable con un hexadecimal. Las demás formas CSS y valores permanecen. Los aliasesHSL de controles se calculan del RGBKage; no constituyen una segunda paleta. Los estados semánticos conservan texto/iconos y no dependen sólo de color.

## 4. Tipos y composición

Body Onest300,16px/1.6. Eyebrow10px/500/.22em. Display400/1.055/-.012em. Hero clamp(26px,3.05vw,46px); sección clamp(30px,4vw,60px). Body-lg clamp(14px,1.02vw,17px)/1.72; body14px/1.68. Números clamp(26px,2.5vw,36px)/300/-.02em/tabular. fuente:index31–75.

Padding general clamp(20px,3.4vw,56px), nav84px. Secciones clamp(88px,15vh,190px) var(--pad). Se preservan alturas100svh, ch, vh, vw, fr, aspectos y tamaños locales. fuente:index23–24,165–228.

Los seis atributosB deben estar enBODY: hero,story,gallery,curriculum,closing,footer. fuente:index886–887. La variante activa es:

- Hero: columna maxmin(590px,46vw), índice min(480px,40vw),4columnas/gap12, peek bajo-derecha y tipo vertical lateral.
- Story: tres columnas minmax(120px,.38fr)/1.08fr/minmax(280px,.88fr); título atraviesa dos ycopy a la derecha; banda de cuatro cifras.
- Gallery: mosaico1.55fr/.75fr, ventana alta izquierda y dos apiladas, gap14px, altura principal min(72vh,760px).
- Atlas: seis columnas; dos placas span3 y las siguientes span2, gap1px, min-height250px/padding24px.
- Closing: dos columnas .7fr/1.3fr, título vertical clamp(52px,6vw,82px), apoyos yCTA a la izquierda.
- Footer: manifiesto completo encima de tres columnas ybase1fr/auto/1fr.

fuente:index534–637. Las imágenes, texto y geometría GMP cambian por contenido verificado y escenas aprobadas; la retícula no se inventa por ruta.

## 5. Responsive y capas

Breakpoints literales max-width1080,820,560px. Se conservan todos los bloques, incluidos los específicosB posteriores. fuente:index465–516,778–877.

A1080 story pasa a una columna yatlas span3/última span6. A820 hero usa todo el ancho eíndice2columnas; gallery una columna con imagen principal4/5 ylas otras16/10; atlas una columna; closing horizontal/centrado; footer una columna. A560 chips verticales con gap4px y números clamp(22px,7.4vw,30px). No se sustituyen por los breakpoints por defecto deTailwind.

Capas: canvas0,page10,rail45,nav50,foreground52,vignette55,grain60,cursor80,preloader100. El host foreground permanece fijo al borde inferior, heightmin(56svh,680px). El near-plane entra completo, releva al anterior con blur yno scrolla como papel de fondo. fuente:index45–58,449–462,639–808.

Las URLs de assets pasan mecánicamente a `/kage/secret-pathways-assets/...`; Root copia los archivos correspondientes. No se alteran sus bytes desdeTokens.

## 6. Movimiento literal

Curvas: `.22,.61,.36,1`; `.16,1,.3,1`; `.65,0,.35,1`. fuente:index25–27. Las transiciones sin curva declarada conservan su valorCSS por defecto; no se reemplazan todas por una curva única.

Reveal opacity.9s ytransform1.05s; máscara110%; palabras112%,transform.82s yopacity.5s,72ms por palabra enJS. fuente:index78–93,4189. Navtransform.55s, backdropopacity.5s linear; burger.45s; menu.65s/opacity.4s con salida diferida. fuente:index121–162,473–505.

Foreground entrada1.2s opacity/1.5s transform, delays0/90/180/270ms; relevo.68s opacity/.78s transform/filter hacia8vh/scale.98/blur18px. Sway21s. fuente:index699–725. Cue2.8s ylos paresglow6.1/9.7,3.7/5.3,7.3/11.2 se conservan. fuente:index179,327–349,1041–1057.

El CSS reduced original permanece: loops anulados donde corresponde, duración.001ms, una iteración, textos ypalabras visibles/sintransform. fuente:index350–352,805–808,879–883. La capaSSR/no-script yla calidad adaptativa del mundo corresponden al motor: no se presume que el CSSoriginal, por sí solo, libere un preloader si falla todoJavaScript.

## 7. Adaptaciones operacionales y accesibilidad

Kage no proporciona formularios, tablas, validación o estados disabled. `styles/controls.css` los identifica como adaptación. Utiliza Onest ylos roles anteriores; no cambia payloads, validación de negocio, autenticación ni resultados de peticiones.

- Control mínimo44px; foco2px/offset4px yborde#78837c. Son decisiones de acceso/operación, no números medidos enKage.
- Input16px/1.68 ysuperficie#0a0e12; error con aria-invalid ytexto/icono, sin afirmar éxito ficticio.
- Botón hereda la composiciónCTA:17px30px,11px/500/.22em, radio100px yrelleno.62s. No añade flechas automáticas. Disabled/loading impiden activación yconservan el nombre.
- Tabla con filetes fuente, tipos14px ycabecera10px/500/.2em; la selección conserva etiqueta/estado real.
- Loading/skeleton adopta el cue2.8s, sin porcentajes ocontadores inventados, yse detiene con movimiento reducido.
- Portales de diálogo usan capas100/101 por encima de foreground/grain;101 es adaptación funcional. Se mantiene Radix para foco/Escape/restauración, sin recrear un gestor paralelo.
- Enlaces Kage reciben paridad de teclado del hover youtline visible. La selección invierte aink sobre el nuevoacento para conservar contraste.

Los aliases de variantesMain no crean supuestas capacidadespremium ni un segundo acento. Las animaciones físicas pertenecen al mundo; las de controles confirman estados reales.

## 8. Integración y evidencia

Orden en rootlayout: `app/globals.css`, `components/kage/styles/kage.css`, `components/kage/styles/controls.css`. Los seis atributosB viven enBODY; `kageFontVariables` enHTML. La navegación, páginas yengine utilizan las clases/datos originales orefs equivalentes.

Tailwind preflight se desactiva para no borrar los márgenes de párrafo yotros valoresUA que Kage conserva. Se deja un soporte explícito de borde sólido/0 para las utilidades de componentes; no cambia las retículas ni los tipos de la referencia.

Checks iniciales: siete payloadsWOFF2 idénticos yfuenteCSS completa verificados. TSC/ESLint/Prettier/build ycomparaciónvisual quedan pendientes hasta que Root estabilice las dependencias. No se declaraPASS de compilación ni de comportamiento por haber copiado archivos. No se usa un auditor anterior como criterioV3.

## 9. Adaptaciones integradas de controles, asistente y entrega

La cascada externa `kage.css` conserva su formato original por decisión expresa de Root; sólo el código propio y los adaptadores se formatean. No se presenta una equivalencia de bytes del CSS adaptado con el original: las transformaciones mecánicas están enumeradas en §3 y en el manifiesto.

El slot `gmp-low-left/right` con `.fg-gmp-low` es una adaptación aprobada por Art para capas alfa dispersas GMP. Reutiliza las dimensiones de `fg-wall` del capítulo gate: `clamp(430px,47vw,780px)`/bottom-30px; a1080 `clamp(390px,42vw,600px)`; a820 `min(82vw,440px)`/bottom-22px. El anclaje lateral0 conserva material situado en el extremo de la lámina; no cambia los filtros, opacidad, curvas ni relevos originales. fuente:index746–803; adaptaciónArt11/11/2026.

La foto SSR de las tarjetas continúa visible hasta que Cloth confirme un upload WebGL2 válido. Sólo `.on-cloth [data-cloth-fallback]` la sustituye por el canvas; la clase se retira al fallar o disponer. El pie de foto sigue disponible. Este contrato depende del adapter de Motion; el CSS no presume que se haya cargado una imagen.

Pepa AI conserva la llamada Main `/api/chatbot`, el historial de los últimos6mensajes, `conversationId:undefined`, locale, manejo real de respuesta/error y reconocimiento de voz por acción del usuario. La reproducción temporal existente de texto se conserva, con alternativa inmediata en reduced-motion. Su interfaz usa Onest, filetes y jerarquía editorial; el panel no-modal tiene foco inicial, Escape, retorno de foco al lanzador y coordinación de overlays mediante eventos `kage:overlay-open/close`. Las capas110 del asistente y120 del toast son adaptaciones funcionales. No se afirma procesamiento local, persistencia del chat o disponibilidad del servicio a partir del nombre del asistente.

El servidor usa `NEXT_DIST_DIR` sólo para separar artefactos dev/build; el valor por defecto sigue `.next`. La reescritura API hacia `127.0.0.1:5000` se mantiene. Headers Node acotados: nosniff, referrer estricto entre orígenes y CSP sólo para objetos/base/ancestros/workers(self yblob); sin inventar una allowlist de todas las integraciones ni añadir unsafe-eval.

La optimización de Next/Image se activa para las fotos y assets con Sharp0.35.5, aprobado por Root tras comprobar metadata oficial: Node>=20.9.0 y binarios específicos por plataforma. Se conservan formatos y calidadMain. Las cuatro fotos Main del mosaico disponen de patrones HTTPS exactos en images.pexels.com; no se permite un host arbitrario. fuente: [guía oficial Next14 de self-hosting](https://nextjs.org/docs/14/app/building-your-application/deploying#image-optimization), [metadata oficial Sharp0.35.5](https://registry.npmjs.org/sharp/0.35.5). Esto es configuración y carga nativa verificada por Root; no acredita por sí solo latencia fría, FPS o Lighthouse.

Next14.2.15 permanece por decisión explícita de Root, sin migración ni parche de seguridad automático en la tanda visual. La [política oficial vigente](https://nextjs.org/support-policy) clasifica14 como no soportado. Esa limitación se conserva y no se afirma entrega lista para producción ni seguridad completa.

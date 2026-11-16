## Learned User Preferences

- El rediseño público tiene que verse como un producto de estudio terminado en todas las páginas: composición propia, movimiento real y cero aspecto de plantilla de IA. palosecodesign.com marca el nivel de acabado, no el estilo ni la marca a copiar.
- El contenido y la funcionalidad de negocio (pedidos, acceso, catálogo) se mantienen. No inventar clientes, precios, certificaciones ni cifras. Sin ficha real, el catálogo público sigue en «Próximamente».
- Un arreglo de un cliente, una serie o un artículo se comprueba contra la base de datos y no se hardcodea de forma que rompa el resto de libros o facturas.
- Los assets del rediseño deben tener sello propio «Cámara y albarán» (cadena de frío HORECA + luz Lorca/Murcia), no stock genérico de almacén al atardecer. El logo real no se regenera ni se sustituye.
- En Higgsfield, cada prompt pegado declara modelo y ajustes; respetar techos unlimited (`seedream_v5_pro` / `nano_banana_pro` a 2k; `gpt_image_2_6` unlim solo medium/2k PNG; vídeo `seedance_2_5`). `use_unlim` funciona mejor fuera de Cursor (ChatGPT/Claude).

## Learned Workspace Facts

- Este repo es la web mari-pepa.com (Next.js + Supabase) de Mari Pepa, distribución HORECA. El libro de IVA repercutido y la regeneración de facturas Panamar viven aquí. La app de movilidad es otro repo (`gmp_app_mobilidad`) y su rama de referencia es `test`, no `main`.
- El rediseño público va en la rama `rediseno/v3`. El canon está en `docs/redesign/` (DIRECCION-DE-ARTE.md, DESIGN.md, DECISIONES.md). Concepto «Cámara y albarán». Acento `--mp-accent` `#cf3700`, no el violeta de Stripe `#533afd`. Tipografías: Barlow Condensed, Source Sans 3 y Source Code Pro. El movimiento usa solo valores medidos (opacidad 0,5 s ease, transform 0,8 s curva Stripe, marquesina 28 s lineal) y respeta `prefers-reduced-motion`.
- La guía de generación de assets está en `docs/redesign/art/GUIA-GENERACION-ASSETS.md`. Entrega web: `.webp` / `.mp4` / `.glb` bajo `frontend/public/kage/`.
- El desarrollo local es `npm run dev` en `frontend/`, puerto 3000, Node v22 en `C:\Users\Javier\AppData\Local\nvm\v22.22.1`. La shell es PowerShell. El build de producción usa un `.next` distinto del de desarrollo.
- En el servidor, la app está en `/var/www/mari-pepa`. El despliegue es pull de `main`, `npm run build` en `frontend/` y reinicio de los procesos pm2 `mari-pepa-backend` y `mari-pepa-frontend`.
- Facturas Panamar: desde el 2026-11-01 la tarifa de valoración de las ventas es 86. El precio del documento es el menor entre el de tarifa y el precio real de venta, en todos los artículos a los que aplique.
- El acceso al área de clientes usa el código completo de diez dígitos. Un inicio de sesión de prueba no debe contar para el límite de intentos que obliga a cambiar la contraseña.
- No se versionan `.cursor/`, `.env*`, `auth.json`, `frontend/clearTimeout(id)` ni los zip del rediseño. Los umbrales de `scripts/*.mjs` no se bajan para forzar un PASS. Auth, RLS, esquemas de Supabase y rutas de API se dejan intactos.

---

## Voz de marca

- Cercana y de oficio; hablar de tú sin familiaridad forzada.
- Frases cortas y directas.
- Un dato por párrafo.
- Nombrar hechos antes que promesas.
- No usar superlativos sin prueba publicada.
- Usar vocabulario real: almacén, ruta, pedido, cámara, muelle, cadena de frío, reparto.
- Evitar corporativismo y anglicismos innecesarios.
- Mantener voz activa y sujetos concretos.
- Decir cuándo un dato falta: `[FALTA DATO]`.
- No prometer precios, stock o fichas públicas mientras catálogo esté en preparación.

## Frases prohibidas

- en el mundo de
- es importante destacar
- no cabe duda
- en conclusión
- sumérgete
- descubre el poder de
- hoy en día (como apertura)
- nuestro compromiso con la calidad
- experiencia inigualable
- soluciones integrales
- equipo de expertos
- productos de alta gama
- excelencia
- calidad premium
- sinergias
- apasionados por

## Reglas SEO on-page

- Un H1 único de 50-60 caracteres con keyword al inicio.
- Meta description de 120-155 caracteres con CTA.
- Jerarquía de headings correcta.
- Keyword en H1, primer párrafo, un H2 y slug.
- Tres o más enlaces internos.
- `alt` descriptivo en imágenes.
- Mínimo 800 palabras en blog y 1.200 en contenido pilar.

## Reglas anti-slop

- Solo afirmaciones verificables.
- Un dato por sección.
- Usar ejemplos reales cuando existan.
- Párrafos de hasta cuatro líneas.
- Voz activa.
- Máximo una pregunta retórica.
- Prohibido estructurar contenido en listas de 5, 7 o 10 puntos por fórmula.

## Reglas GEO/AEO

- Respuesta directa de 40-60 palabras bajo un H2.
- Un dato verificable cada 150-200 palabras.
- Nombrar entidad completa: “Maripepa, Lorca (Murcia)”.
- Priorizar formato extractable: definición, pasos, tabla breve o FAQ.
- Mostrar fecha visible cuando aplique.
- Mantener `llms.txt` actualizado.

## Estructura del sitio

- Públicas: `/es`, `/es/productos`, `/es/acerca`, `/es/contacto`, `/es/lorca`, `/es/calidad`, `/es/reparto`, `/es/preguntas-frecuentes`, `/es/trabaja-con-nosotros`, `/es/trabaja-con-nosotros/[slug]`, `/es/legal/privacidad`, `/es/legal/terminos`.
- Privadas: `/area-clientes`, `/checkout`, `/admin`, `/offline`.
- Solo `es` y `en` son indexables.

## Reglas de trabajo

- Flujo de contenido: brief → escribir → stop-slop → seo-audit → publicar.
- Frontend: solo micro-ajustes dentro de `frontend-refine`.
- Auditoría mensual: tech-auditor y seo-reviewer.
- Auditoría trimestral: local-seo-audit.

## Datos canónicos del negocio

**No inventar datos fuera de esta lista.**

- Razón social: Maripepa, S.L. Distribuidor alimentario HORECA.
- Fundación: 1966, Lorca (Murcia).
- Sede: Avenida Francisco Jimeno Sola, 3, Polígono Industrial Saprelorca, 30817 Lorca, Murcia.
- Teléfonos sede: 968 46 75 14 y 639 77 86 55.
- Email: pedidos@granjamaripepa.com.
- Delegación: Calle Sierra de Ronda, 26, Polígono Industrial La Juaida, 04240 Viator, Almería.
- Teléfono delegación: 950 97 34 29.
- CIF: B04008710.
- Horario: lunes a viernes, 08:00-13:00 y 16:00-19:00.
- Cobertura: Región de Murcia, Provincia de Almería, Provincia de Alicante.
- Familias: productos del mar, carnes, precocinados, repostería, panadería, refrigerados y salsas.
- Marcas publicadas: Grupo Topgel, Nestlé Helados, Panamar, Okin, Pastelería Amparín.

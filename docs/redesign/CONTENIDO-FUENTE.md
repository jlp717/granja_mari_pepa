# CONTENIDO-FUENTE · V3

Fuente Main: 592d3a8a531e919c68964fb2ec83d73625551c6f. Lectura de producción: 11 de noviembre de 2026. No reutiliza V2.

## Criterio de verdad

Cada registro conserva URL, selector y path/línea. Una afirmación publicada no acredita vigencia de un certificado, plazo o tarifa. SQL no equivale al resultado de una consulta: en esta tarea hay cero resultados reales de BD. Los 40 artículos estáticos no autorizan publicar SKU, precios o stock.

## Legales literales

fuentes/legal-main.json conserva las 55 cláusulas originales, títulos e introducciones de cinco idiomas, con SHA por fichero y por contenido. Los messages no se modifican. Las seis cláusulas de privacidad y cinco de términos ES coinciden con producción normalizando sólo HTML y espacios para comprobar correspondencia. El contenido RAW permanece intacto.

## Registro

| ID | Estado | Hecho | Fuente |
|---|---|---|---|
| F01 | published_consistent | Lorca y origen en 1966 | https://mari-pepa.com/es/acerca · frontend/lib/data.ts:174 |
| F02 | published_consistent | Teléfonos: 968 46 75 14 y 639 77 86 55 | https://mari-pepa.com/es/contacto · frontend/lib/data.ts:162 |
| F03 | published_consistent | Lunes a viernes: 8:00–13:00 y 16:00–19:00 | https://mari-pepa.com/es/contacto · frontend/lib/data.ts:185 |
| F04 | published_consistent | Saprelorca, Jimeno Sola 3, 30817 Lorca; variantes de redacción | https://mari-pepa.com/es/lorca · frontend/app/[locale]/lorca/page.tsx:87 |
| F05 | conflict | Murcia+Alicante en Acerca/globo frente a Murcia+Almería en cabecera/Lorca | https://mari-pepa.com/es/acerca · frontend/messages/es.json:306 |
| F06 | conflict | pedidos@granjamaripepa.com en Contacto/pie; pedidos@mari-pepa.com en Lorca/legal | https://mari-pepa.com/es/lorca · frontend/app/[locale]/lorca/page.tsx:107 |
| F07 | conflict | Servicio 24h en metadatos frente a 24–48h en cuerpo | https://mari-pepa.com/es · frontend/messages/es.json:882 |
| F08 | published_unverified | Viator, Almería: 950 97 34 29 / 670 49 01 47 | https://mari-pepa.com/es/contacto · frontend/app/[locale]/contacto/page.tsx:306 |
| F09 | published_channel | WhatsApp publicado al 639 77 86 55; no se envió mensaje | https://mari-pepa.com/es/contacto · frontend/app/[locale]/contacto/page.tsx:822 |
| F10 | production_state | Catálogo Próximamente, sin SKU/precio/stock público acreditado | https://mari-pepa.com/es/productos · frontend/app/[locale]/productos/page.tsx:28 |
| F11 | published_taxonomy | Cuatro familias Topgel: mar, carnes, precocinados, repostería | https://mari-pepa.com/es · frontend/components/home/product-categories.tsx:173 |
| F12 | published_brands | Topgel, Nestlé, Panamar y destinos externos; oficialidad no acreditada aquí | https://mari-pepa.com/es · frontend/components/home/distributors-section.tsx:11 |
| F13 | repository_static | 40 artículos estáticos NO son resultados reales de BD | Repositorio · frontend/lib/data.ts:199 |
| F14 | repository_static | sampleOrders y sampleInvoices son muestras | Repositorio · frontend/lib/data.ts:666 |
| F15 | repository_stub | Controladores públicos devuelven [] o null | Repositorio · backend/app/controllers/productsController.js:89 |
| F16 | sql_definition | Consulta ODBC sobre DSEDAC.LAC definida, no ejecutada | Repositorio · backend/app/services/databaseService.js:282 |
| F17 | published_unverified | ISO 9001:2008, energía verde, 1.500 referencias y 5.000 m³ publicados sin acreditación vigente aportada | https://mari-pepa.com/es/acerca · frontend/lib/data.ts:179 |
| F18 | published_unverified | Reseñas y valoración hardcoded; sin comprobar Google actual | https://mari-pepa.com/es/acerca · frontend/app/[locale]/acerca/page.tsx:995 |
| F19 | literal_policy | 11 cláusulas ES coinciden DOM/Main; 55 cláusulas de cinco idiomas preservadas RAW | https://mari-pepa.com/es/legal/privacidad · frontend/messages/es.json:886 |
| F20 | production_link_error | Enlace /forgot-password del ejemplo termina en /es/forgot-password, HTTP 404 | https://mari-pepa.com/forgot-password · frontend/app/[locale]/login-secure-example/page.tsx:1 |
| F21 | production_state | URL inexistente muestra 404 genérico en inglés sin shell | https://mari-pepa.com/es/ruta-v3-no-existe · frontend/app/[locale]/not-found.tsx:50 |
| F22 | metadata_difference | Sitemap publicado 7 destinos; generador Main 6 rutas por 5 idiomas | https://mari-pepa.com/sitemap.xml · frontend/app/sitemap.ts:9 |
| F23 | repository_declared_unverified | Facebook/Instagram sameAs y Twitter creator no acreditan titularidad | https://mari-pepa.com/es · frontend/components/seo/JsonLdSchemas.tsx:69 |
| F24 | production_ui_not_tariff | Checkout vacío muestra envío 5,99 e IVA 21%; no validados como tarifas | https://mari-pepa.com/es/checkout · frontend/app/[locale]/checkout/page.tsx:1 |

## Uso en las páginas nuevas

Home usa el origen en Lorca, actividad HORECA, familias, marcas y canales publicados. Cobertura, plazos y acreditaciones contradictorias quedan pendientes; no se escoge una versión por intuición. El catálogo sigue en Próximamente y su filtro editorial orienta por familia, sin simular SKU o disponibilidad. Los PDF conservan edición explícita. Ambos emails mantienen contexto y las políticas son literales. WhatsApp sigue como canal publicado abierto sólo por acción del usuario.


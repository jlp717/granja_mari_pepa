# Herramientas de auditoría

## Lo que se ha usado realmente

| Necesidad | Herramienta | Estado |
|---|---|---|
| Rastreo de todas las URLs | `scripts/audit-site.mjs` sobre `sitemap.xml` + streaming HTML de Next | Operativa |
| Navegación y QA visual | Playwright MCP (`browser_navigate`, `browser_evaluate`, `browser_take_screenshot`) | Operativa |
| Layout, overflow, imágenes rotas, logos | Evaluación DOM con Playwright | Operativa |
| Carga y disponibilidad | Grafana k6 (`load/k6/`) | Operativa |
| Datos reales | DB2/AS400 vía backend | Operativa |
| Correos | Inspección MIME de nodemailer + envío real | Operativa |

## Lo que no se ha podido instalar

Este entorno no permite instalar extensiones de navegador (PeekabooQA, Page QA
Checker, ui-oddity-scan, DupliPage, Parse) ni servidores MCP externos
(Firecrawl, SISTRIX). Tampoco hay cuentas ni claves de API para esos servicios.
No se afirma que estén instalados.

La cobertura equivalente se ha hecho con Playwright, el rastreador propio y
capturas de pantalla guardadas en `docs/auditoria/screens/`. Las comprobaciones
que dependen de una extensión concreta quedan documentadas como sustituidas, no
como ejecutadas con esa herramienta.

## Cómo reproducir

```bash
node scripts/audit-site.mjs
```

Genera:

- `docs/auditoria/inventory.json`: metadatos, encabezados, textos, imágenes y
  frases repetidas de las 22 URLs del sitemap.
- `docs/auditoria/INVENTARIO.md`: tabla legible.

Las capturas se generan con Playwright en `docs/auditoria/screens/`.

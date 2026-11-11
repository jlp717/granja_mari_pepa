# 04 · Carpeta de assets propios

El vídeo atribuye a la carpeta de assets propios el grueso del carácter de la web (el autor habla del 80 % del resultado): sin assets con identidad, el diseño se queda en plantilla. Esta fase es obligatoria (Fase 4).

## 1. Estructura

```
public/assets/rediseno/
  imagen/        # fotografía real de producto y ambiente (AVIF/WebP + fallback)
  ilustracion/   # vectoriales propios (SVG)
  iconos/        # set coherente (SVG), un solo estilo
  texturas/      # fondos, grano, patrones (ligeros)
  lottie/        # animaciones JSON pequeñas
  3d/            # escenas Spline / Unicorn Studio exportadas, con alternativa estática
  video/         # bucles cortos con poster, sin audio
docs/redesign/ASSETS.md   # manifiesto (ver §4)
```

## 2. Qué se produce por sección

Parte del documento de secciones (`03`, C2): cada sección declara su asset previsto. Primero se decide **el papel del asset** (dar escala, generar emoción, explicar un proceso, separar zonas, reforzar marca) y después se elige la herramienta.

## 3. Herramientas que cita el vídeo y cómo se usan aquí

| Herramienta | Uso previsto | Condición |
|---|---|---|
| **Higgsfield** (vía MCP) | Imágenes y vídeo de ambientación, fondos, escenas abstractas | Solo con credencial en el entorno y siguiendo su documentación oficial |
| **Unicorn Studio** | Fondos y efectos WebGL interactivos | Solo sobre el pliegue o secciones clave; alternativa estática y respeto de `prefers-reduced-motion` |
| **Spline** | Escenas 3D ligeras o elementos de marca | Con exportación optimizada y imagen de reemplazo |
| **Recraft** | Ilustración vectorial e iconografía de estilo único | Un único estilo para todo el set; revisar licencia de uso |
| **Magnific** | Escalado/mejora de imágenes reales de producto o de ambiente | No altera el producto retratado |
| **Lottie** | Microanimaciones (confirmaciones, estados vacíos, carga) | JSON pequeño; no sustituye jerarquía visual |

Si no hay cuenta o credencial para alguna: no bloquea. Se resuelve con fotografía real del banco existente, SVG propio y fondos generativos en CSS/SVG, y se anota en `DECISIONES.md`.

## 4. Manifiesto (`docs/redesign/ASSETS.md`)

| id | sección/ruta | papel | tipo | origen (real / generado / vectorial propio) | herramienta | prompt o fuente | licencia/derechos | formato y peso | `alt` | estado |
|---|---|---|---|---|---|---|---|---|---|---|

## 5. Reglas

1. **Producto veraz (R9).** Las fotos de producto son reales. Un asset generado no puede mostrar un producto, envase o etiqueta que parezca real ni sugerir calidades, certificaciones o procedencias no demostradas.
2. **Cero afirmaciones en la imagen.** Nada de textos, sellos o logotipos de terceros dentro de imágenes generadas.
3. **Prompts de imagen sin valores de diseño:** la paleta y el tratamiento se citan por sección de DESIGN.md (p. ej. «paleta de DESIGN.md §2, tratamiento de DESIGN.md §9»), nunca con códigos de color a mano. Estructura del prompt: sujeto · encuadre · luz · fondo · profundidad de campo · restricciones negativas.
4. **Coherencia:** un único lenguaje de imagen para todo el sitio (luz, encuadre, grano, saturación). Un asset que desentona se descarta aunque sea bonito.
5. **Rendimiento:** formatos modernos (AVIF/WebP) con tamaños responsive; carga diferida salvo el pliegue; vídeo con `poster`, sin audio y con duración corta; 3D/WebGL solo si pasa el presupuesto de rendimiento (G6 de la misión) y con alternativa estática.
6. **Accesibilidad:** `alt` descriptivo útil, no decorativo; elementos puramente decorativos con `alt` vacío; ningún asset transmite información que no esté también en texto.
7. **Derechos:** anota licencia/condiciones de cada herramienta y de cada fuente. Nada sin derechos claros.
8. **Trazabilidad:** todo asset del sitio figura en el manifiesto; un fichero que no esté en el manifiesto no se usa.

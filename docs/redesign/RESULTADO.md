# Resultado V3 — integración en curso

La rama es `rediseno/v3`. Esta página contiene evidencia parcial real y no da por terminada la web. Los auditores antiguos se retiraron del alcance por instrucción expresa del usuario; no hay un PASS ficticio de esos scripts.

## Evidencia ya obtenida

- Copia literal: 22 archivos, 3.624.975 bytes, todas las huellas iguales a la carpeta de Kage proporcionada.
- Referencia frente a la web en vivo: control independiente aceptado en escritorio y móvil; mismos recursos, fuentes, composición y recorrido de cámara. Se preserva el informe y los controles del crítico.
- Tres paquetes base integrados mediante huellas: Tokens12, Navigation6 y Motion13. Son candidatos de código; no aceptación de las rutas.
- Home, Catálogo y SEO: 33 archivos copiados y 9 sustituidos/eliminados contra sus huellas de main. Revisión focal del productor: «✔ No ESLint warnings or errors». Queda revisión visual independiente.
- Higgsfield: OAuth completado; un intento de generación rechazado por requisito de plan; saldo observado 10→10. Ninguna compra ni crédito consumido en ese intento. Generación nativa de cinco ambientes; coste no expuesto por la herramienta.
- Backend, APIs, RLS, esquemas y autenticación no se han modificado.

## Salidas de instalación

Primeros dos intentos de `npm ci`: fallo EPERM en una biblioteca de dependencias bloqueada por procesos existentes. Se preservan sus logs. Se apartó únicamente la carpeta de dependencias y se instaló limpio, sin cerrar el editor.

Última ejecución limpia: exit 0.

```text
NPM_CI_MAIN_CLEAN_EXIT 0
added 942 packages in 7m
```

La ejecución imprimió avisos de paquetes heredados obsoletos y un aviso de Husky al ejecutarse desde el subdirectorio frontend. No se interpretan como una certificación de seguridad.

Herramientas nuevas de QA, exit 0:

```text
@playwright/test 1.57.0 (lock existente)
@axe-core/playwright 4.14.0
axe-core 4.14.0
prettier 3.6.2
QA_DEVDEPS_EXIT 0
```

Optimización de imágenes, exit 0 y carga nativa comprobada:

```text
IMAGE_OPTIMIZER_INSTALL_EXIT 0
sharp 0.35.5
vips 8.18.7
```

## Aceptación de rutas pendiente

| Ruta lógica (cinco idiomas) | Estado verificable actual | Pendiente |
| --- | --- | --- |
| Inicio | Candidato integrado | Navegador real, correcciones y tres rondas visuales |
| Productos | Candidato integrado; Próximamente preservado | Filtros, PDFs, estados, teclado y tres rondas |
| Acerca | Contenido y código en elaboración aislada | Integración, idiomas, recorridos y tres rondas |
| Lorca | Contenido y código en elaboración aislada | Integración, idiomas, recorridos y tres rondas |
| Calidad | Nueva historia aprobada antes de JSX | Integración, idiomas, recorridos y tres rondas |
| Reparto | Nueva historia aprobada antes de JSX | Integración, idiomas, recorridos y tres rondas |
| Preguntas frecuentes | 18 preguntas agrupadas en candidato | Integración, cinco idiomas y tres rondas |
| Contacto | Candidato con acciones de contacto veraces | Integración, estados y tres rondas |
| Privacidad | Cuerpos legales originales preservados | Integración de lectura, índice y comprobación literal |
| Condiciones | Cuerpos legales originales preservados | Integración de lectura, índice y comprobación literal |
| Área de clientes | Rediseño aislado en elaboración | Acceso, paneles con fixtures, cero intentos reales |
| Checkout | Borrador local sin pedido ni pago real | Integración y prueba de estados |
| Login de ejemplo | Candidato aislado | Integración y prueba interceptada de solicitudes |
| Offline | Estado en elaboración | Integración, salida y captura |
| 404, error, carga, layout | Estados en elaboración | Diseño, cobertura y capturas |

## Controles finales sin ejecutar todavía

Lint integrado, TypeScript integrado, build de producción, pruebas unitarias completas, recorridos Playwright, axe, consola y recursos, cinco tamaños, movimiento reducido, sin WebGL, sin JavaScript, Lighthouse, FPS y conservación final de archivos protegidos. El indicador de rAF observado en la referencia no equivale a FPS presentados por la GPU y no certifica el objetivo de rendimiento.

## Limitaciones abiertas

Next 14.2.15 procede de main y no se ha actualizado automáticamente por las reglas del repositorio. El aviso oficial recomienda al menos 14.2.35; la rama 14 ya no está dentro del soporte actual. No se ha desplegado ni se afirma preparación de producción. Las contradicciones de datos empresariales se registran en los documentos de contenido; no se convierten en nuevas promesas de servicio.

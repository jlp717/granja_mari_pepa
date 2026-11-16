# Motor Kage V3 — análisis y port

Fuente leída completa: README70, PROMPT34, index4821. SHA index `c8e06b90397ac246baf0ab6f32f5f6b570acc6fe03c7009f711b579fb72d9f49`. V3 parte de Main, sin código ni decisiones V2.

## Frontera literal

`engine/kage-engine.js` extrae las funciones de index1215–4140 y4439–4700. Se mantienen los generadores de superficies, construcción de mundo de control, geometría, cámara, pools, GLSL y post. React posee documento, navegación, palabras y capas: el motor no ejecuta wireNav/Reveals/Cursor/ForegroundStages ni cambia sus hijos. El store registra refs y conserva tres estados independientes: progreso de escena, rail e IO de foreground.

Vendor único canónico `/kage/secret-pathways-assets/three.min.js`, REVISION149. No otro Three ni dependencia runtime. Tipos públicos `.d.ts` acotan el JS literal. Los tests comparan AST contra la referencia original y las constantes, no una simulación del shader.

## Valores de fuente

| Dominio   | Literales                                                                             | Fuente index        |
| --------- | ------------------------------------------------------------------------------------- | ------------------- |
| Renderer  | LOWDPR1.4/HIGH1.8, exposición1, niebla.0168, cámara36/.35/220                         | 2264–2302           |
| Cámara    | 6waypoints, CatmullRom.42, rigdamp5.2, pointer2.6,dtcap.05                            | 4034–4084/4669–4687 |
| Post      | HalfFloat,4niveles,threshold.86,knee.50,bloom.34,blur5tap,up.52,exposure.62,grain.020 | 3928–4030           |
| Atmósfera | haze4/6,embers220/460,rain900high,ripples6/13,leaves110/260                           | 3075–3210           |
| Wisps     | finepointer90/190,distance3.4,step.030,max14/RAF,idle.42s                             | 3271–3380           |
| Cloth     | 96segments/97²nodes,dt1/120,wave30,stiff.55,gain5,bleed48                             | 3499–3504           |
| Calidad   | tras2.2s,40frames/.9s;scale*.85/*.64,min.55,recovery.08,MSAAthreshold.78              | 4583/4676–4682      |

## Adaptaciones explícitas

1. Un canvas ambiental persistente; las telas locales rawWebGL2 siguen siendo transitorias con sus GLSL y simulación originales. No se inventa compositor alternativo ni se impone un RAF único.
2. Boot dividido por jobs conserva pacing16ms pero no bloquea el HTML SSR. Root/Nav poseen loader; ready señala motor creado, no una transacción o respuesta de negocio.
3. Provider escucha reduced-motion, resize, visibility y context loss. Internal/static/reduced no inicia GL; salir de modo activo dispone las telas y pausa ambiente. Se conservan referencias de cámara entre rutas públicas.
4. Teardown libera geometría/materiales/texturas/targets, buffers/programas/VAO de Cloth, observers y eventos. AbortSignal invalida una inicialización que perdió su ruta, incluida la espera de fuentes. Una subida de textura Cloth fallida limpia GPU/observers antes de mantener la foto SSR. No hay reintento infinito ni servicios.
5. Control mantiene escena Kage original. Mundo GMP crea umbral arquitectónico, cámara fría, estanterías vacías, carretera/furgoneta sin marca y mesa de trabajo/utensilios. No genera productos, etiquetas, envases, precios o datos comerciales. Cámara, post y partículas siguen siendo el motor real.
6. Acento GMP HSL190/95%/40% autorizado por Root; geometría/disco adaptados. Control mantiene colores originales. Coeficientes del post intactos. Materiales neutrales reutilizan literales de Kage (steel0x525c60,dark0x141a1c); el pool de hojas de control conserva su física, pero GMP sustituye su mapa por texWisp y tinte bone0xdfe7e0 para motas/escarcha, sin modificar buildLeafFall ni su simulación.
7. Wordmark de control usa la familia real resuelta de next/font para conservar los glifos originales. GMP sólo carga `/kage/brand/logo-alpha.png`, logo real Main preparado por Art; no hay letras falsas ni fallback generado.
8. Sin GL/reduced se mantiene todo el contenido SSR y las láminas HTML; se oculta sólo el canvas ambiental. No se reutilizan URLs de assets planificados que todavía no existen.

## Contrato con páginas

`KageRoute`: routeId, mode journey|ambient|internal|static, world opcional gmp|control. `KageChapter`: id,scene0..5,title opcional. Mapping threshold0,cold1,catalog2,route3,table4,manifesto5. Registros toleran hijos antes de ruta y cleanup de una ruta antigua sin borrar la sucesora. Navigation es dueño de wrappers y UI, este nodo del registro/scroll/FGIO/cámara. El rail usa anchors[index] como Kage4337; los enlaces ordinarios conservan el offset40 de Kage4392.

Provider requiere registro journey/ambient y allowWebGL antes de cargar Three. El acceso y dashboard pueden compartir URL: la rama UI de Main decide modo sin cambiar auth/store/API.

## Límites actuales

Código candidato en construcción. Aún no hay PASS de browser, fps, assets, tipos o build hasta que Root estabilice dependencias y se ejecuten las comprobaciones. No se ha probado HTTP500 ni operaciones reales. Capturas y tres rondas serán revisadas por agentes distintos del constructor.

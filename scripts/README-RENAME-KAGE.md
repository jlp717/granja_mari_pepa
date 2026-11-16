# Renombrado Kage -> GMP

Script: `scripts/rename-kage-to-gmp.ps1`.
Objetivo: dejar el producto sin referencias a `Kage` en código, estilos, `data-*`,
assets, nombres de archivo/directorio e imports, **sin tocar** la copia literal
conservada por licencia y procedencia en `reference/kage-verbatim/`.

El script es **dry-run por defecto**: sin `-Apply` no escribe nada.

## Comandos

Desde la raíz del repositorio, en PowerShell:

```powershell
# 1) Dry-run: lista rutas a renombrar, archivos que cambiarían y residuos actuales
./scripts/rename-kage-to-gmp.ps1

# 2) Aplicar (pide confirmación por consola; escribe APPLY)
./scripts/rename-kage-to-gmp.ps1 -Apply

# 3) Aplicar sin confirmación (solo tras revisar el dry-run)
./scripts/rename-kage-to-gmp.ps1 -Apply -Force
```

Comportamiento en `-Apply`:

- Aborta si el árbol de git tiene cambios sin confirmar, salvo `-Force`.
- Aborta si algún destino de renombrado ya existe o dos renombrados colisionan.
- Usa `git mv` por entrada; si falla, `Move-Item`.
- Escribe texto en UTF-8 **sin BOM** y solo si el contenido cambia.

## Qué hace

| Fase | Acción |
| --- | --- |
| 1 | Renombra bajo `frontend/` toda ruta cuyo nombre contenga `kage` (sin distinguir mayúsculas). Procesa hijos antes que padres. |
| 2 | Reemplaza texto en `.ts .tsx .js .jsx .mjs .cjs .css .scss .json .md .html .yml .yaml .txt .ps1` bajo `frontend/`, `scripts/` (excepto este script y este README), más `README.md`, `CHANGELOG.md` y `.env.example` raíz. |
| 3 | Informa renombrados, archivos modificados, residuos `kage` en `frontend/` y verifica `package.json` (`name`) y `package-lock.json` (hash). |

Reglas de reemplazo, en este orden:

1. `/kage/` -> `/gmp/`
2. `KAGE` -> `GMP`
3. `Kage` -> `GMP`
4. `kage` suelto (sin letra o dígito delante) -> `gmp`

La cuarta regla evita tocar palabras que solo contienen la secuencia, como
`package`, `breakage` o `leakage`.

## Qué NO se renombra ni se reescribe

- `reference/kage-verbatim/`: copia literal autorizada. El token `kage-verbatim`
  se protege temporalmente durante el reemplazo, también dentro de tests que
  leen esa ruta (`source-parity.test.ts`, `world-gmp.test.js`).
- Líneas de procedencia en `README.md` y `CHANGELOG.md` que mencionan
  `verbatim`, `reference/`, `licencia`, `autorizada`, `procedencia` o
  `literal de`. Esas líneas se preservan y se cuentan en el informe.
- `package-lock.json`: excluido del reemplazo y verificado por hash SHA-256.
- Cachés y artefactos: `.git`, `node_modules`, `reference`, `dist`, `build`,
  `archivos_revisar`, `.next*`, `.cache*`, `playwright-report`, `test-results`.
- Binarios y assets: imágenes, `*.mp4`, `*.pdf`, `*.zip`, `*.woff2`, `*.ico`,
  fuentes y otros formatos no listados como texto.
- Vendor minificado (`frontend/public/pdf`, `*.min.js|mjs|cjs|css`).
- Este script y este README, que deben seguir describiendo el renombrado.

Los `.kage-cache/` y `.kage-worktrees/` de la raíz quedan fuera de alcance: son
artefactos locales ignorados por git y se eliminan a mano si estorban.

## Comprobaciones después de `-Apply`

```powershell
# Residuos reales (rg respeta .gitignore; ignora caches y dependencias)
rg -i --hidden kage frontend --glob '!**/node_modules/**' --glob '!**/.next*/**' --glob '!**/.cache*/**'
rg -i --hidden kage scripts README.md CHANGELOG.md .env.example

# Tipos y build
cd frontend
npx tsc --noEmit
npm test
npm run lint
npm run build

# Rutas y assets referenciados
cd ..
node scripts/check-assets.mjs
```

Resultado esperado:

- `rg` solo puede devolver líneas de procedencia de `README.md`/`CHANGELOG.md`
  y las menciones a `reference/kage-verbatim/`.
- `tsc --noEmit` sin errores: valida que los imports `@/components/gmp/...` y
  `@/lib/gmp-*.ts` resuelven tras el renombrado.
- `npm run build` compila con los assets servidos desde `/gmp/...`.
- Los tests `source-parity` y `world-gmp` siguen leyendo `reference/kage-verbatim/`.

## Limpieza de artefactos

Los directorios de caché y build conservan el nombre antiguo porque están
excluidos del script. Son descartables, pero el borrado es destructivo:
revísalos antes de eliminarlos.

```powershell
Get-ChildItem frontend -Force -Directory |
  Where-Object { $_.Name -like '.next*' -or $_.Name -like '.cache*' } |
  Select-Object FullName
```

Tras confirmar la lista:

```powershell
Remove-Item -Recurse -Force frontend/.next-kage-dev, frontend/.cache-kage-jest
```

`NEXT_DIST_DIR` pasa a documentarse como `.next-gmp-dev` /
`.next-gmp-production` en `README.md` y `.env.example`; `tsconfig.json` incluirá
`.next-gmp-dev/types/**/*.ts`. Un build limpio regenera esos directorios.

## Rollback

```powershell
git status
git diff --stat
git diff
```

- Cambios en archivos rastreados: `git restore -- .` (o `git checkout -- .`).
- Renombrados ya aplicados: aparecen como borrado + alta; `git restore` los
  devuelve y deja las rutas nuevas como no rastreadas.
- Directorios nuevos sin rastrear: `git clean -nd` para listarlos y
  `git clean -fd <ruta>` solo tras revisar. `git clean` es destructivo.

## Riesgos conocidos a revisar en el diff

1. **Copy de marca en datos**: `frontend/components/kage/catalogue/content/*.json`
   y `frontend/messages/*.json` pueden nombrar "Kage" como concepto editorial;
   el reemplazo los convierte a `GMP`. Revisar si el texto es de producto.
2. **Tokens CSS**: `--kage-*` pasa a `--gmp-*` en definición y usos a la vez. No
   existe hoy ningún `--gmp-*` previo que colisione, pero el diff lo confirma.
3. **Identificadores exportados**: `KageRuntimeProvider`, `createKageStore`,
   `kageFontFamilies`, `KAGE_SITE_URL`, etc. cambian de nombre de forma
   consistente; cualquier import externo al repo se rompería.
4. **Rutas públicas**: `/kage/...` -> `/gmp/...` debe coincidir con el
   renombrado de `public/kage`. Revisar `manifest.json`, `layout.tsx`,
   `next.config.js` (cabeceras de caché) y `AdminPanel.tsx`.
5. **Cachés con nombre antiguo**: si quedan `.next-kage-dev` o
   `.cache-kage-jest`, no afectan al build, pero ensucian búsquedas y espacio.

# CLAUDE.md — Granja Mari Pepa

## ⚠️ LEER PRIMERO

Este archivo ha sido actualizado. El rediseño sigue **DESIGN.md** y **REDESIGN_EXECUTION.md**, NO las reglas anteriores que referenciaban Joby Aviation como "dark cinematic". Ver DESIGN.md §3 para la corrección de ese diagnóstico.

---

## PROYECTO

- **Empresa**: Granja Maripepa, S.L. — Distribuidor HORECA (hostelería, restauración)
- **Fundación**: Lorca (Murcia), 1966
- **Productos**: congelados, refrigerados, helados, temperatura ambiente
- **Cliente**: chef, jefe de compras, restaurador, panadero, heladero (B2B)
- **Cobertura**: Murcia y Almería
- **Objetivo del rediseño**: Transición de "estética IA-template" a **editorial mediterráneo profesional** siguiendo DESIGN.md

## STACK DETECTADO

- **Framework**: Next.js 14.2.15 (App Router)
- **CSS**: Tailwind CSS 3.3.3 + tokens.css (creado en F1)
- **Animación**: Framer Motion + Lenis + IntersectionObserver (GSAP solo si necesario)
- **3D**: No usar (eliminado del scope — ver DESIGN.md §7.5)
- **UI**: shadcn/ui + componentes propios
- **i18n**: next-intl
- **Estado**: Zustand
- **Formularios**: react-hook-form + Zod
- **Testing**: Jest + Playwright
- **Backend**: Express.js separado en `backend/` (NO TOCAR)

## OFF LIMITS — PROHIBIDO MODIFICAR

| Archivo | Razón |
|---------|-------|
| `backend/server.js` | API handler |
| `backend/app/controllers/*` | API handlers |
| `backend/app/routes/*` | Server actions |
| `backend/app/middleware/authMiddleware.js` | Auth logic |
| `backend/app/middleware/securityMiddleware.js` | Security logic |
| `backend/app/config/*` | Environment config |
| `backend/app/utils/*` | Database queries |
| `CONTEXT.md` (backend contracts) | Shapes de datos, endpoints |
| `name` de inputs en forms | Matchean backend |

## REGLAS PERMANENTES

1. **NO modificar backend/** — el rediseño es frontend-only
2. **NO modificar CONTEXT.md** — los backend contracts son sagrados
3. **Usar tokens de `tokens.css`** (creado en F1) — cero hex inline
4. **NO Bootstrap, MUI, Chakra, Mantine** — solo shadcn/ui + componentes propios
5. **NO console.log/print** en producción
6. **NO secrets hardcodeados**
7. **NO `any`/`dynamic`/`Object`** sin justificación
8. **NO superar 500 LOC por archivo**
9. **Siempre `prefers-reduced-motion: reduce`** debe desactivar motion
10. **Cero overflow horizontal** en 360-2560px
11. **NO prompts vagos sin @prompt-engineer** — si el usuario es ambiguo, pasa por prompt-engineer primero

## ANTI-AI LOOP — filtro obligatorio en todo el código generado

Cualquier agente que genere código debe verificar que NO produce estos patrones:

| ❌ Prohibido | Ejemplo |
|-------------|---------|
| Gradientes blue→purple→pink | Botones, headings con bg gradient |
| Píldoras "✨ ⚡" | Badges decorativos con emojis |
| Glow shadows | `--shadow-glow-blue/green/purple` |
| Copy genérico | "máxima calidad", "soluciones integrales", "equipo de expertos" |
| Animaciones sin función | Loops infinitos, breathing, idle rotation |
| Iconos decorativos sin función | sparkles, estrellas, emojis decorativos |
| Glassmorphism sin propósito | `backdrop-filter: blur` decorativo |
| Preloader / splash screen | Pantalla de carga que retrasa el contenido |
| Cursor custom | Rompe expectativas del sistema en B2B |
| "✨ PREMIUM ⚡" | Lenguaje de marketing IA-template |

## REGLAS DE MOTION (desde MOTION_GUIDELINES.md)

1. **Cero GSAP en home** — usar CSS transitions + IntersectionObserver
2. **Cero R3F/Three.js** en `/`, `/contacto`, `/area-clientes`, `/lorca`
3. **Cero cursor custom** — no aporta en B2B
4. **Cero page preloader** — la home debe pintar < 2.5s
5. **Cero loops infinitos** (rotaciones, breathing pulses, glows)
6. **Cero parallax exagerado**
7. **Cero carruseles auto-rotantes**
8. **Cero sparkles, partículas, "magic" reveals**
9. **Cero tilt 3D en cards**
10. **Solo animar `transform` y `opacity`** — nunca `top`, `left`, `width`, `height`

## REGLAS DE DISEÑO (desde DESIGN.md)

1. **Paleta mediterránea**: crema `#F4EFE6`, paprika `#C24A1F`, oliva `#5C6238`, cielo `#9CB4C2`
2. **Tipografía**: Fraunces (display) + Inter (body)
3. **Cero gradientes blue→purple→pink**
4. **Cero píldoras "✨ ⚡"**
5. **Cero glow shadows** (`--shadow-glow-*`)
6. **Cero glassmorphism** (`--glass-*`)
7. **Una sola barra de navegación** (no triple chrome)
8. **Cada página tiene su color de capítulo** (ver DESIGN.md §9.4)

## SECUENCIA DE INICIO DE SESIÓN

Cada nueva sesión debe seguir este orden ESTRICTO:

```
PASO 1: CARGAR CONTEXTO
├── Leer .opencode/CLAUDE.md (reglas)
├── Leer memory MCP → fase actual, proyecto, gaps
└── Leer .opencode/SESSION_STARTUP.md (punto de entrada completo)

PASO 2: ENTENDER CONTEXTO
├── Leer .opencode/AGENTS.md (runbook del orquestador)
├── Leer .opencode/CONTEXT.md (backend contracts — NO TOCAR)
└── Leer .opencode/TASK_ROUTING.md (routing por tipo de tarea)

PASO 3: PROCESAR PROMPT
├── Leer TASK_ROUTING.md §1 → DETECTAR DOMINIO Y TIER
├── ¿Frontend redesign? → Leer DESIGN.md + REDESIGN_EXECUTION.md
├── ¿Vago/genérico? → @prompt-engineer con PROMPT_ENGINEER_BRIEF.md
├── ¿Seguridad? → @security-sentinel + @red-team (debate obligatorio)
├── ¿Arquitectura? → @oracle (Tier 3 obligatorio)
└── ¿Tarea concreta de otro dominio? → TASK_ROUTING.md §2 para ruta exacta

PASO 4: EJECUTAR
├── Leer TASK_ROUTING.md §2 para la ruta específica del dominio
├── Cargar skills según tipo de tarea
├── Delegar a agente(s) correcto(s)
├── Si Tier 2: skills/parallel-agents
├── Si seguridad: skills/agent-debate-protocol OBLIGATORIO
├── Si Tier 3: generar ADR con scripts/generate-adr.ps1
├── Cargar verification-before-completion
└── Verificar antes de reportar

PASO 5: REPORTAR
├── Decir: "Contexto cargado. ¿Qué necesitas?"
└── **NO** escanear el codebase — confiar en los documentos
```

## Patrones de Usuario (CRITICO — aplicar a TODO output)

- **Estandar**: Resultados excepcionales — pulidos, animados, con personalidad. Output generico inaceptable.
- **Odia**: Copy AI-loop ("equipo de expertos", "soluciones integrales"), emojis decorativos, plantillas genericas, bugs, fallos silenciosos.
- **Quiere**: Animaciones con proposito, estilo mediterraneo profesional (DESIGN.md), cero errores, verificacion antes de reportar.
- **Flujo**: Usuario usa SOLO el orquestador. NO pedir cambiar de agente/modo. Contexto recordado via memory MCP entre sesiones.
- **Tolerancia cero**: console.log en produccion, secrets hardcodeados, any/dynamic sin justificacion, pantallas en blanco, "listo" sin verificar.
- **Verificacion**: ALWAYS ejecutar tests/build antes de claimar completado. Reportar comando y resultado exacto.

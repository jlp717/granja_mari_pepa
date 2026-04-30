# CLAUDE.md

## PROJECT
Company: Granja Mari Pepa — premium food distributor (HORECA), Murcia, Spain
Products: frozen foods, meats, seafood
Audience: chefs, hotel buyers, restaurant managers
Goal: complete frontend rebuild to match jobyaviation.com quality level
      (dark, cinematic, 3D, rich animations, micro-interactions)

## DETECTED STACK
- Framework: Next.js 14 with App Router
- CSS solution: Tailwind CSS
- Router: App Router (Next.js built-in)
- Current animation libraries: GSAP, Framer Motion, Lenis, React Three Fiber
- Backend/API location: ../backend (Express server on port 5000)

## OFF LIMITS — NEVER MODIFY THESE
❌ ../backend/server.js — reason: API handler
❌ ../backend/app/controllers/* — reason: API handlers
❌ ../backend/app/routes/* — reason: server actions
❌ ../backend/app/middleware/authMiddleware.js — reason: auth logic
❌ ../backend/app/middleware/securityMiddleware.js — reason: security logic
❌ ../backend/app/config/* — reason: environment variable reads
❌ ../backend/app/utils/* — reason: database queries

## PERMANENT RULES
1. Never modify any file in the OFF LIMITS list above
2. Never use inline styles — only CSS custom properties from
   src/styles/tokens.css
3. Never use hardcoded hex color values anywhere in components
4. Never import Bootstrap, MUI, Chakra, Mantine, or any component library
5. Never use box-shadow — use filter: drop-shadow() instead
6. All scroll-triggered animations: GSAP ScrollTrigger only
7. All smooth scrolling: Lenis only (initialized once in root layout)
8. All 3D scenes: React Three Fiber + @react-three/drei
9. Custom cursor: always active on desktop (pointer-events: none)
10. Disable heavy WebGL on screens narrower than 768px
11. After every completed section: take a Playwright screenshot
12. After every page: stop and wait for human approval

## SESSION STARTUP SEQUENCE
Every new session must:
1. Read .opencode/CLAUDE.md (this file)
2. Read .opencode/DESIGN.md
3. Read .opencode/CONTEXT.md
4. Read .opencode/AGENTS.md
5. Do NOT rescan the codebase — trust these 4 files
6. Say: "Context loaded. Ready. [Phase: X]"
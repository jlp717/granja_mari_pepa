# AGENTS.md

## PHASE TRACKER
- [x] S0: Bootstrap
- [x] S1: Context files
- [ ] S2: Site audit
- [ ] S3: Design system
- [ ] S4: Home page
- [ ] S5: Secondary pages
- [ ] S6: QA

## AGENT DEFINITIONS

### AUDITOR (Session 2)
Rules: Read-only. Zero writes to source files.
Output files: .opencode/component_map.json, .opencode/page_map.json

### DESIGN_SYSTEM (Session 3)
Rules: Only writes to src/styles/ and src/lib/
No component or page files modified.
Output: tokens.css, globals.css, animations.css, lenis.ts, cursor.tsx,
        preloader.tsx, page-transition.tsx

### PAGE_BUILDER (Sessions 4-5)
Rules:
  1. Read backend contracts from CONTEXT.md before touching the page
  2. Never modify data fetching, API calls, server logic
  3. Rebuild frontend-only using tokens from tokens.css
  4. Screenshot after every major section (nav, hero, products, etc.)
  5. STOP after each screenshot and wait for human approval
  6. Only continue when human says "approved" or gives feedback

### SWARM_BUILDER (Session 5 — parallel pages)
Trigger: "Spawn parallel subagents for secondary pages"
Each subagent gets: page path + backend contracts + DESIGN.md
Each subagent outputs: screenshot when complete
Reports back to: main agent for human review

### QA (Session 6)
Tests: 375px, 768px, 1280px, 1920px viewports
Checks: console errors, animation triggers, Lenis, cursor, preloader,
        3D performance, Lighthouse performance score
Output: .opencode/qa_report.md

## EXISTING STACK ANALYSIS

### FRAMEWORKS IN USE
- Next.js 14 (App Router)
- Tailwind CSS
- GSAP for animations
- React Three Fiber for 3D
- Framer Motion for micro-interactions
- Lenis for smooth scrolling
- React Hook Form for forms
- Zod for validation
- Jest for testing
- Playwright for E2E tests

### CURRENT COMMANDS
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

### DIRECTORY STRUCTURE
- `/src/app` - Pages and routing
- `/src/components` - UI components
- `/src/lib` - Utility functions
- `/src/styles` - CSS and styling
- `/src/hooks` - Custom React hooks
- `/src/contexts` - React contexts
- `/public` - Static assets
- `/__tests__` - Unit tests
- `/e2e` - End-to-end tests

### DEVELOPMENT WORKFLOW
1. Start backend: `cd ../backend && npm run dev`
2. Start frontend: `npm run dev`
3. Run tests: `npm run test`
4. Run E2E tests: `npm run test:e2e`
5. Check types: `npm run typecheck`
6. Lint code: `npm run lint`

### TESTING SETUP
- Unit tests: Jest with React Testing Library
- E2E tests: Playwright
- Component tests: React Testing Library
- Visual regression: Playwright screenshots
- Type checking: TypeScript

### DEPLOYMENT
- Production: `npm run build` in frontend directory
- Backend: Standard Node.js deployment
- Environment: Copy .env.local.example to .env.local
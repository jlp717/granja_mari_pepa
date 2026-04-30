# AGENTS.md

## Project Structure
- **Frontend**: Next.js 14 application with App Router
- **Backend**: Express server with comprehensive security features
- **Database**: ODBC connection to legacy system
- **Architecture**: Monorepo with frontend and backend separation

## Key Commands

### Frontend (./frontend)
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run test` - Run unit tests with Jest
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run typecheck` - Check TypeScript types

### Backend (./backend)
- `npm run dev` - Start development server with nodemon on port 5000
- `npm start` - Start production server
- `npm test` - Run backend tests

## Development Workflow

1. **Start backend first**: `cd backend && npm run dev`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Run tests**: `npm run test` in both frontend and backend directories
4. **Build process**: 
   - Frontend: `npm run build` in frontend directory
   - Backend: Standard Node.js deployment

## Key Features

### Security System
The backend implements a comprehensive 10-layer security fortress:
1. IP detection and blocking
2. Bot and attack tool detection
3. HTTP header validation
4. Malicious payload detection (SQLi, XSS, etc.)
5. Honeypots for automated attack detection
6. Advanced CSRF protection with signed tokens
7. Complete data access auditing
8. Device fingerprinting
9. Granular rate limiting by user
10. Two-factor authentication support

### Environment Setup
1. Copy `.env.local.example` to `.env.local` in both frontend and backend directories
2. Configure ODBC connection in backend
3. Set up Google Maps API key for frontend (if needed)

### Testing
- Unit tests: `npm run test` in both frontend and backend
- End-to-end tests: `npm run test:e2e` in frontend
- Coverage: `npm run test:coverage` in frontend

### Internationalization
- Translation management via `npm run i18n:sync` in frontend

## Important Conventions
- All API routes in frontend are proxied to backend via Next.js rewrites
- Backend security features are extensive and should be maintained carefully
- Rate limiting is implemented at multiple levels
- Authentication uses JWT with both access and refresh tokens
- Cache invalidation endpoints require authentication
- PDF generation is rate limited due to resource intensity
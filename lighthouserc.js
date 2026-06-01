/**
 * Lighthouse CI Configuration — Performance Budgets
 * 
 * Estos son los umbrales de calidad NO-NEGOCIABLES.
 * Si un cambio no cumple estos mínimos, NO se mergea.
 * 
 * @see production-grade-checklist skill
 * @see QA_CHECKLIST.md
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'cd frontend && npm run start',
      startServerReadyPattern: 'started',
      url: [
        'http://localhost:3000/es',
        'http://localhost:3000/es/acerca',
        'http://localhost:3000/es/contacto',
        'http://localhost:3000/es/lorca',
        'http://localhost:3000/en',
      ],
      numberOfRuns: 3, // 3 runs para evitar outliers
      settings: {
        preset: 'desktop',
        throttling: {
          // Slow 4G simulation para métricas realistas
          rttMs: 150,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        // ═══ Core Web Vitals ═══
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],

        // Métricas específicas
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }],

        // ═══ Accesibilidad ═══
        'color-contrast': ['error', { minScore: 1 }],
        'aria-allowed-attr': ['error'],
        'aria-required-attr': ['error'],
        'aria-required-children': ['error'],
        'button-name': ['error'],
        'bypass': ['warn'],
        'document-title': ['error'],
        'html-has-lang': ['error'],
        'image-alt': ['error'],
        'label': ['error'],
        'link-name': ['error'],
        'meta-viewport': ['error'],
        'tabindex': ['warn'],
        'target-size': ['warn', { minScore: 0.8 }],

        // ═══ Performance ═══
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'server-response-time': ['warn', { maxNumericValue: 600 }],
        'unminified-javascript': ['error'],
        'unused-javascript': ['warn', { maxNumericValue: 100 }],
        'unused-css-rules': ['warn', { maxNumericValue: 50 }],
        'offscreen-images': ['error'],
        'uses-responsive-images': ['warn'],
        'uses-webp-images': ['warn'],
        'uses-optimized-images': ['warn'],
        'total-byte-weight': ['warn', { maxNumericValue: 2000000 }],
        'uses-text-compression': ['error'],
        'modern-image-formats': ['warn'],

        // ═══ Best Practices ═══
        'is-on-https': ['error'],
        'csp-xss': ['warn'],
        'charset': ['error'],
        'doctype': ['error'],
        'no-vulnerable-libraries': ['error'],
        'geolocation-on-start': ['warn'],
        'render-blocking-resources': ['warn', { maxNumericValue: 2 }],
        'uses-passive-event-listeners': ['warn'],

        // ═══ SEO ═══
        'meta-description': ['error'],
        'canonical': ['warn'],
        'font-display': ['error'],
        'hreflang': ['warn'],
        'structured-data': ['warn'],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
    },
  },
};

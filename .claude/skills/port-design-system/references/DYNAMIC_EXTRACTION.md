# Dynamic Extraction Reference

JavaScript snippets for Browser Mode extraction via `javascript_tool`. Execute these in order during Phase 3.

---

## Script 1: Token Extraction

Run this immediately after page load. Extracts all CSS custom properties, fonts, and global styles.

```javascript
// Execute via javascript_tool
(() => {
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);

  // Extract all CSS custom properties
  const cssVars = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === ':root' || rule.selectorText === 'html' || rule.selectorText === ':root, [data-theme]') {
          for (const prop of rule.style) {
            if (prop.startsWith('--')) {
              cssVars[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch(e) { /* cross-origin stylesheet, skip */ }
  }

  // Extract font families in use
  const fonts = new Set();
  document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,button,span,li,label').forEach(el => {
    fonts.add(getComputedStyle(el).fontFamily);
  });

  // Extract Google Fonts / Typekit links
  const fontLinks = [...document.querySelectorAll('link[href*="fonts.googleapis"], link[href*="typekit"], link[href*="fonts.adobe"]')]
    .map(l => l.href);

  // Extract common shadow values
  const shadows = new Set();
  document.querySelectorAll('*').forEach(el => {
    const s = getComputedStyle(el).boxShadow;
    if (s && s !== 'none') shadows.add(s);
  });

  // Extract border-radius values
  const radii = new Set();
  document.querySelectorAll('*').forEach(el => {
    const r = getComputedStyle(el).borderRadius;
    if (r && r !== '0px') radii.add(r);
  });

  // Extract transition values
  const transitions = new Set();
  document.querySelectorAll('*').forEach(el => {
    const t = getComputedStyle(el).transition;
    if (t && t !== 'all 0s ease 0s' && t !== 'none') transitions.add(t);
  });

  JSON.stringify({
    cssVars,
    fonts: [...fonts],
    fontLinks,
    shadows: [...shadows].slice(0, 15),
    radii: [...radii],
    transitions: [...transitions].slice(0, 20),
    bgColor: root.backgroundColor || body.backgroundColor,
    textColor: root.color || body.color
  }, null, 2);
})()
```

---

## Script 2: Animation Detection

Run after token extraction. Detects which animation libraries and systems are active.

```javascript
(() => {
  const result = {
    libraries: {},
    keyframes: [],
    scrollTriggers: 0,
    canvasElements: [],
    videoElements: [],
    intersectionObservers: false
  };

  // Detect GSAP
  if (window.gsap) {
    result.libraries.gsap = {
      version: window.gsap.version || 'detected',
      plugins: []
    };
    if (window.ScrollTrigger) {
      result.libraries.gsap.plugins.push('ScrollTrigger');
      try {
        result.scrollTriggers = ScrollTrigger.getAll().length;
      } catch(e) {}
    }
    if (window.ScrollSmoother) result.libraries.gsap.plugins.push('ScrollSmoother');
    if (window.SplitText) result.libraries.gsap.plugins.push('SplitText');
    if (window.DrawSVGPlugin) result.libraries.gsap.plugins.push('DrawSVG');
  }

  // Detect Three.js
  if (window.THREE) {
    result.libraries.three = { version: window.THREE.REVISION || 'detected' };
  }

  // Detect Lenis
  if (window.lenis || window.Lenis || document.querySelector('[data-lenis-prevent]')) {
    result.libraries.lenis = { detected: true };
  }

  // Detect Locomotive Scroll
  if (window.LocomotiveScroll || document.querySelector('[data-scroll-container]')) {
    result.libraries.locomotiveScroll = { detected: true };
  }

  // Detect Framer Motion (React-based, harder to detect)
  if (document.querySelector('[data-framer-component-type]') ||
      document.querySelector('[style*="will-change"]') ||
      document.querySelector('[data-projection-id]')) {
    result.libraries.framerMotion = { detected: true };
  }

  // Detect AOS
  if (document.querySelector('[data-aos]')) {
    result.libraries.aos = { detected: true };
  }

  // Extract @keyframes
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSKeyframesRule) {
          const steps = [];
          for (const kf of rule.cssRules) {
            steps.push({ offset: kf.keyText, styles: kf.style.cssText });
          }
          result.keyframes.push({ name: rule.name, steps });
        }
      }
    } catch(e) {}
  }

  // Canvas elements (potential WebGL/Three.js)
  document.querySelectorAll('canvas').forEach(c => {
    result.canvasElements.push({
      id: c.id || null,
      className: c.className || null,
      width: c.width,
      height: c.height,
      hasWebGL: !!(c.getContext('webgl') || c.getContext('webgl2'))
    });
  });

  // Video elements
  document.querySelectorAll('video').forEach(v => {
    result.videoElements.push({
      src: v.src || v.querySelector('source')?.src || null,
      autoplay: v.autoplay,
      muted: v.muted,
      loop: v.loop,
      playsInline: v.playsInline,
      hasScrollDrive: v.closest('[data-scroll]') !== null || v.style.willChange === 'transform'
    });
  });

  // Check for IntersectionObserver usage (indirect)
  result.intersectionObservers = document.querySelectorAll(
    '[data-inview], [data-visible], .is-visible, .in-view, .animate-on-scroll, [data-animate], .reveal'
  ).length > 0;

  JSON.stringify(result, null, 2);
})()
```

---

## Script 3: Scroll State Capture

Run at EACH scroll position during the scroll simulation. Captures the dynamic state at that point.

```javascript
((scrollY) => {
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  // Elements currently in viewport
  const visibleElements = [];
  document.querySelectorAll('section, [data-section], .section, [class*="section"], header, footer, [data-animate], [data-aos], [data-scroll], [class*="hero"], [class*="feature"], [class*="card"]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh && rect.bottom > 0) {
      const cs = getComputedStyle(el);
      visibleElements.push({
        tag: el.tagName,
        id: el.id || null,
        className: (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 5).join(' ') : null,
        rect: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) },
        opacity: cs.opacity,
        transform: cs.transform !== 'none' ? cs.transform : null,
        visibility: cs.visibility,
        clipPath: cs.clipPath !== 'none' ? cs.clipPath : null
      });
    }
  });

  // Video state
  const videos = [];
  document.querySelectorAll('video').forEach(v => {
    videos.push({
      currentTime: v.currentTime,
      duration: v.duration,
      paused: v.paused,
      progress: v.duration ? (v.currentTime / v.duration * 100).toFixed(1) + '%' : null
    });
  });

  // GSAP ScrollTrigger state (if available)
  let gsapState = null;
  if (window.ScrollTrigger) {
    try {
      const triggers = ScrollTrigger.getAll();
      gsapState = triggers.map(t => ({
        trigger: t.trigger?.className || t.trigger?.id || 'unknown',
        progress: (t.progress * 100).toFixed(1) + '%',
        isActive: t.isActive,
        direction: t.direction
      }));
    } catch(e) {}
  }

  JSON.stringify({
    scrollY,
    scrollPercent: ((scrollY / (document.documentElement.scrollHeight - vh)) * 100).toFixed(1) + '%',
    visibleElements,
    videos,
    gsapState,
    timestamp: Date.now()
  }, null, 2);
})(window.scrollY)
```

---

## Script 4: Hover State Diff

Run BEFORE and AFTER hovering on an element. Compare the two results to get the hover definition.

```javascript
// Pass a CSS selector to target the element
((selector) => {
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Element not found: ' + selector });

  const cs = getComputedStyle(el);

  // Also check ::before and ::after
  const before = getComputedStyle(el, '::before');
  const after = getComputedStyle(el, '::after');

  JSON.stringify({
    selector,
    styles: {
      transform: cs.transform,
      opacity: cs.opacity,
      backgroundColor: cs.backgroundColor,
      color: cs.color,
      boxShadow: cs.boxShadow,
      borderColor: cs.borderColor,
      borderRadius: cs.borderRadius,
      scale: cs.scale,
      filter: cs.filter,
      textDecoration: cs.textDecoration,
      outline: cs.outline,
      transition: cs.transition
    },
    pseudoBefore: {
      opacity: before.opacity,
      transform: before.transform,
      backgroundColor: before.backgroundColor
    },
    pseudoAfter: {
      opacity: after.opacity,
      transform: after.transform,
      backgroundColor: after.backgroundColor
    }
  }, null, 2);
})('SELECTOR_HERE')
```

**Usage pattern:**
1. Run Script 4 with target selector → save as `beforeState`
2. Use `computer` tool to `hover` over the element
3. Wait 300ms
4. Run Script 4 again → save as `hoverState`
5. Diff `beforeState` vs `hoverState` = hover transition definition

---

## Script 5: Dark Mode Token Extraction

Run after toggling dark mode to capture the dark palette.

```javascript
(() => {
  const darkVars = {};

  // Method 1: Class-based dark mode (html.dark or [data-theme="dark"])
  const html = document.documentElement;
  const isDark = html.classList.contains('dark') ||
                 html.getAttribute('data-theme') === 'dark' ||
                 html.getAttribute('data-mode') === 'dark';

  // Extract all current CSS variable values
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        // Dark mode rules
        const isDarkRule = rule.selectorText?.includes('.dark') ||
                          rule.selectorText?.includes('[data-theme="dark"]') ||
                          (rule instanceof CSSMediaRule && rule.conditionText?.includes('prefers-color-scheme: dark'));

        if (isDarkRule) {
          const targetRule = rule instanceof CSSMediaRule ? [...rule.cssRules] : [rule];
          for (const r of targetRule) {
            if (r.style) {
              for (const prop of r.style) {
                if (prop.startsWith('--')) {
                  darkVars[prop] = r.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        }
      }
    } catch(e) {}
  }

  // Also get computed values in current state
  const computed = {};
  const root = getComputedStyle(html);
  ['backgroundColor', 'color'].forEach(prop => {
    computed[prop] = root[prop];
  });

  // Body computed
  const body = getComputedStyle(document.body);
  computed.bodyBg = body.backgroundColor;
  computed.bodyColor = body.color;

  JSON.stringify({
    isDarkModeActive: isDark,
    darkModeMethod: html.classList.contains('dark') ? 'class' :
                    html.getAttribute('data-theme') ? 'data-attribute' : 'media-query',
    darkVars,
    computedInCurrentState: computed
  }, null, 2);
})()
```

---

## Script 6: Navigation & Sitemap Discovery

Run on the homepage to discover all navigable pages.

```javascript
(() => {
  const links = new Set();
  const origin = window.location.origin;

  // Nav links
  document.querySelectorAll('nav a[href], header a[href]').forEach(a => {
    const href = a.href;
    if (href.startsWith(origin) && !href.includes('#') && !href.includes('?')) {
      links.add(new URL(href).pathname);
    }
  });

  // Footer links
  document.querySelectorAll('footer a[href]').forEach(a => {
    const href = a.href;
    if (href.startsWith(origin) && !href.includes('#') && !href.includes('?')) {
      links.add(new URL(href).pathname);
    }
  });

  // Filter out utility pages
  const filtered = [...links].filter(path =>
    !path.includes('/legal') && !path.includes('/privacy') &&
    !path.includes('/terms') && !path.includes('/cookie') &&
    !path.includes('/sitemap') && !path.includes('/login') &&
    !path.includes('/signup') && !path.includes('/auth') &&
    path !== '/'
  ).sort();

  JSON.stringify({
    origin,
    homepagePath: '/',
    discoveredPaths: filtered,
    totalFound: filtered.length
  }, null, 2);
})()
```

---

## Scroll Simulation Procedure

Step-by-step procedure for the scroll simulation in Phase 3, Step 2:

```
1. Get page dimensions:
   javascript_tool → document.documentElement.scrollHeight
   
2. Calculate scroll stops:
   totalHeight = scrollHeight - viewportHeight
   stops = [0, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%] of totalHeight
   
3. For each stop position:
   a. javascript_tool → window.scrollTo({ top: POSITION, behavior: 'instant' })
   b. computer → wait 0.8s
   c. computer → screenshot
   d. javascript_tool → Scroll State Script (Script 3)
   e. Record: which sections visible, animation states, video times
   
4. Between stops, note:
   - New elements that appeared (scroll reveal)
   - Elements that changed opacity/transform (parallax)
   - Video progress changes (video scrub)
   - GSAP ScrollTrigger progress values
   - Any class additions (e.g., .is-visible, .active, .in-view)
   
5. Compile into SCROLL_BEHAVIOR_MAP:
   { page: url, sections: [
     { scrollPercent: "0-10%", elements: [...], animations: [...] },
     { scrollPercent: "10-20%", elements: [...], animations: [...] },
     ...
   ]}
```

---

## Important Notes

- **`querySelectorAll('*')` is expensive.** The token extraction scripts limit to 15-20 results for shadows/transitions to avoid freezing heavy pages.
- **Cross-origin stylesheets** will throw errors. The `try/catch` blocks handle this gracefully.
- **SPAs may need route changes** via `javascript_tool` instead of `navigate` if they use client-side routing with no full page reload.
- **Screenshots are your ground truth.** If JS extraction and visual evidence conflict, trust the screenshots.
- **Run scripts one at a time.** Don't combine them into a single mega-script — if one fails, you lose everything.
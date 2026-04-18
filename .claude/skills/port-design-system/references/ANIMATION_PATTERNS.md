# Animation Patterns Reference

How to implement common animation patterns across different libraries. Use this reference in Phase 4 (DS-First Mapping) to choose the right implementation for the user's stack.

---

## Decision Tree: Which Library to Use

```
Is the animation CSS-only achievable (hover, simple transition, keyframe)?
  → YES → Use CSS. No library needed.
  → NO ↓

Is framer-motion already in the project?
  → YES → Use framer-motion for scroll reveals, layout animations, page transitions.
  → NO ↓

Is the animation a complex timeline with scroll scrubbing?
  → YES → Recommend GSAP + ScrollTrigger (suggest install).
  → NO ↓

Is it a smooth scroll / scroll hijacking behavior?
  → YES → Recommend Lenis (suggest install).
  → NO ↓

Is it a 3D scene?
  → YES → Recommend Three.js or @react-three/fiber (suggest install).
  → NO ↓

Can it be done with IntersectionObserver + CSS classes?
  → YES → Use a custom hook + CSS transitions. Zero dependencies.
  → NO → Recommend framer-motion as the general-purpose solution.
```

**Golden rule:** Never add more than one new animation library per port. If the target site uses GSAP + Framer Motion + Lenis + Three.js, pick the one that covers the most effects and approximate the rest with CSS or the chosen library.

---

## Pattern 1: Scroll-Triggered Reveal

Elements fade/slide in when they enter the viewport.

### CSS-only (with IntersectionObserver hook)

```tsx
// hooks/useInView.ts
import { useEffect, useRef, useState } from 'react';

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: 0.2, ...options }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
```

```css
/* globals.css */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Framer Motion

```tsx
import { motion } from 'framer-motion';

function RevealOnScroll({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### GSAP + ScrollTrigger

```tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function RevealOnScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%" }
    });
  }, []);

  return <div ref={ref}>{children}</div>;
}
```

---

## Pattern 2: Staggered Children

Multiple elements animate in sequence with increasing delay.

### CSS-only

```css
.stagger-container > * {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease-out;
}
.stagger-container.visible > *:nth-child(1) { transition-delay: 0s; opacity: 1; transform: none; }
.stagger-container.visible > *:nth-child(2) { transition-delay: 0.1s; opacity: 1; transform: none; }
.stagger-container.visible > *:nth-child(3) { transition-delay: 0.2s; opacity: 1; transform: none; }
/* etc. — works for up to ~6 children, beyond that use JS */
```

### Framer Motion

```tsx
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

<motion.div variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }}>
  {items.map(i => <motion.div key={i} variants={item}>{i}</motion.div>)}
</motion.div>
```

---

## Pattern 3: Parallax Background

Background moves at a different speed than content.

### CSS-only (best for simple cases)

```css
.parallax-section {
  background-attachment: fixed;
  background-position: center;
  background-size: cover;
}
/* Note: background-attachment: fixed is not supported on iOS Safari.
   Fallback: just remove the parallax on mobile. */

@supports not (background-attachment: fixed) {
  .parallax-section { background-attachment: scroll; }
}
```

### CSS Transform approach (more compatible)

```tsx
function ParallaxBg() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="overflow-hidden relative h-[600px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ transform: `translateY(${offset * 0.3}px)` }}
      />
      <div className="relative z-10">{/* Content */}</div>
    </div>
  );
}
```

---

## Pattern 4: Smooth Scroll (Lenis)

Custom smooth scrolling behavior, often seen on award-winning sites.

```tsx
// app/providers.tsx (or layout.tsx)
'use client';
import Lenis from 'lenis';
import { useEffect } from 'react';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
```

**When to recommend Lenis**: Only when the target site has noticeably custom scroll physics (buttery, momentum-based, snapping). If the scroll feels normal, skip Lenis entirely.

---

## Pattern 5: Video Scrub on Scroll

Video playback controlled by scroll position (Apple-style).

### GSAP ScrollTrigger

```tsx
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  video.pause();

  ScrollTrigger.create({
    trigger: containerRef.current,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      if (video.duration) {
        video.currentTime = video.duration * self.progress;
      }
    }
  });
}, []);
```

### Simpler fallback (IntersectionObserver + requestAnimationFrame)

If GSAP is not in the project, suggest replacing video scrub with:
- A sequence of images that swap based on scroll position
- A CSS-animated illustration
- A static video that autoPlays on viewport entry

---

## Pattern 6: 3D Scene (Three.js / React Three Fiber)

### Simple approach with R3F

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      <OrbitControls enableZoom={false} autoRotate />
    </Canvas>
  );
}
```

**When NOT to recommend Three.js**: If the target has a simple decorative 3D element (rotating logo, floating shapes), suggest using CSS transforms + perspective instead. Reserve Three.js for actual complex 3D scenes (globes, product viewers, terrain).

### CSS 3D alternative

```css
.floating-shape {
  animation: float 6s ease-in-out infinite;
  transform-style: preserve-3d;
  perspective: 1000px;
}
@keyframes float {
  0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); }
  33% { transform: translateY(-10px) rotateX(5deg) rotateY(5deg); }
  66% { transform: translateY(5px) rotateX(-3deg) rotateY(-3deg); }
}
```

---

## Pattern 7: Page Transitions (Next.js App Router)

### Framer Motion with AnimatePresence

```tsx
// app/template.tsx
'use client';
import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### CSS-only (View Transitions API)

```css
/* globals.css */
@view-transition {
  navigation: auto;
}

::view-transition-old(root) {
  animation: fade-out 0.2s ease-out;
}
::view-transition-new(root) {
  animation: fade-in 0.3s ease-out;
}
```

**Note:** The View Transitions API has limited browser support as of 2025. Always provide a no-transition fallback.

---

## Pattern 8: Hover Micro-interactions

### Button lift + shadow

```css
.btn-hover-lift {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.btn-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgb(0 0 0 / 0.15);
}
.btn-hover-lift:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}
```

### Card border glow

```css
.card-glow {
  position: relative;
  transition: border-color 200ms ease;
}
.card-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  opacity: 0;
  transition: opacity 300ms ease;
  z-index: -1;
}
.card-glow:hover::before {
  opacity: 1;
}
```

---

## Pattern 9: Dark Mode Toggle

### Class-based (most common in Tailwind)

```tsx
// hooks/useTheme.ts
'use client';
import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = stored || preferred;
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
  };

  return { theme, toggle };
}
```

---

## Complexity Budget

When porting animations, allocate a complexity budget:
- **Simple port** (marketing site, blog): Max 1 animation library, 5-8 animated behaviors total
- **Medium port** (SaaS app, product site): Max 2 animation libraries, 10-15 animated behaviors
- **Complex port** (award-winning site, Awwwards): Max 3 animation libraries, 20+ behaviors, but warn the user about maintenance cost

Always present the complexity budget to the user and let them decide how much animation fidelity they want.
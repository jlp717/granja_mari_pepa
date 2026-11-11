# Build prompt

Create a single-page, cinematic WebGL experience called **Kage**: a five-chapter night walk through a fictional Kyoto mountain temple. The result should feel like an editorial art book moving through a live 3D world, not a conventional product landing page.

## Experience

- Use a fixed full-viewport Three.js canvas as the environmental layer.
- Build the temple, torii, stairs, lanterns, moon, terrain, trees, fog, rain, drifting leaves, embers, and atmosphere procedurally.
- Drive one continuous camera path from page scroll. Each section should feel like a new composed shot rather than a hard scene replacement.
- Add restrained bloom, film grain, vignette, depth haze, warm shoji light, cold moonlight, and a large vermilion moon.
- Keep the palette near-black, blue-charcoal, warm amber, bone white, and vermilion.

## Layout

- Structure the page as a hero, temple threshold, still gardens, sacred craft chapters, afterlight closing, and manifesto footer.
- Use oversized left-aligned English headings, large vertical Japanese display type, small technical labels, chapter numbers, fine rules, and generous negative space.
- Layer generated cinematic stills into editorial cards and use alpha-preserving WebP cutouts of grass, maple branches, sakura, stones, walls, ruins, bushes, hills, pines, and lanterns at the bottom of the active viewport.
- Foreground layers should arrive at full visual opacity, remain pinned while their section is active, then fade and blur away during the handoff.
- Center any play icon within the image frame itself, excluding the caption area.

## Motion

- Reveal headings word by word and supporting elements individually.
- Use slow, precise section transitions, subtle parallax, and eased camera interpolation.
- Let the navigation, chapter rail, cards, and foreground layers respond to the active section.
- Include reduced-motion behavior that preserves the complete reading experience.

## Interaction and quality

- Use a custom cursor only for fine pointer devices.
- Provide working anchor navigation, mobile navigation, responsive layouts, semantic landmarks, and accessible labels.
- Keep runtime assets local and use relative paths so the site works under a GitHub Pages repository subpath.
- Avoid frameworks, build tooling, analytics, trackers, remote fonts, placeholder imagery, generic glassmorphism, excessive glow, and decorative motion without narrative purpose.
- Verify at desktop and approximately 390 × 844, check all assets for 404s, parse every inline script, inspect the browser console, and test one complete scroll/navigation interaction before shipping.

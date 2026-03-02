# Experiential Design — High-Impact Interaction Systems

**Layer 3 skill.** Opt-in layer for immersive, award-caliber web experiences. Must respect Layer 1 (Engineering Discipline) and Layer 2 (Visual Identity) at all times.

## Purpose

Guide creation of websites that function as experiences — scroll-driven narratives, choreographed motion, spatial depth, and memorable interactions. This layer transforms a well-engineered, visually distinct site into something people remember.

---

## Activation

This skill activates **only when the project explicitly requires immersive design**: portfolio sites, agency showcases, product launches, brand experiences, editorial interactives, or any project where experiential quality is a stated goal. It does NOT activate for utility-focused applications, dashboards, documentation, or e-commerce with conversion goals.

**Before activating, confirm:**
1. The project brief calls for experiential or award-level design.
2. The added complexity is justified by project goals.
3. Performance targets can still be met.
4. Accessibility requirements can still be satisfied.

---

## Performance Targets

All experiential work must meet these thresholds:

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time | < 200ms |
| Animation frame rate | Consistent 60fps |

If experiential features push any metric beyond target, simplify or remove them. Performance overrides visual flair.

---

## Accessibility Requirements

Non-negotiable, regardless of experiential ambition:

1. **Respect `prefers-reduced-motion`.** All animations must degrade gracefully. Users who prefer reduced motion see instant state changes, not empty space.
2. **Maintain keyboard navigation.** Custom cursors, scroll hijacking, and hover effects must not break tab order or focus management.
3. **Preserve color contrast.** Atmospheric backgrounds, overlays, and blending modes must not reduce text contrast below WCAG AA.
4. **Provide text alternatives.** 3D scenes, particle effects, and visual narratives need descriptive fallback content.
5. **Test with screen readers.** Decorative animation layers must use `aria-hidden="true"` and `pointer-events: none`.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  gsap.defaults({ duration: 0, ease: 'none' });
  ScrollTrigger.defaults({ scrub: false });
}
```

---

## Scroll Choreography

### Principles

- Every scroll-triggered animation must communicate something: revealing content, guiding attention, creating spatial continuity, or reinforcing narrative.
- Never animate for decoration alone. If removing the animation loses nothing, it should not exist.
- Timing and easing are the difference between mechanical and organic motion.

### Techniques

| Technique | Use When | Implementation |
|---|---|---|
| Reveal on enter | Elements should appear progressively | GSAP ScrollTrigger, CSS `animation-timeline: scroll()` |
| Scrubbed animation | Animation progress should track scroll position exactly | GSAP ScrollTrigger with `scrub: true` |
| Parallax layers | Background/foreground depth is needed | CSS transforms at different scroll rates |
| Horizontal scroll sections | Content is best experienced as a lateral sequence | GSAP pinned horizontal scroll |
| Pinned sections | Content should layer or transform within a fixed viewport | GSAP ScrollTrigger with `pin: true` |

### Smooth Scrolling

Use Lenis or GSAP ScrollSmoother for inertial smooth scrolling. Native `scroll-behavior: smooth` is insufficient for experiential sites.

### Easing Reference

| Easing | Character | Use For |
|---|---|---|
| `power2.out` / `power3.out` | Natural deceleration | Most scroll reveals, general motion |
| `power2.inOut` | Smooth acceleration/deceleration | Page transitions, section changes |
| `back.out(1.7)` | Slight overshoot, then settle | Playful reveals, button interactions |
| `elastic.out(1, 0.3)` | Bouncy, energetic | Attention-drawing elements, magnetic effects |
| `expo.out` | Dramatic fast start, slow end | Hero entrances, dramatic reveals |

### Timing Standards

| Context | Duration |
|---|---|
| Stagger between sequential elements | 0.02–0.05s |
| Hover transitions | 0.2–0.4s |
| Page transitions | 0.6–1.2s |
| Scroll-triggered reveals | 0.8–1.5s (or scrubbed) |

**Rule:** Fast in, slow out. Most movements decelerate into their final position.

---

## Text Animation

Text is a design element, not just content. Typography animation creates rhythm and emphasizes narrative.

### Techniques

| Technique | Description | Library |
|---|---|---|
| Character stagger | Letters animate in sequentially | SplitType + GSAP |
| Word cascade | Words enter with varying delays | SplitType + GSAP |
| Line reveal | Each line slides independently from overflow-hidden wrapper | SplitType + GSAP |
| Scramble/decode | Text appears to decode character by character | GSAP TextPlugin |
| Kinetic typography | Text transforms with scroll or interaction | GSAP + ScrollTrigger |

### Implementation Pattern

```javascript
import SplitType from 'split-type';

const text = new SplitType('.hero-title', { types: 'lines, words, chars' });

// Wrap lines for clean overflow-hidden reveals
text.lines.forEach(line => {
  const wrapper = document.createElement('div');
  wrapper.style.overflow = 'hidden';
  line.parentNode.insertBefore(wrapper, line);
  wrapper.appendChild(line);
});

gsap.from(text.chars, {
  opacity: 0,
  y: 50,
  rotateX: -90,
  stagger: 0.02,
  duration: 0.8,
  ease: 'back.out(1.7)',
  scrollTrigger: {
    trigger: '.hero-title',
    start: 'top 80%'
  }
});
```

---

## Micro-Interactions

Every interactive element should respond to user input with satisfying feedback.

### Techniques

| Technique | Description |
|---|---|
| Magnetic buttons | Elements subtly pull toward the cursor on hover |
| Reveal on hover | Hidden content or visual effects appear on interaction |
| Morphing shapes | Elements transform shape during state changes |
| Ripple effects | Click feedback radiates from the interaction point |
| State machines | Complex multi-state transitions (idle → hover → active → complete) |

### Implementation Stack

| Complexity | Tool |
|---|---|
| Simple state changes | CSS transitions and `:hover`/`:focus`/`:active` |
| Programmatic control | GSAP |
| Complex state-based animation | Rive |
| After Effects exports | Lottie |

---

## Page Transitions

Seamless transitions between pages maintain immersion and create a native-app feel.

### Techniques

| Technique | Description |
|---|---|
| Crossfade with motion | Old page fades while new page slides in |
| Shared element transitions | Images or elements morph position/size between pages |
| Wipe/reveal | Content sweeps across the screen |
| Zoom transitions | Clicked target expands to fill the viewport |
| Overlay transitions | Colored layer sweeps before revealing new content |

### Implementation Stack

| Context | Tool |
|---|---|
| Multi-page sites | Barba.js + GSAP |
| React applications | Framer Motion + layout animations |
| Modern approach | View Transitions API (CSS + minimal JS) |
| Astro/SSG | View Transitions API (native support) |

---

## Custom Cursors

Replace the default cursor to reinforce brand and add tactile feedback. **Only on pointer devices** — always hide custom cursors on touch (`@media (pointer: coarse)`).

### Techniques

| Technique | Description |
|---|---|
| Follower cursor | Shape follows with slight lag (lerp interpolation) |
| Context-aware cursor | Changes appearance based on hovered element type |
| Magnetic cursor | Snaps toward interactive elements |
| Blob cursor | Morphing organic shape |
| Text cursor | Label that follows the pointer (e.g., "View", "Drag") |

### Rules

1. Custom cursors must not interfere with click targets or focus indicators.
2. Always use `mix-blend-mode: difference` or similar to ensure visibility on any background.
3. Always provide `@media (pointer: coarse) { .cursor { display: none; } }`.
4. Never replace the cursor on form inputs or text selection areas.

---

## 3D and WebGL

For spatial, immersive experiences. Use sparingly — 3D is computationally expensive.

### Implementation Stack

| Tool | Use Case |
|---|---|
| Three.js | Full 3D engine, maximum control |
| React Three Fiber | Three.js within React component model |
| Spline | No-code 3D design, embeddable scenes |

### Common Patterns

- 3D product viewers with orbit controls
- Particle systems responding to scroll or mouse position
- Shader effects (distortion, ripple, noise)
- 3D typography
- Environment scenes with scroll-driven camera movement

### Rules

1. Always provide 2D fallbacks for devices that cannot run WebGL.
2. Always lazy-load 3D scenes — never block initial page load.
3. Monitor GPU usage. If frame rate drops below 30fps on mid-range devices, simplify.
4. Use `requestAnimationFrame` and dispose of Three.js resources on unmount.

---

## Visual Atmosphere

### Grain/Noise Overlays

Add organic texture to prevent flat, digital-feeling surfaces:

```css
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,..."); /* SVG feTurbulence noise */
}
```

Rules: Always `pointer-events: none`. Always `aria-hidden="true"`. Opacity ≤ 0.05.

### Glassmorphism

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

Rules: Check that text on glass surfaces meets contrast ratios. Provide fallback for browsers without `backdrop-filter` support.

### Layered Shadows

```css
.elevated {
  box-shadow:
    0 1px 1px rgba(0,0,0,0.02),
    0 2px 2px rgba(0,0,0,0.02),
    0 4px 4px rgba(0,0,0,0.02),
    0 8px 8px rgba(0,0,0,0.02),
    0 16px 16px rgba(0,0,0,0.02);
}
```

---

## Loading Sequences

Experiential sites should have intentional loading experiences — not blank screens followed by a content flash.

### Pattern

1. Display a minimal, branded loading state (counter, progress bar, logo animation).
2. Orchestrate the reveal: loader exits, hero content enters, navigation fades in — all sequenced with staggered timing.
3. Loading sequences must not exceed 3 seconds on a fast connection. If assets take longer, reveal content progressively.

---

## Optimization Strategies

- Lazy-load all below-fold content and media.
- Preload critical assets (hero fonts, above-fold images).
- Use `will-change` sparingly — only on elements actively animating, remove after animation completes.
- Debounce scroll handlers or use passive event listeners.
- Prefer CSS transforms over layout-triggering properties (`top`, `left`, `width`, `height`).
- Compress all media. Use modern formats (WebP, AVIF for images; woff2 for fonts).
- Use `requestAnimationFrame` for all JavaScript-driven animation loops.

---

## When NOT to Use This Layer

This skill is inappropriate for:

- **E-commerce with conversion goals.** Simplicity drives sales.
- **Information-dense applications.** Clarity over creativity.
- **Accessibility-critical contexts.** Heavy animation can be exclusionary even with reduced-motion support.
- **Limited timeline or budget.** Experiential design requires significant implementation and testing time.
- **Content-first sites.** Blogs, documentation, and wikis need reading comfort, not scroll choreography.

When in doubt, omit Layer 3. A well-executed Layer 1 + Layer 2 site is better than a poorly executed experiential site.

---

## Constraint

This layer operates within strict boundaries:

1. **Layer 1 overrides everything.** Semantic HTML, accessibility, and performance requirements cannot be relaxed for experiential effect.
2. **Accessibility overrides animation.** If an animation cannot be made accessible, remove it.
3. **Performance overrides visual flair.** If a technique causes jank or slow loads, simplify it.
4. **Simplicity overrides novelty** unless the project brief explicitly demands immersion.

Experiential design earns its complexity by enhancing — never degrading — the user's experience.

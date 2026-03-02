# Experiential Design — Code Patterns Reference

**Companion to [experiential-design.md](experiential-design.md).** Production-ready code patterns for Layer 3 techniques. Copy, adapt, and compose these patterns — do not use them unchanged without fitting them to the project's visual identity.

---

## Dependency Stack

| Purpose | Primary Tool | Alternative |
|---|---|---|
| Animation engine | GSAP + ScrollTrigger | CSS `animation-timeline: scroll()` |
| Smooth scrolling | Lenis | GSAP ScrollSmoother |
| Text splitting | SplitType | Splitting.js |
| Page transitions | Barba.js + GSAP | View Transitions API |
| 3D | Three.js / React Three Fiber | Spline (embeddable) |
| State-based animation | Rive | Lottie |

---

## Smooth Scroll Setup (Lenis + GSAP)

```javascript
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

---

## Scroll Reveal System

A data-attribute-driven reveal system. Apply `data-reveal` attributes in HTML; initialize once in JavaScript.

```javascript
function initReveals() {
  gsap.registerPlugin(ScrollTrigger);

  // Fade up
  gsap.utils.toArray('[data-reveal="fade-up"]').forEach(el => {
    gsap.from(el, {
      y: 60, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Fade in
  gsap.utils.toArray('[data-reveal="fade"]').forEach(el => {
    gsap.from(el, {
      opacity: 0, duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Stagger children
  gsap.utils.toArray('[data-reveal="stagger"]').forEach(container => {
    gsap.from(container.children, {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: container, start: 'top 80%' }
    });
  });

  // Scale in
  gsap.utils.toArray('[data-reveal="scale"]').forEach(el => {
    gsap.from(el, {
      scale: 0.8, opacity: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
}
```

**HTML usage:**
```html
<div data-reveal="fade-up">Content</div>
<ul data-reveal="stagger"><li>A</li><li>B</li><li>C</li></ul>
```

---

## Staggered Text Reveal

```javascript
import SplitType from 'split-type';

function animateText(selector, options = {}) {
  const config = {
    y: 100, opacity: 0, duration: 0.8,
    stagger: 0.02, ease: 'power3.out', delay: 0,
    ...options
  };

  const split = new SplitType(selector, { types: 'lines, words, chars' });

  // Wrap lines for overflow-hidden clip effect
  split.lines.forEach(line => {
    const wrapper = document.createElement('div');
    wrapper.style.overflow = 'hidden';
    line.parentNode.insertBefore(wrapper, line);
    wrapper.appendChild(line);
  });

  gsap.from(split.chars, {
    y: config.y,
    opacity: config.opacity,
    duration: config.duration,
    stagger: config.stagger,
    ease: config.ease,
    delay: config.delay,
    scrollTrigger: { trigger: selector, start: 'top 80%' }
  });
}
```

---

## Magnetic Button

```javascript
class MagneticButton {
  constructor(el, strength = 0.5) {
    this.el = el;
    this.strength = strength;
    this.rect = null;

    this.el.addEventListener('mouseenter', () => {
      this.rect = this.el.getBoundingClientRect();
    });
    this.el.addEventListener('mousemove', (e) => this.onMove(e));
    this.el.addEventListener('mouseleave', () => this.onLeave());
  }

  onMove(e) {
    const x = (e.clientX - this.rect.left - this.rect.width / 2) * this.strength;
    const y = (e.clientY - this.rect.top - this.rect.height / 2) * this.strength;
    gsap.to(this.el, { x, y, duration: 0.3, ease: 'power2.out' });
  }

  onLeave() {
    gsap.to(this.el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  }
}

document.querySelectorAll('[data-magnetic]').forEach(el => new MagneticButton(el));
```

---

## Custom Cursor with Context States

```css
.cursor {
  position: fixed;
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  transition: width 0.3s ease, height 0.3s ease;
}

.cursor--hover {
  width: 60px;
  height: 60px;
  border-width: 1px;
}

.cursor--label {
  width: 100px;
  height: 100px;
}

.cursor--label::after {
  content: attr(data-label);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (pointer: coarse) {
  .cursor { display: none; }
}
```

```javascript
const cursor = document.querySelector('.cursor');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function render() {
  cursorX += (mouseX - cursorX) * 0.15;
  cursorY += (mouseY - cursorY) * 0.15;
  cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px)`;
  requestAnimationFrame(render);
}
render();

// Context states
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
});

document.querySelectorAll('[data-cursor-label]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('cursor--label');
    cursor.dataset.label = el.dataset.cursorLabel;
  });
  el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--label'));
});
```

---

## Parallax Image

```css
.parallax-container {
  overflow: hidden;
  position: relative;
}

.parallax-image {
  width: 100%;
  height: 120%;
  object-fit: cover;
  will-change: transform;
}
```

```javascript
document.querySelectorAll('.parallax-container').forEach(container => {
  const image = container.querySelector('.parallax-image');
  gsap.to(image, {
    y: '-10%',
    ease: 'none',
    scrollTrigger: {
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });
});
```

---

## Horizontal Scroll Section

```css
.horizontal-scroll { overflow: hidden; }

.horizontal-track {
  display: flex;
  width: fit-content;
}

.horizontal-panel {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```javascript
const track = document.querySelector('.horizontal-track');

gsap.to(track, {
  x: () => -(track.scrollWidth - window.innerWidth),
  ease: 'none',
  scrollTrigger: {
    trigger: '.horizontal-scroll',
    pin: true,
    scrub: 1,
    end: () => '+=' + track.scrollWidth
  }
});
```

---

## Page Transition (Barba.js + GSAP)

```javascript
import barba from '@barba/core';
import gsap from 'gsap';

barba.init({
  transitions: [{
    name: 'fade',
    leave(data) {
      return gsap.to(data.current.container, {
        opacity: 0, y: -50, duration: 0.5, ease: 'power2.inOut'
      });
    },
    enter(data) {
      return gsap.from(data.next.container, {
        opacity: 0, y: 50, duration: 0.5, ease: 'power2.out'
      });
    }
  }]
});
```

---

## Loading Sequence

```javascript
function initLoader() {
  const loader = document.querySelector('.loader');
  const counter = document.querySelector('.loader-counter');
  const tl = gsap.timeline();

  const progress = { value: 0 };
  gsap.to(progress, {
    value: 100,
    duration: 2,
    ease: 'power2.inOut',
    onUpdate: () => {
      counter.textContent = Math.round(progress.value) + '%';
    }
  });

  tl.to(loader, {
    yPercent: -100, duration: 0.8, ease: 'power3.inOut', delay: 2.2
  })
  .from('.hero-title', {
    y: 100, opacity: 0, duration: 1, ease: 'power3.out'
  }, '-=0.3')
  .from('.hero-subtitle', {
    y: 50, opacity: 0, duration: 0.8, ease: 'power3.out'
  }, '-=0.6')
  .from('.nav', {
    y: -50, opacity: 0, duration: 0.6, ease: 'power2.out'
  }, '-=0.4');
}

document.addEventListener('DOMContentLoaded', initLoader);
```

---

## Reduced Motion Guard

Wrap all initialization in a motion preference check:

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Show all content immediately, skip animation setup
  gsap.set('[data-reveal]', { opacity: 1, y: 0, scale: 1 });
} else {
  initReveals();
  initLoader();
  // ... other animation initialization
}
```

---

## Grain/Noise Overlay (CSS)

```css
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.grain::before {
  content: '';
  position: absolute;
  inset: -100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.035;
  animation: grain 8s steps(10) infinite;
}

@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -25%); }
  40% { transform: translate(-5%, 25%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 15%); }
  80% { transform: translate(3%, 35%); }
  90% { transform: translate(-10%, 10%); }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .grain::before { animation: none; }
}
```

**HTML:** `<div class="grain" aria-hidden="true"></div>`

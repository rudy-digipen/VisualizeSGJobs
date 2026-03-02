# Frontend Web Development Guidelines

This project enforces a layered skill system for frontend development. Claude must follow these skills in priority order when generating or modifying frontend code.

---

## Skill Architecture

Skills are organized into three layers. Higher layers depend on lower layers. Lower layers have higher priority.

```
Layer 3 — Experiential Design (opt-in, highest complexity)
Layer 2 — Visual Identity (active when UI is visible)
Layer 1 — Engineering Discipline (always active, highest priority)
```

---

## Layer 1 — Engineering Discipline (Always Active)

Foundation rules that apply to all frontend code. These cannot be overridden by any other layer.

### Skill Files

| Skill | Purpose |
|---|---|
| [Just Use HTML](.claude/skills/just-use-html.md) | Prefer native HTML elements. Use semantic structure. Use `<button>`, `<dialog>`, `<details>`, `<datalist>`, `<table>`, `popover` before reaching for JavaScript or component libraries. |
| [Just Use CSS](.claude/skills/just-use-css.md) | Prefer native CSS. Use Grid, Flexbox, custom properties, container queries, nesting, scroll-driven animations, and modern features before reaching for Tailwind, Bootstrap, or CSS-in-JS. |
| [Just Use React](.claude/skills/just-use-react.md) | Use frameworks only when complexity demands it. Static sites and simple pages do not need React. Complex applications with state management, real-time data, and reusable components do. |
| [Just Use Angular](.claude/skills/just-use-angular.md) | If Angular is the chosen framework, use modern patterns: standalone components, signals, `@if`/`@for` control flow, `inject()`. |

### Decision Hierarchy

When writing frontend code, follow this order:

1. **Can plain HTML do this?** Use it.
2. **Can CSS handle it?** Use it.
3. **Does this need a sprinkle of JS?** Add minimal vanilla JS or lightweight libraries (htmx, Alpine.js).
4. **Does this need a framework?** Use one — but respect HTML and CSS fundamentals inside it.

---

## Layer 2 — Visual Identity (Active When UI Is Visible)

Applies whenever Claude generates visible interface elements. Prevents generic, template-grade output.

### Skill Files

| Skill | Purpose |
|---|---|
| [Visual Identity](.claude/skills/visual-identity.md) | Anti-generic design enforcement. Distinctive typography, intentional color systems, considered layout, design direction selection. Includes font recommendations, pairing guides, and the anti-slop checklist. |

### Activation

Activates for: landing pages, dashboards, portfolios, game interfaces, marketing sites, component libraries, or any project with visible UI.

Does NOT activate for: APIs, CLIs, build tooling, or purely structural work.

### Constraint

All Layer 2 decisions must satisfy Layer 1 requirements. Typography must meet contrast ratios. Color systems must support `prefers-color-scheme`. Layouts must use semantic HTML. Font loading must not block rendering.

---

## Layer 3 — Experiential Design (Opt-In)

High-impact layer for immersive, award-caliber web experiences. Only activates when explicitly requested or when the project brief demands experiential quality.

### Skill Files

| Skill | Purpose |
|---|---|
| [Experiential Design](.claude/skills/experiential-design.md) | Scroll choreography, advanced animation systems, page transitions, custom cursors, 3D/WebGL, micro-interactions, loading sequences. Includes performance targets and accessibility requirements. |
| [Experiential Design Patterns](.claude/skills/experiential-design-patterns.md) | Production-ready code patterns for GSAP, Lenis, SplitType, Barba.js, custom cursors, parallax, horizontal scroll, and more. |

### Activation

Activates for: portfolio sites, agency showcases, product launches, brand experiences, editorial interactives, or any project where experiential quality is a stated goal.

Does NOT activate for: utility applications, dashboards, documentation, e-commerce with conversion goals, content-first sites.

### Constraints

1. Must justify added complexity against project goals.
2. Must meet performance targets (FCP < 1.5s, LCP < 2.5s, TBT < 200ms, 60fps animations).
3. Must provide `prefers-reduced-motion` fallbacks for all animation.
4. Must not violate Layer 1 accessibility or semantic HTML rules.

---

## Conflict Resolution

If two rules from different layers conflict:

1. **Engineering Discipline overrides everything.** Semantic HTML, accessibility, and performance are non-negotiable.
2. **Accessibility overrides animation.** If a technique cannot be made accessible, remove it.
3. **Accessibility overrides visual flair.** If a visual treatment reduces contrast or readability, fix it.
4. **Performance overrides visual flair.** If a technique causes jank or slow loads, simplify it.
5. **Simplicity overrides novelty** unless the project brief explicitly demands immersion.

---

## Universal Rules

These apply across all layers, all projects, all frameworks:

- Always use semantic HTML, even inside framework components.
- Always write accessible code (labels, ARIA, focus management, keyboard navigation).
- Always respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Never install a package for something that takes a few lines of native code.
- Never create `<div>` soup. Structure matters.
- Never use `!important` unless overriding third-party styles.
- Never ignore performance. Measure, then optimize.

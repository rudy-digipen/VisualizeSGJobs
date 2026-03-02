# Just Use CSS - Native CSS First

Inspired by [justfuckingusecss.com](https://justfuckingusecss.com/)

## Core Philosophy

CSS is powerful, mature, and does not need a framework to look good. Before reaching for Tailwind, Bootstrap, Material UI, or any CSS-in-JS solution, **use plain CSS**. Modern CSS has layout systems, custom properties, animations, container queries, and more. A CSS reset/normalize + your own styles is all most projects need.

## Rules for Claude

### ALWAYS prefer native CSS over framework utilities

- Use CSS Grid and Flexbox for layout. Not Bootstrap's grid, not utility classes.
- Use CSS custom properties (`--variable-name`) for theming and reusable values. Not SASS variables or JS theme providers.
- Use `@media` queries for responsive design. Not JS-based breakpoint hooks.
- Use `@container` queries when component-level responsiveness is needed.
- Use CSS `color-scheme: light dark` and `prefers-color-scheme` for dark mode before building JS-based theme togglers.
- Use CSS `@layer` for managing specificity across stylesheets.
- Use CSS nesting (now native) instead of preprocessors like SASS/LESS just for nesting.

### ALWAYS use modern CSS layout

- Use `display: grid` for two-dimensional layouts (rows AND columns).
- Use `display: flex` for one-dimensional layouts (row OR column).
- Use `gap` for spacing between flex/grid children. Not margins on children.
- Use `place-items`, `place-content`, `place-self` for alignment shorthand.
- Use `auto-fit` and `auto-fill` with `minmax()` for responsive grids without media queries.
- Use `aspect-ratio` for maintaining proportions.
- Use `min()`, `max()`, `clamp()` for fluid, responsive sizing.

### ALWAYS use CSS for these (not JavaScript)

- **Hover/focus/active states**: Use `:hover`, `:focus`, `:focus-visible`, `:active` pseudo-classes.
- **Transitions**: Use `transition` for smooth state changes.
- **Animations**: Use `@keyframes` and `animation` for complex animations. Use `transition` for simple ones.
- **Visibility toggling**: Use `:checked`, `:target`, or the `[open]` attribute with `<details>`.
- **Dark mode**: Use `prefers-color-scheme` media query.
- **Reduced motion**: Always respect `prefers-reduced-motion`.
- **Scroll behavior**: Use `scroll-behavior: smooth`, `scroll-snap-type`, `scroll-margin-top`.
- **Tooltips and popovers**: Use `[popover]` + CSS for styling, or `title` for simple tooltips.
- **Sticky elements**: Use `position: sticky`. Not scroll event listeners.
- **Truncation**: Use `text-overflow: ellipsis` with `overflow: hidden`. Use `-webkit-line-clamp` for multi-line.
- **Counters**: Use `counter-reset` and `counter-increment` for automatic numbering.

### ALWAYS use a CSS reset or normalize

- Use [modern-normalize](https://github.com/sindresorhus/modern-normalize) or a similar CSS reset.
- This ensures cross-browser consistency without the bloat of a full framework.
- A reset + your own styles is cleaner and more maintainable than any framework.

### ALWAYS write maintainable CSS

- Use meaningful class names that describe the component or purpose, not the appearance (`.card-header`, not `.blue-text-bold`).
- Use CSS custom properties for colors, spacing, font sizes, and other design tokens.
- Keep specificity low. Prefer class selectors. Avoid deeply nested selectors.
- Use logical properties (`margin-inline`, `padding-block`, `inset-inline-start`) for internationalization support.
- Group related styles together. Comment sections if the file grows.
- Use relative units (`rem`, `em`, `%`, `vw`, `vh`, `dvh`) over fixed pixels for responsive design.
- Use `ch` units for max-width on text content (~60-80ch for readability).

### NEVER do these

- NEVER use `!important` unless overriding third-party styles you cannot control.
- NEVER use inline styles (`style=""`) in production code, except for truly dynamic values (e.g., calculated positions).
- NEVER use CSS frameworks (Tailwind, Bootstrap) just because "it's faster." Learning CSS is faster in the long run.
- NEVER use JavaScript for styling that CSS can handle (hover effects, transitions, media queries, scroll snapping).
- NEVER use `float` for layout. It's 2026. Use Grid or Flexbox.
- NEVER hardcode colors and spacing values. Use custom properties.
- NEVER ignore `prefers-reduced-motion`. Wrap animations in `@media (prefers-reduced-motion: no-preference)`.
- NEVER set `outline: none` without providing an alternative focus indicator. Accessibility matters.
- NEVER use pixel values for font sizes. Use `rem`.

### Before adding a CSS dependency, ask yourself

1. Can native CSS do this? (It probably can. CSS has Grid, Flexbox, custom properties, container queries, nesting, layers, scroll-driven animations, and more.)
2. Am I reaching for a framework because I don't know the CSS feature, or because I actually need it?
3. Will this dependency still be maintained in 3 years? CSS will be.

### Modern CSS features to prefer

- **CSS Nesting**: `& .child { }` is native now.
- **Container Queries**: `@container` for component-level responsive design.
- **`:has()` selector**: Parent selector. Style parents based on children.
- **`color-mix()`**: Blend colors without preprocessors.
- **`@layer`**: Control cascade ordering.
- **`@scope`**: Scope styles to DOM subtrees.
- **View Transitions API**: CSS + minimal JS for page transitions.
- **Scroll-driven animations**: `animation-timeline: scroll()` for scroll-linked effects.
- **`light-dark()` function**: Shorthand for light/dark mode values.
- **Subgrid**: `grid-template-rows: subgrid` for aligning nested grids.

## The Bottom Line

A beautiful, responsive, accessible website can be built with a CSS reset and ~100 lines of well-written CSS. CSS is not hard. It is powerful. Use the platform. Stop outsourcing your styles to JavaScript.

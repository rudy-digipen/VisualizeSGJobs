# Just Use React (or a Modern Framework) - When Complexity Demands It

Inspired by [justfuckingusereact.com](https://justfuckingusereact.com/)

## Core Philosophy

HTML and CSS are the foundation, and you should use them first. But when your application has **real complexity** -- non-trivial state management, dynamic data, real-time updates, reusable component systems, team collaboration at scale -- then a modern framework like React (or Vue, Svelte, Solid, etc.) is the right tool. The goal is **choosing the right tool for the job**, not dogmatic purity.

## Rules for Claude

### KNOW when a framework is justified

A framework is the right choice when the project involves:
- Non-trivial client-side state (filters, user sessions, real-time data, multi-step forms).
- Reusable UI components that must stay consistent across many views.
- Single Page Application (SPA) behavior or app-like navigation.
- Team collaboration requiring shared patterns and conventions.
- Complex interactivity that would become spaghetti code in vanilla JS.
- A rich ecosystem of battle-tested libraries (routing, state management, testing, a11y).

### KNOW when a framework is NOT justified

Do NOT use a framework for:
- Static brochure sites, landing pages, blogs, documentation.
- Simple forms or contact pages.
- Content-first websites where HTML + CSS + a sprinkle of JS is sufficient.
- Prototypes or MVPs where plain HTML will validate the idea faster.
- Anything where the overhead of a build system adds complexity without benefit.

### ALWAYS follow framework best practices when using one

#### React Specific
- Use functional components with hooks. Not class components.
- Use `useState`, `useReducer`, `useContext` for state. Escalate to external state management (Zustand, Jotai, Redux Toolkit) only when context is insufficient.
- Use `useMemo` and `useCallback` only when there is a measured performance problem. Do not prematurely optimize.
- Use `React.lazy()` and `Suspense` for code splitting.
- Use React Server Components and SSR/SSG (via Next.js, Remix, etc.) when SEO and initial load performance matter.
- Use `key` props correctly on lists. Never use array index as key if the list can reorder.
- Keep components small and focused. Extract when a component does more than one thing.

#### General Framework Practices
- **Components are king**: Build reusable, encapsulated components. Build once, use everywhere, update in one place.
- **Props down, events up**: Data flows down through props. Child components communicate up via callbacks/events.
- **Separate concerns**: Keep presentation, logic, and data fetching in distinct layers.
- **Type your code**: Use TypeScript. Catch errors at compile time, not in production.
- **Test your components**: Write unit tests for logic, integration tests for user flows.

### ALWAYS respect the HTML/CSS foundation even inside a framework

- Frameworks do NOT excuse bad HTML. Use semantic elements inside your components.
- Frameworks do NOT excuse bad CSS. Use proper stylesheets, CSS modules, or scoped styles. Not inline styles everywhere.
- Frameworks do NOT excuse ignoring accessibility. Use proper ARIA attributes, focus management, and keyboard navigation.
- A `<button>` is still a `<button>` inside React. A `<dialog>` is still a `<dialog>` inside Vue. Use native elements first.
- Use the framework's ecosystem for what it's good at (state, routing, data fetching), not for replacing what the platform already provides.

### ALWAYS consider performance

- Use code splitting and lazy loading. Do not ship the entire app as one bundle.
- Use SSR or SSG when appropriate for initial load and SEO.
- Minimize re-renders. Understand your framework's reactivity model.
- Use the browser's built-in features (Intersection Observer, requestAnimationFrame) instead of JS polyfills.
- Measure before optimizing. Use browser DevTools, Lighthouse, and framework-specific profilers.

### NEVER do these

- NEVER use a framework just because "everyone uses it." Have a reason.
- NEVER install a package for something that takes 10 lines of code to write.
- NEVER create a `<div>` soup. Semantic HTML still matters inside JSX/templates.
- NEVER ignore bundle size. Monitor it. Set budgets.
- NEVER skip accessibility because "the framework handles it." It doesn't. You do.
- NEVER use `dangerouslySetInnerHTML` (React) or `v-html` (Vue) with unsanitized user input.
- NEVER store sensitive data (tokens, secrets) in client-side state.
- NEVER write business logic in components. Extract it into hooks, services, or utilities.

### Before choosing a framework, ask yourself

1. Does this project have enough interactivity and state to justify a framework?
2. Am I building an application or a document? Applications need frameworks. Documents need HTML.
3. Will the framework's ecosystem (routing, testing, state management) actually save time?
4. Can I start with plain HTML/CSS and add interactivity incrementally (e.g., with Alpine.js, htmx, or islands architecture)?

## The Bottom Line

The problem was never React. The problem is using a sledgehammer to hang a picture frame. Match the tool to the job. Use HTML and CSS as the foundation. Reach for a framework when the complexity genuinely demands it. And when you do, use it well.

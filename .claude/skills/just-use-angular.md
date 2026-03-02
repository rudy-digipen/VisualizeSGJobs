# Just Use Angular - When You Need a Complete Framework

Inspired by [justfuckinguseangular.com](https://justfuckinguseangular.com/)

## Core Philosophy

Modern Angular (v17+) is not the Angular your coworker complained about in 2018. It has standalone components, signals, a streamlined API, built-in routing, forms, HTTP client, and excellent TypeScript support out of the box. When you need a **batteries-included, opinionated framework** for a large-scale application, Angular is a legitimate choice. Stop cargo-culting framework decisions based on outdated opinions.

## Rules for Claude

### KNOW when Angular is the right choice

Angular excels when:
- Building large-scale enterprise applications with big teams.
- You need a complete, opinionated framework (routing, forms, HTTP, DI, testing -- all built in).
- Strong TypeScript integration is a priority (Angular is TypeScript-first).
- You want consistent patterns enforced by the framework, not by team convention.
- The project has complex forms with validation, dynamic fields, and multi-step flows.
- You need dependency injection for service management and testability.
- Long-term maintainability and upgrade paths matter (Angular has a predictable release cycle).

### ALWAYS use modern Angular patterns

#### Standalone Components (default since Angular 17)
- Use standalone components. Not NgModule-based components.
- Import dependencies directly in the component's `imports` array.
- No more `NgModule` boilerplate for simple components.

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<a routerLink="/home">Home</a>`
})
export class ExampleComponent { }
```

#### Signals (Angular 17+)
- Use `signal()` for reactive state. Not manual change detection or BehaviorSubjects for simple state.
- Use `computed()` for derived state.
- Use `effect()` sparingly for side effects.
- Signals are synchronous, fine-grained, and framework-aware.

```typescript
count = signal(0);
doubled = computed(() => this.count() * 2);
increment() { this.count.update(v => v + 1); }
```

#### Control Flow (Angular 17+)
- Use `@if`, `@for`, `@switch` block syntax. Not `*ngIf`, `*ngFor`, `*ngSwitch`.
- The new control flow is built into the template engine, requires no imports, and supports `@empty` blocks.

```html
@if (items().length > 0) {
  @for (item of items(); track item.id) {
    <div>{{ item.name }}</div>
  } @empty {
    <p>No items found.</p>
  }
} @else {
  <p>Loading...</p>
}
```

#### Dependency Injection
- Use `inject()` function instead of constructor injection for cleaner code.
- Use `providedIn: 'root'` for singleton services.
- Use component-level providers when service scope should be limited.

```typescript
export class MyComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
}
```

### ALWAYS respect the HTML/CSS foundation inside Angular

- Angular templates are HTML. Use semantic elements. `<button>`, `<nav>`, `<main>`, `<dialog>` -- they all work.
- Use Angular's built-in `@Component({ styles: [] })` or separate CSS files. Keep styles scoped.
- Use native HTML form validation attributes alongside Angular's reactive forms.
- Angular's `<dialog>` support works. Use native elements before building custom overlays.

### ALWAYS follow Angular best practices

- **Smart/Dumb component pattern**: Container components manage state and data fetching. Presentational components receive data via `@Input()` / `input()` and emit events via `@Output()` / `output()`.
- **Reactive forms for complex forms**: Use `FormBuilder`, `FormGroup`, `FormControl` for forms with validation, dynamic fields, or complex logic.
- **Template-driven forms for simple forms**: `ngModel` is fine for simple, static forms.
- **Lazy-load routes**: Use `loadComponent` and `loadChildren` for route-level code splitting.
- **Use the Angular CLI**: `ng generate`, `ng build`, `ng test`. It enforces conventions.
- **OnPush change detection**: Use `ChangeDetectionStrategy.OnPush` for better performance. Signals make this easier.
- **Typed HTTP responses**: Always type your `HttpClient` responses. `this.http.get<User[]>(url)`.

### NEVER do these in Angular

- NEVER use NgModules for new components. Standalone is the default and the future.
- NEVER use `*ngIf` / `*ngFor` when `@if` / `@for` block syntax is available (Angular 17+).
- NEVER subscribe to Observables without unsubscribing. Use `async` pipe, `takeUntilDestroyed()`, or `DestroyRef`.
- NEVER put logic in templates. Keep templates declarative. Extract logic to the component class or a service.
- NEVER use `any` types. Angular is TypeScript-first. Type everything.
- NEVER skip `trackBy` (or `track` in `@for`) on lists. It prevents unnecessary DOM recreation.
- NEVER use `ViewChild` with `nativeElement` for DOM manipulation when Angular bindings or directives suffice.
- NEVER ignore the Angular style guide. Naming conventions (`*.component.ts`, `*.service.ts`, `*.pipe.ts`) exist for a reason.

### Before choosing Angular, ask yourself

1. Is this a large, long-lived application with multiple developers?
2. Do I need built-in solutions for routing, forms, HTTP, and DI, or would assembling my own stack be better?
3. Is the team comfortable with TypeScript and opinionated conventions?
4. Am I building an application (Angular is great) or a static site (use HTML/CSS)?

## The Bottom Line

Modern Angular is simple, fast, complete, and actually good. Standalone components, signals, new control flow, and `inject()` have made it lean and developer-friendly. If your project needs a batteries-included framework with strong opinions and excellent TypeScript support, Angular is a solid choice. Just make sure you're using modern Angular, not fighting patterns from 2016.

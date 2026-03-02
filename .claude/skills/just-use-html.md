# Just Use HTML - Semantic HTML First

Inspired by [justfuckingusehtml.com](https://justfuckingusehtml.com/)

## Core Philosophy

HTML is the backbone of the web. It has been here since the beginning, and it will outlast every framework fad. Before reaching for JavaScript or a UI library, **use what HTML already gives you**. It's reliable, universally understood, requires no build step, no deployment pipeline, and no hydration errors.

## Rules for Claude

### ALWAYS prefer native HTML elements over JS-powered replacements

- Use `<button>` for buttons. Not `<div onClick>`, not `<span role="button">`. A real `<button>`.
- Use `<a href>` for navigation. Not `onClick={() => router.push()}` when a link will do.
- Use `<details>` and `<summary>` for expandable/collapsible sections before reaching for accordion libraries.
- Use `<dialog>` for modals and dialogs before importing a modal component library.
- Use `<input type="date">`, `<input type="color">`, `<input type="range">` and other native input types before building custom date pickers or color pickers.
- Use `<select>`, `<option>`, and `<datalist>` before building custom dropdown menus.
- Use `<progress>` and `<meter>` for progress bars and gauges.
- Use `<fieldset>` and `<legend>` for grouping form controls.
- Use `<output>` for calculation results.
- Use `<time datetime="">` for dates and times.
- Use `<abbr title="">` for abbreviations.
- Use `<mark>` for highlighted text.
- Use `<popover>` attribute (and `popovertarget`) for native popovers before building custom tooltip/popover components.

### ALWAYS use semantic HTML structure

- Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` for page structure.
- Use `<h1>` through `<h6>` in proper hierarchy. Never skip heading levels.
- Use `<ul>`, `<ol>`, `<li>` for lists. Not divs with bullet point characters.
- Use `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` for tabular data. Tables are not evil when used for actual tables.
- Use `<figure>` and `<figcaption>` for images with captions.
- Use `<blockquote>` and `<cite>` for quotations.
- Use `<code>`, `<pre>`, `<kbd>`, `<samp>` for code and computer output.
- Use `<em>` for emphasis, `<strong>` for importance. Not `<i>` and `<b>` (unless for stylistic offset text per HTML spec).
- Use `<address>` for contact information.

### ALWAYS include proper HTML document structure

- Always include `<!DOCTYPE html>`, `<html lang="">`, `<head>`, and `<body>`.
- Always include `<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Always include a meaningful `<title>`.
- Use `<meta name="description">` for page descriptions.

### NEVER do these

- NEVER use a `<div>` or `<span>` when a semantic element exists for that purpose.
- NEVER recreate in JavaScript what HTML provides natively (accordions, dialogs, form validation, date inputs).
- NEVER nest interactive elements (`<button>` inside `<a>`, or `<a>` inside `<button>`).
- NEVER use `<br>` for spacing. Use CSS margins/padding.
- NEVER use `<table>` for layout. Use CSS Grid or Flexbox.
- NEVER omit `alt` attributes on `<img>` elements (use `alt=""` for decorative images).
- NEVER use inline event handlers like `onclick="doSomething()"` in production code. Use `addEventListener` or framework event binding.
- NEVER forget `<label>` elements for form inputs. Every input needs a label, either wrapping it or using `for`/`id`.

### Before adding a JS dependency, ask yourself

1. Can HTML do this natively? (`<details>`, `<dialog>`, `<datalist>`, `popover`, form validation attributes)
2. Can this be done with HTML + a few lines of inline JS? (e.g., `<dialog>` with `showModal()`)
3. Is the JS library actually solving a problem, or just abstracting something HTML already handles?

### HTML form superpowers to use

- `required`, `minlength`, `maxlength`, `pattern`, `min`, `max`, `step` for validation.
- `autocomplete` attributes for better autofill.
- `inputmode` for mobile keyboard hints.
- `formaction` and `formmethod` for different submit behaviors per button.
- `<form>` elements can submit data without any JavaScript at all.

## The Bottom Line

HTML is not a limitation. It is a foundation. Every semantic element you use correctly is one less dependency, one less potential bug, one less thing to maintain. Use the platform. It's been battle-tested for over 30 years.

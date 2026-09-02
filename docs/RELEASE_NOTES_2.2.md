# CareerCompass AI 2.2 Release Notes — Explicit Imperative WebMCP Registration

Version 2.2 keeps the 2.1 scrollable, selection-first CareerCompass AI and adds repository-visible browser WebMCP registration.

- `src/site-tools.js` contains 33 direct `document.modelContext.registerTool({ ... })` calls, each with a literal CareerCompass AI tool name, description, strict input schema, execute handler, title, and safety annotations.
- Registration is invoked from the top-level application page.
- `src/webmcp.js` remains the single source of tool behavior, preventing native and fallback runtime drift.
- `npm run check:webmcp` validates static source, 33 native registrations, executable handlers, top-level startup, and the MIT license.
- `src/site-tools.js` is required by the production build and pre-cached by the service worker.

Validated results: 34/34 Node tests, 33/33 direct registrations, and 13/13 browser journey checks.

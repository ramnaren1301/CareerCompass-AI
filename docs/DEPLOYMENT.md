# Deployment

CareerCompass AI is a static browser application with no runtime package dependencies.

## Build

```bash
npm test
npm run check:webmcp
npm run build
```

The deployable output is created in `dist/`.

## Local production run

```bash
npm start
```

Open `http://localhost:3000`.

## Static hosts

Deploy the contents of `dist/` to a static host such as Vercel, Netlify, or Cloudflare Pages. The included `vercel.json` and `netlify.toml` provide SPA fallback behavior.

Required files include:

```text
index.html
styles.css
manifest.webmanifest
service-worker.js
src/
  site-tools.js
data/careercompass-career-catalog.json
public/icon.svg
```

## Cache update

Version 3.0 uses service-worker cache:

```text
careercompass-ai-v3-webmcp
```

When replacing an earlier deployment, deploy the complete `dist/` directory and perform one hard refresh so the browser removes the old multi-screen application cache and stored UI state.

## Configuration boundary

The current build uses seeded browser data and requires no environment variables. A production backend should provide:

- institution SSO
- student and degree APIs
- verified opportunity feeds
- server-side WebMCP authorization
- hosted agent credentials
- audit and consent storage

Do not place API keys or student-system credentials in the static bundle.

## Native WebMCP verification

In a WebMCP-enabled browser or ChatGPT environment:

1. Open the deployed CareerCompass AI URL.
2. Confirm that 33 tools register through `document.modelContext.registerTool()`.
3. Select one supported career area, field, and role.
4. Confirm that only the current journey step changes.
5. Verify that the full field list and long academic-route step scroll correctly.
6. Verify that write tools return an approval request rather than applying changes silently.

Ordinary browsers use the built-in runtime over the same definitions.

## Browser regression

```bash
python scripts/careercompass-browser-check.py
```

The harness executes the built production modules through an inline import map. Results are written to `docs/careercompass-e2e-results.json`.


## Required WebMCP headers

All responses must include:

```http
Origin-Agent-Cluster: ?1
Permissions-Policy: tools=(self), camera=(), microphone=(), geolocation=()
```

The Node server, Vercel configuration, Netlify configuration, and `_headers` file include these values. Close the old tab and open a new one after changing origin isolation.

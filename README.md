# CareerCompass AI — Selection-First + Imperative WebMCP

CareerCompass AI is a continuous student career-planning journey. It does not open with a dashboard full of courses, roles, internships, scholarships, research, and technical tools. The student makes one supported choice at a time, and each decision narrows what appears next.

Version 3.0 preserves the scrollable, selection-first journey and makes the browser-native WebMCP implementation explicit and easy to verify in a public repository:

- **33 direct imperative registrations** are checked into [`src/site-tools.js`](src/site-tools.js). Every tool is registered with a literal name through `document.modelContext.registerTool({ ... })`.
- **Top-level page registration** occurs during application startup from [`src/app.js`](src/app.js); the tools are not hidden in an iframe.
- **Repository validation** is available through `npm run check:webmcp`, which checks direct calls, unique names, schemas, execute handlers, runtime registration, and the MIT license.
- **The primary journey remains selection-first and scrollable.** There is no open-ended career field, so an unsupported entry such as “singer” cannot silently enter the planning engine.

![CareerCompass AI selection-first career areas](mockups/01-selection-first-career-areas.png)

## Native Chrome WebMCP verification

CareerCompass AI distinguishes its internal careercompass-ai runtime from Chrome's native WebMCP registry. The header turns green only after `document.modelContext.getTools()` confirms all 33 CareerCompass AI tools. It no longer reports 33 native tools when the API is missing or registration fails.

The local server and deployment configurations send the headers required by WebMCP:

```http
Origin-Agent-Cluster: ?1
Permissions-Policy: tools=(self), camera=(), microphone=(), geolocation=()
```

For local Chrome testing, enable both flags and fully relaunch Chrome:

```text
chrome://flags/#enable-webmcp-testing
chrome://flags/#devtools-webmcp-support
```

Then open `http://localhost:3000`, DevTools → Application → WebMCP. The app header should say `33 WebMCP tools registered`, and Available Tools should contain 33 entries.

Run this in Console for an exact self-check:

```js
await window.CareerCompassAIWebMCP.diagnostics()
```

On localhost, v3.0 unregisters old CareerCompass AI service workers and clears their caches once so stale earlier JavaScript or document responses cannot hide the corrected registration.


## The supported-choice journey

```text
Choose 1 of 6 broad career areas
        ↓
Choose a supported field in that area
        ↓
Choose a role in that field
        ↓
Choose the first priority
        ↓
Choose an academic route
        ↓
Choose and approve one next-semester plan
        ↓
Choose one 30-day skill sprint
        ↓
Choose internship, research, or portfolio proof
        ↓
Optionally add focused funding
        ↓
Receive a roadmap built from those selections
```

The student may also select **Browse all 20 supported fields**. That view is grouped by the same six areas and remains scrollable inside the center panel.

## Supported career areas

The first step offers six broad choices derived from the attached catalog:

1. Build software and digital products
2. Work with AI, data, and advanced computing
3. Protect and connect systems
4. Build hardware, robots, and physical systems
5. Design human and immersive experiences
6. Apply technology to health and biology

Together, these groups cover all **20 fields and 54 roles** in the supplied JSON exactly once.

## Nine dependent steps

1. **Direction** — select one of six supported areas, or explicitly browse all supported fields.
2. **Role** — select a field and then a role that actually exists inside that field.
3. **Priority** — choose internship readiness, research, portfolio proof, or graduation protection.
4. **Academic route** — review whether the current degree is direct, adjacent, or a larger pivot, then select a supported route.
5. **Next semester** — choose a workload, review one prerequisite-safe term, and approve it before it becomes the working plan.
6. **Skill sprint** — choose one of no more than three role-specific skill gaps.
7. **Experience** — choose internship, research, or portfolio proof; see at most two focused options.
8. **Funding** — optionally add one relevant funding lead or skip it.
9. **Roadmap** — receive milestones assembled only from the choices made in this journey.

## Progressive-disclosure rules

The implementation enforces these rules in code:

- No career is preselected.
- No free-text career field is mounted in the primary journey.
- Only catalog-backed groups, fields, roles, priorities, routes, workloads, skills, and experience types can be selected.
- Selecting an area reveals only its supported fields.
- Selecting a field removes unrelated fields and reveals only its roles.
- Only one active decision card is mounted in the center workspace.
- Later steps remain locked until their dependencies are complete.
- Only one next semester is shown during planning.
- Skill analysis displays no more than three gaps.
- Experience and funding display no more than two options each.
- WebMCP activity remains in a secondary drawer.
- Revisiting an earlier decision preserves stable student context and clears only dependent choices.

## Scrolling behavior

### Desktop

The application shell fills the viewport. The left journey trail, center decision area, and right focus panel each have their own bounded layout. The center `.conversation-scroll` region uses vertical overflow and a visible scrollbar. The title bar and bottom selection guidance stay in place while long option sets move beneath them.

### Tablet and mobile

Below the desktop breakpoint, the app switches to normal document flow. Touch and wheel scrolling work on the whole page, and the center content no longer depends on a fixed-height nested panel.

## How selections drive later reasoning

This is not a visual wizard over independent pages.

- **Area → field → role** determines the career anchor used by planning, skills, opportunities, and the roadmap.
- **Priority** changes why courses are ordered and which proof type is emphasized.
- **Academic route** establishes whether the student stays in the current degree, bridges gaps, explores a program change, or consults an advisor.
- **Workload** changes the generated next-semester plan.
- **Approved plan** becomes the context for skill-gap and opportunity reasoning.
- **Selected skill** determines the single learning action and proof project shown next.
- **Selected experience and funding** are the only opportunities retained in the final roadmap.

## Human control

Read and reasoning tools may run behind the journey. Consequential changes remain approval-gated.

The next-semester plan is proposed inline. CareerCompass AI does not apply it until the student selects **Approve plan**. The same WebMCP layer retains approval-gated contracts for adding courses, saving opportunities, expressing research interest, and updating application status.

## Data sources

CareerCompass AI uses two transparent MVP data sources:

- `data/careercompass-career-catalog.json` — the supplied catalog with 20 fields, 54 roles, learning paths, scholarships, internships, universities, and research contacts.
- `src/data.js` — curated demonstration student, degree, course, prerequisite, and detailed opportunity data used by the planning engine.

The catalog's `url: null` values remain unverified and are not replaced with invented links. The UI labels those records for verification.

## WebMCP

The runtime exposes 33 structured tools:

- 25 read/reason tools
- 8 approval-gated write tools

The repository contains one actual, statically visible imperative registration for every tool. Each invocation also forwards the browser-provided cancellation signal to the shared application handler. For example:

```javascript
await document.modelContext.registerTool({
  name: "list_career_fields",
  description: listCareerFields.description,
  inputSchema: listCareerFields.inputSchema,
  execute: async (input, options = {}) =>
    listCareerFields.execute(input, { signal: options.signal }),
  title: listCareerFields.title,
  annotations: listCareerFields.annotations,
}, { signal });
```

[`src/webmcp.js`](src/webmcp.js) owns the shared definitions and handlers. [`src/site-tools.js`](src/site-tools.js) performs direct browser registration from the top-level application. Ordinary browsers without WebMCP support use the same handlers through the local runtime. Technical execution appears only after opening **Agent activity**.

See [`docs/WEBMCP_TOOLS.md`](docs/WEBMCP_TOOLS.md) for the complete tool catalog.


## Three-minute WebMCP Challenge video

The repository includes the complete question-led narration, captions, storyboard, and Andrew voice SSML in [`demo/`](demo/). Every one of the ten sections begins with a question and continues in very simple conversational language.

The target narration voice is Microsoft Azure `en-US-AndrewMultilingualNeural`. Because a voice-service key is never committed to source control, the repository contains a render script rather than credentials or bundled cloud-generated voice audio. The separate video kit includes the finished 1920 × 1080 visual master and original background music; adding an Azure Speech key produces the final Andrew-voiced three-minute MP4 without changing the scenes, captions, or timing.

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) for the exact narration and [`docs/LIVE_DEMO_GUIDE.md`](docs/LIVE_DEMO_GUIDE.md) for the click-by-click live demonstration.

## Run locally

Requires Node.js 20 or newer.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Test and build

```bash
npm test
npm run check:webmcp
npm run build
npm run test:browser
```

`npm run build` creates the deployable static site in `dist/`.

Current validated results:

- Node unit, native-readiness, and WebMCP contract tests pass.
- 13 of 13 production-browser journey checks pass.
- 33 of 33 direct `document.modelContext.registerTool({ ... })` registrations pass repository and runtime validation.
- The full 20-field selector and the long academic-route step both scroll in the center workspace.
- Desktop and 390 × 844 mobile layouts have no horizontal overflow.
- No console or uncaught page errors were detected.

Detailed evidence is in [`docs/QA_REPORT.md`](docs/QA_REPORT.md) and [`docs/careercompass-e2e-results.json`](docs/careercompass-e2e-results.json).

## Project structure

```text
CareerCompass-AI-WebMCP-v3.0/
├── data/
│   └── careercompass-career-catalog.json
├── src/
│   ├── app.js                 Selection journey, scroll behavior, transitions, approvals
│   ├── careercompass-journey.js       Nine-step state model and six catalog-backed career groups
│   ├── career-catalog.js      JSON loading, normalization, exploration, comparisons
│   ├── career-catalog-data.js Generated offline fallback for the supplied JSON
│   ├── data.js                Curated academic MVP data
│   ├── engine.js              Prerequisites, plans, gaps, matching, roadmap reasoning
│   ├── store.js               Student-controlled state and approval queue
│   ├── webmcp.js              33 shared tool definitions and local runtime
│   ├── site-tools.js          33 literal document.modelContext.registerTool calls
│   ├── dom-patch.js           Keyed in-place reconciliation to avoid flicker
│   └── icons.js
├── scripts/
│   ├── build.mjs
│   ├── check-webmcp.mjs       Repository and runtime WebMCP compliance check
│   ├── sync-career-catalog.mjs
│   └── careercompass-browser-check.py
├── tests/
├── mockups/
├── demo/                  Narration, captions, storyboard, Andrew SSML, render scripts
├── docs/
├── styles.css
└── index.html
```

## MVP boundary

The decision engine and conversation copy are deterministic and local; the app is not connected to a hosted LLM. Student, degree, and detailed opportunity records are demonstration data. CareerCompass AI does not enroll a student, submit an application, contact a professor, or modify a university system of record. Production use requires authentication, institution-specific degree adapters, verified live opportunity feeds, server-side authorization, privacy review, and audit controls.

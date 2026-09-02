# Quality Assurance Report — CareerCompass AI 3.0

Validated September 1, 2026.

## Commands and results

```bash
npm test
npm run check:webmcp
npm run build
npm run test:browser
```

- **38 of 38** Node unit, journey, data, and WebMCP contract tests passed.
- A non-WebMCP browser truthfully reports **0 native tools** instead of claiming the 33 local handlers are Chrome registrations.
- Native success is reported only after `document.modelContext.getTools()` discovers all **33 of 33** CareerCompass AI tools.
- **33 of 33** direct `document.modelContext.registerTool({ ... })` calls have unique literal names.
- Every registration has a description, strict object input schema, execute handler, and read/write annotation.
- The local server and static-host configurations send `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)`.
- The registered `get_career_catalog_status` execute handler returned 20 fields and 54 roles.
- Top-level startup and the MIT license were verified.
- **13 of 13** production-browser journey checks passed.
- Desktop and 390×844 mobile scrolling and overflow checks passed.
- No console or uncaught page errors were detected in the production-journey regression browser.

Detailed machine-readable evidence is in `native-webmcp-fix-results.json`, `webmcp-registration-results.json`, and `careercompass-e2e-results.json`. The repository tests simulate the experimental native API; final confirmation in Chrome's Application → WebMCP panel must be performed in a WebMCP-enabled Chrome build.


## Challenge-video validation

- The visual and local-voice preview is exactly 180.000 seconds.
- Video is 1920 × 1080 H.264 at 24 frames per second.
- Preview audio is stereo AAC at 48 kHz, approximately -14.1 LUFS integrated, with a -1.2 dBFS true peak.
- The video contains ten 18-second sections and every section starts with a question.
- No black frames or unintended audio gaps longer than two seconds were detected.
- Captions are both burned into the visuals and included as a subtitle track.
- The target Andrew voice is supplied as SSML and render scripts; the bundled preview narration is explicitly a local male voice, not Microsoft Andrew.

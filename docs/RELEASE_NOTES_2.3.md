# PathwayOS Career Buddy v2.3

- Corrects the misleading green “Career Buddy connected” badge.
- Reports Chrome-native WebMCP only after `document.modelContext.getTools()` discovers all 33 tools.
- Adds origin-isolation and explicit tools permissions headers to local and hosted configurations.
- Removes stale localhost service workers and PathwayOS caches before loading the app.
- Omits empty `required: []` arrays from zero-input schemas.
- Adds visible in-product diagnostics and one-click native registration recheck.

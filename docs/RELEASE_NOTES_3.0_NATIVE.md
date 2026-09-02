# CareerCompass AI v3.0

- Corrects the misleading green “CareerCompass AI connected” badge.
- Reports Chrome-native WebMCP only after `document.modelContext.getTools()` discovers all 33 tools.
- Adds origin-isolation and explicit tools permissions headers to local and hosted configurations.
- Removes stale localhost service workers and CareerCompass AI caches before loading the app.
- Omits empty `required: []` arrays from zero-input schemas.
- Adds visible in-product diagnostics and one-click native registration recheck.

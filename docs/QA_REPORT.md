# Quality Assurance Report — PathwayOS 2.1

Validated on September 1, 2026 against the production output in `dist/`.

## Node unit and contract tests

Command:

```bash
npm test
```

Result: **32 of 32 tests passed**.

Coverage includes:

- one ordered nine-step journey
- blank initial career state
- six starting career groups
- exact coverage of all 20 fields and 54 roles once across those groups
- no primary free-text career form or input
- field selection constrained to the current catalog
- role selection constrained to the selected field
- direct, adjacent, and pivot academic-route behavior
- route-specific roadmap milestones
- maximum three role-specific skill gaps
- maximum two catalog opportunities
- supplied JSON and generated fallback equality
- career search, comparison, and verification metadata
- degree progress and prerequisite validation
- prerequisite-safe semester planning
- role-aligned course routes
- explicit warnings for engineering pivots
- approval required before persistent plan changes
- rejected writes leaving student state unchanged
- 33 unique strict WebMCP contracts
- exact separation of 25 read/reason and 8 approval-gated tools
- JSON career tools marked read-only and untrusted-content-aware
- service-worker caching of the 2.1 selection-first modules
- legacy state not forcing an ML goal

## Production build

Command:

```bash
npm run build
```

Result: static production output created in `dist/` with version `2.1.0`.

## Browser journey regression

Command:

```bash
npm run test:browser
```

Result: **13 of 13 checks passed**.

| Check | Result |
|---|---|
| Fresh load shows six supported career areas | Pass |
| No open-ended career input or textarea is mounted | Pass |
| The complete 20-field catalog opens on demand | Pass |
| The center workspace has real vertical overflow and changes `scrollTop` | Pass |
| Choosing a broad area exposes only fields assigned to it | Pass |
| Choosing a field removes unrelated fields and exposes only its roles | Pass |
| The selected role anchors subsequent decisions | Pass |
| One supported priority is selected before planning | Pass |
| The long academic-route decision remains scrollable | Pass |
| Plan changes remain approval-gated | Pass |
| Only three skill choices unlock after approval | Pass |
| A skill opens one learning action and one proof project | Pass |
| The final roadmap contains only selected role, plan, skill, and experience context | Pass |
| WebMCP activity remains secondary | Pass |
| Mobile selection flow scrolls without horizontal overflow at 390 × 844 | Pass |
| Console errors | 0 |
| Uncaught page errors | 0 |

The raw result is stored in [`career-buddy-e2e-results.json`](career-buddy-e2e-results.json).

## Scroll regression details

The browser suite verifies scrolling behavior rather than checking CSS text only:

1. It opens the grouped list of all 20 career fields.
2. It confirms `.conversation-scroll.scrollHeight` is greater than `.clientHeight`.
3. It changes the panel's `scrollTop` and confirms that the value moves.
4. It repeats the check on the longer academic-route step.
5. It verifies that the selection footer remains available and the app has no horizontal overflow.

## Screenshots produced by the browser test

- `mockups/01-selection-first-career-areas.png`
- `mockups/02-all-supported-fields-scrollable.png`
- `mockups/03-supported-fields-in-direction.png`
- `mockups/04-scrollable-academic-route.png`
- `mockups/05-selection-built-roadmap.png`
- `mockups/06-selection-first-mobile.png`

## Runtime boundary

The browser journey is a deterministic local orchestration layer over the WebMCP contracts. It does not call a hosted language model or a live university system. Browser tests validate the current MVP behavior, not external enrollment, application submission, email, or institution authorization.

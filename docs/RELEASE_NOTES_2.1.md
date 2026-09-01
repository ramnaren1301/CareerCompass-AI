# PathwayOS 2.1 Release Notes — Scrollable, Selection-First Journey

## Why this release

Version 2.0 established a continuous journey, but the central panel could feel trapped at some desktop sizes and the first step still accepted unrestricted text. That allowed students to enter careers outside the supplied dataset, creating ambiguity about what PathwayOS actually supported.

Version 2.1 makes the supported decision space explicit and fixes the scroll model.

## Selection-first career discovery

- Replaced the primary free-text career form with six supported career-area cards.
- Added an optional grouped browser for all 20 supported fields.
- Selecting an area reveals only its fields.
- Selecting a field reveals only its catalog roles.
- Unsupported careers cannot silently enter the primary journey.
- All later primary decisions use cards, buttons, or bounded selectors.

The six groups cover the supplied catalog's 20 fields and 54 roles exactly once.

## Scroll correction

- Added explicit viewport sizing and `min-height: 0` through the desktop grid chain.
- Made the center `.conversation-scroll` region vertically scrollable.
- Preserved the conversation title bar and selection guidance footer while the decision content scrolls.
- Added touch momentum, overscroll containment, scrollbar gutter, and visible scrollbar styling.
- Switched tablet and mobile layouts to normal document scrolling.
- Updated automatic step scrolling to position the active decision card instead of forcing the panel to the absolute bottom.

## Guardrails

- Exact field validation before a field can be selected.
- Exact role validation against the selected field.
- Priority, route, skill, and experience choices validated against the options displayed for the current step.
- No default role injected when the student chooses a field.

## Validation

- 32 of 32 Node and WebMCP contract tests pass.
- 13 of 13 browser regression checks pass.
- The browser suite verifies real `scrollHeight`, `clientHeight`, and `scrollTop` behavior.
- Desktop and 390 × 844 mobile layouts have no horizontal overflow.
- No console or uncaught page errors were detected.

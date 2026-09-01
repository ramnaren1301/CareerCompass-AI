# PathwayOS 2.3 Submission Checklist

## Repository

- [x] Complete source, assets, and run instructions
- [x] MIT `LICENSE` at repository root
- [x] 33 direct `document.modelContext.registerTool({ ... })` calls in `src/site-tools.js`
- [x] Literal tool names plus `description`, `inputSchema`, and `execute`
- [x] Registration from the top-level page, not an iframe
- [x] `npm run check:webmcp` validation
- [ ] Publish to GitHub, GitLab, or Bitbucket
- [ ] Make the license visible in the repository About section

## Product

- [x] One continuous, option-driven Career Buddy journey
- [x] Six catalog-backed starting areas and all 20 supported fields
- [x] No unsupported free-text career path enters planning
- [x] Scrollable desktop workspace and normal mobile scrolling
- [x] Inline human approval for consequential changes
- [x] 25 read/reason tools and 8 approval-gated write tools

## Validation

- [x] 34 Node tests
- [x] 33 direct registrations
- [x] 13 browser journey checks
- [x] No console or uncaught browser errors

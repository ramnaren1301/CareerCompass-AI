# PathwayOS 2.1 Architecture

## Design principle

PathwayOS is one stateful conversation, not a set of destination screens. The central product abstraction is a dependency-aware journey state machine.

```text
Student selection
     ↓
Current journey step
     ↓
Small, relevant WebMCP/tool operation
     ↓
One bounded choice set
     ↓
Student decision
     ↓
Next dependent step
```

## Application shell

The browser renders three persistent regions:

1. **Journey trail** — current step, completed decisions, and locked future steps.
2. **Conversation workspace** — message history plus exactly one active decision card.
3. **Current focus** — only the selected context and next required action.

These are not independent modules. They are three views of the same `journey` object in `src/app.js`.

`src/dom-patch.js` reconciles keyed nodes in place. WebMCP updates do not replace the conversation workspace, step trail, scroll position, or mounted tool rows. Rendering is batched with `requestAnimationFrame`.


## Scroll architecture

On desktop, the application uses a viewport-bounded grid. Every ancestor in the center column has `min-height: 0`, and `.conversation-scroll` owns vertical overflow. The header and selection footer remain stable while the active decision content scrolls. `scrollConversation()` positions the active card relative to the panel rather than forcing the panel to its bottom.

At tablet and mobile breakpoints, the layout returns to normal document flow so wheel and touch scrolling are handled by the page.

## Journey state machine

`src/buddy-journey.js` defines the ordered steps:

```text
direction → role → priority → route → semester
          → skills → experience → funding → roadmap
```

Each step has explicit dependencies. The next step cannot be opened until the current decision is complete.

The model stores only the selected branch:

```text
selectedTopic
selectedRole
priority
route
workload
approved plan
selectedSkill
selectedExperience
selectedScholarship or skip
finalPathway
```

It does not preload every field’s courses, resources, scholarships, and internships into the visible interface.

## Dependency invalidation

A student can revisit a completed step. `dependentResetFor()` preserves everything before that step and clears only later decisions.

Examples:

- Revisiting **Skill sprint** keeps the role, priority, route, and approved plan, while clearing the experience, funding, and final roadmap.
- Revisiting **Role** keeps the selected field but clears all role-dependent planning.
- Starting over clears the journey and underlying demo state.

This produces a continuous collaboration rather than a collection of unrelated search sessions.

## Progressive-disclosure boundaries

The journey helper layer enforces hard output limits:

- starting career groups: 6
- supported fields: only those inside the selected group
- optional all-fields view: 20, grouped and scrollable
- initial roles: 3
- active workflow cards: 1
- next semesters shown: 1
- skill gaps: 3
- experiences: 2
- scholarships: 2
- final milestones: 5

## Choice-driven reasoning

### Career direction and role

`CAREER_GROUPS` maps every field in the supplied JSON into one of six supported starting areas. The primary UI renders those six areas as bounded choices; it does not mount an open-ended career input. Students may explicitly open a grouped, scrollable view of all 20 supported fields.

The chosen area determines the only fields rendered next. The chosen field determines the only roles rendered after that. Exact field and role validation prevents unsupported values from entering the state machine. The confirmed role becomes the career goal in the shared data store and WebMCP runtime.

### Priority

The student selects internship, research, portfolio, or graduation. That priority changes:

- the explanation and ordering strategy for the next semester
- whether research preparation is included in planning
- the recommended experience category
- the route checkpoint wording
- the final roadmap context

### Academic route

`getCareerDegreeAlignment()` classifies the current degree as direct, adjacent, or a likely pivot. The selected route then creates a concrete checkpoint through `academicRouteGuidance()`.

For a program-change choice, the UI explicitly treats displayed courses as safe transferable next steps while the student compares program requirements and meets an advisor. It does not present a Computer Science plan as a complete Mechanical Engineering, Electrical Engineering, Biomedical Engineering, or VLSI curriculum.

### Semester and approval

`simulate_degree_plan` generates a prerequisite-safe multi-term plan internally, but the UI reveals only the next non-empty term. The plan remains non-binding until `create_degree_plan` returns an approval request and the student explicitly approves it.

### Skill sprint

The planning engine identifies gaps. `skillChoices()` then prioritizes the chosen field’s core capabilities and limits the result to three. Selecting one skill reveals:

- one relevant learning action from the selected field’s learning path
- one role-specific proof project

### Experience and funding

The student first chooses internship, research, or portfolio. Only that category is searched. The visible result is capped at two options.

Funding is optional and follows the same rule. Generic directories are not displayed when a relevant lead is unavailable.

### Roadmap

`finalMilestones()` receives the role, route, plan, skill, experience, scholarship choice, and priority. The five final milestones are derived from those values rather than from a static template.

## WebMCP layer

`src/webmcp.js` defines 33 tools once. The same contracts are used by:

- native `document.modelContext.registerTool()` registration when available
- the built-in browser runtime
- the career-buddy orchestration
- unit and browser tests

The visible journey calls only the tools needed by the selected branch. Technical execution history is stored in `journey.toolLog` and rendered only in the secondary activity drawer.

## Human control

The WebMCP tools are divided into:

- 25 read/reason tools
- 8 approval-gated writes

Write handlers create pending approvals and return `awaiting_student_confirmation`. They do not persist the requested change. The career buddy places the degree-plan approval inline at the exact point where the decision is needed.

## Data architecture

```text
Attached career JSON
  fields, roles, learning paths,
  catalog opportunities, source metadata
                 │
                 ├── career-catalog.js
                 │
Student + academic demo data
  profile, courses, prerequisites,
  detailed opportunity records
                 │
                 ├── engine.js
                 │
                 ▼
          buddy-journey.js
                 │
                 ▼
      one progressive conversation
```

`url: null` remains null. The UI labels it for verification and does not invent a destination.

## Production evolution

A production implementation should retain the journey and tool contracts while replacing demo adapters with:

- institutional identity and permissions
- Student Information System integration
- institution-specific degree audit and course catalog
- advisor workflow integration
- verified scholarship, research, and internship feeds
- hosted LLM orchestration with policy enforcement
- server-side approval and audit services
- FERPA and institution-specific privacy controls

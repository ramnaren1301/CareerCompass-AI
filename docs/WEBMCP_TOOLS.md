# WebMCP Tool Catalog

PathwayOS registers **33 imperative site tools**. **25 are read/reason tools** and **8 are approval-gated writes**. The headings below describe tool domains, not independent student screens. The Career Buddy invokes only the domains needed by the current selected branch. Every write returns a pending approval rather than applying a persistent change.

## Career Catalog — attached JSON

| Tool | Mode | Purpose |
|---|---|---|
| `get_career_catalog_status` | Read | Read JSON source, coverage, as-of date, and verification caveats |
| `list_career_fields` | Read | List/filter career fields, roles, and catalog counts |
| `explore_career_path` | Read | Read roles, degrees, universities, tiered learning, scholarships, internships, and contacts for one field |
| `recommend_career_paths` | Read | Rank fields against a degree, interests, and skills |
| `compare_career_paths` | Read | Compare up to five fields by education, learning, opportunities, contacts, and link coverage |

All five tools use `untrustedContentHint: true`. Records whose JSON `url` is null remain null in tool output and appear as **Verify** in the UI.

## Degree Navigator

| Tool | Mode | Purpose |
|---|---|---|
| `get_student_profile` | Read | Read student profile |
| `get_degree_requirements` | Read | Read degree requirements |
| `get_completed_courses` | Read | Read completed courses |
| `check_prerequisites` | Read | Check course prerequisites |
| `get_available_courses` | Read | Find available courses |
| `simulate_degree_plan` | Read | Simulate a degree plan |
| `create_degree_plan` | Approval-gated write | Propose an official degree plan |
| `add_course_to_plan` | Approval-gated write | Propose adding a course |
| `identify_skill_gaps` | Read | Identify career skill gaps |

## Research Match

| Tool | Mode | Purpose |
|---|---|---|
| `find_research_opportunities` | Read | Find matched detailed research records |
| `get_research_project` | Read | Read research project |
| `check_research_eligibility` | Read | Check research eligibility |
| `save_research_opportunity` | Approval-gated write | Propose saving research |
| `express_research_interest` | Approval-gated write | Propose research interest |

## Scholarship Finder

| Tool | Mode | Purpose |
|---|---|---|
| `find_scholarships` | Read | Find matched detailed scholarships |
| `get_scholarship_details` | Read | Read scholarship details |
| `check_scholarship_eligibility` | Read | Check scholarship eligibility |
| `save_scholarship` | Approval-gated write | Propose saving a scholarship |
| `update_scholarship_status` | Approval-gated write | Propose scholarship status update |

## Internship Matcher

| Tool | Mode | Purpose |
|---|---|---|
| `find_internships` | Read | Find matched detailed internships |
| `get_internship_details` | Read | Read internship details |
| `check_internship_eligibility` | Read | Check internship eligibility |
| `compare_student_skills` | Read | Compare skills with an internship |
| `identify_missing_skills` | Read | Identify missing internship skills |
| `save_internship` | Approval-gated write | Propose saving an internship |
| `update_internship_status` | Approval-gated write | Propose internship status update |

## Cross-system

| Tool | Mode | Purpose |
|---|---|---|
| `build_personalized_pathway` | Read | Build the complete student pathway |
| `get_pending_approvals` | Read | Read pending student approvals |

## JSON tool contract example

```javascript
await document.modelContext.registerTool({
  name: "explore_career_path",
  title: "Explore one career path",
  description: "Read one JSON-backed career field without inventing missing links.",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string" },
      role: { type: "string" }
    },
    required: ["topic"],
    additionalProperties: false
  },
  annotations: {
    readOnlyHint: true,
    untrustedContentHint: true
  },
  execute: async (input, { signal }) => {
    // Shared PathwayOS handler used by native WebMCP and the demo runtime.
  }
}, { signal });
```

## Side-effect boundary

Read tools can update the current guided step with simulations, rankings, and a selected career path, but do not persist official records. The eight write tools create a narrowly scoped pending approval. Only a direct student action in the PathwayOS interface can apply or reject that proposal.

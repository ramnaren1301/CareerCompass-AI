import { degreeProgram, student } from "./data.js";
import {
  compareCareerPaths,
  exploreCareerPath,
  getCareerCatalogStatus,
  listCareerFields,
  recommendCareerPaths,
} from "./career-catalog.js";
import { registerPathwaySiteTools } from "./site-tools.js";
import {
  buildPersonalizedPathway,
  checkPrerequisites,
  getAvailableCourses,
  getCompletedCourseDetails,
  getCourse,
  getDegreeProgress,
  getOpportunity,
  identifySkillGaps,
  rankInternships,
  rankResearch,
  rankScholarships,
  searchRanked,
  simulateDegreePlan,
} from "./engine.js";

const objectSchema = (properties = {}, required = []) => {
  const schema = {
    type: "object",
    properties,
    additionalProperties: false,
  };
  if (required.length) schema.required = required;
  return schema;
};

const stringField = (description, extra = {}) => ({ type: "string", description, ...extra });
const boolField = (description) => ({ type: "boolean", description });
const intField = (description, minimum = 1, maximum = 20) => ({ type: "integer", description, minimum, maximum });
const stringArrayField = (description, maxItems = 10) => ({
  type: "array",
  description,
  items: { type: "string" },
  maxItems,
});

const shouldNavigateWorkspace = (source = "") => !["demo-agent", "pathway-chat", "career-buddy", "career-buddy-console", "tool-studio", "overview-selector", "human-ui"].includes(source);
const workspaceView = (source, view) => shouldNavigateWorkspace(source) ? { view } : {};

function assertNotAborted(signal) {
  if (signal?.aborted) throw new DOMException("Tool execution cancelled", "AbortError");
}


function webMCPError(error) {
  return {
    name: error?.name || "Error",
    message: error instanceof Error ? error.message : String(error),
  };
}

function readWebMCPEnvironment() {
  const doc = typeof document === "undefined" ? null : document;
  const win = typeof window === "undefined" ? globalThis : window;
  const policy = doc?.permissionsPolicy || doc?.featurePolicy;
  let toolsPolicyAllowed = null;
  try {
    if (typeof policy?.allowsFeature === "function") toolsPolicyAllowed = policy.allowsFeature("tools");
  } catch {
    toolsPolicyAllowed = null;
  }
  return {
    secureContext: typeof win.isSecureContext === "boolean" ? win.isSecureContext : null,
    originAgentCluster: typeof win.originAgentCluster === "boolean" ? win.originAgentCluster : null,
    topLevelDocument: typeof win.top === "undefined" || win.top === win.self,
    modelContextAvailable: Boolean(doc?.modelContext),
    registerToolType: typeof doc?.modelContext?.registerTool,
    getToolsType: typeof doc?.modelContext?.getTools,
    modelContextTestingAvailable: Boolean(win.navigator?.modelContextTesting),
    toolsPolicyAllowed,
    origin: win.location?.origin || "",
    userAgent: win.navigator?.userAgent || "",
  };
}

function compactResult(value) {
  if (Array.isArray(value)) return { count: value.length, preview: value.slice(0, 3) };
  if (value && typeof value === "object") {
    const copy = { ...value };
    if (copy.terms) copy.terms = copy.terms.map((term) => ({ label: term.label, credits: term.credits, courses: term.courses?.map((course) => course.code) }));
    if (copy.plan?.terms) copy.plan = { ...copy.plan, terms: copy.plan.terms.map((term) => ({ label: term.label, credits: term.credits, courses: term.courses.map((course) => course.code) })) };
    return copy;
  }
  return value;
}

export function createWebMCPRuntime(store) {
  const profile = () => ({ ...student, careerGoal: store.getState().profileGoal });
  const currentPlan = () => store.getState().officialPlan || store.getState().pathway.plan;

  const definitions = [
    {
      name: "get_career_catalog_status",
      title: "Read career catalog status",
      description: "Read the source, coverage, as-of date, and verification caveats for the JSON career catalog. This tool does not modify student data.",
      inputSchema: objectSchema(),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      handler: async () => getCareerCatalogStatus(),
    },
    {
      name: "list_career_fields",
      title: "List career fields",
      description: "List career fields and roles from the loaded JSON catalog, optionally filtered by a keyword. This tool does not modify student data.",
      inputSchema: objectSchema({ query: stringField("Optional topic, role, degree, university, or opportunity keyword.") }),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      handler: async ({ query = "" }) => listCareerFields({ query }),
    },
    {
      name: "explore_career_path",
      title: "Explore one career path",
      description: "Read one JSON-backed career field, including roles, typical degrees, universities, tiered learning resources, scholarships, internships, and research contacts. Null URLs are returned as unverified rather than invented.",
      inputSchema: objectSchema({
        topic: stringField("Career field topic, such as AI/ML, Cybersecurity, Robotics, or Chip Design / VLSI."),
        role: stringField("Optional role within the selected field."),
      }, ["topic"]),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      handler: async ({ topic, role = "" }, { source = "" } = {}) => {
        const result = exploreCareerPath({ topic, role });
        if (result.status === "ok") {
          store.setState({ careerTopic: result.topic, careerRole: result.selectedRole, ...workspaceView(source, "career") }, { persist: false });
        }
        return result;
      },
    },
    {
      name: "recommend_career_paths",
      title: "Recommend career fields",
      description: "Rank JSON-backed career fields against a degree, interests, and skills. Recommendations are exploratory and retain the catalog's verification caveat.",
      inputSchema: objectSchema({
        degree: stringField("Student degree or intended major."),
        interests: stringArrayField("Interest keywords.", 12),
        skills: stringArrayField("Current or desired skill keywords.", 12),
        limit: intField("Maximum recommendations to return.", 1, 10),
      }),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      handler: async ({ degree = profile().degree, interests = profile().interests, skills = profile().skills.map((item) => item.name), limit = 5 }) => recommendCareerPaths({ degree, interests, skills, limit }),
    },
    {
      name: "compare_career_paths",
      title: "Compare career fields",
      description: "Compare up to five JSON-backed career fields by roles, degrees, learning resources, opportunity counts, research contacts, and verified-link coverage.",
      inputSchema: objectSchema({ topics: stringArrayField("Career field topics to compare.", 5) }, ["topics"]),
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      handler: async ({ topics }) => compareCareerPaths(topics),
    },
    {
      name: "get_student_profile",
      title: "Read student profile",
      description: "Read the signed-in student's academic profile, career goal, interests, skills, and planning preferences. This tool does not modify any data.",
      inputSchema: objectSchema(),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async () => {
        const value = profile();
        return {
          id: value.id,
          name: value.name,
          degree: value.degree,
          stream: value.stream,
          standing: value.standing,
          graduationTarget: value.graduationTarget,
          careerGoal: value.careerGoal,
          careerField: store.getState().profileCareerTopic || "",
          gpa: value.gpa,
          creditsEarned: value.creditsEarned,
          creditsRequired: value.creditsRequired,
          skills: value.skills,
          interests: value.interests,
          preferences: value.preferences,
        };
      },
    },
    {
      name: "get_degree_requirements",
      title: "Read degree requirements",
      description: "Read graduation-credit requirements, academic thresholds, streams, and requirement groups for the student's degree. This tool does not modify any data.",
      inputSchema: objectSchema(),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async () => ({ ...degreeProgram, progress: getDegreeProgress(profile()) }),
    },
    {
      name: "get_completed_courses",
      title: "Read completed courses",
      description: "Read the student's completed courses and the skills associated with each course. This tool does not modify any data.",
      inputSchema: objectSchema(),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async () => getCompletedCourseDetails(profile()),
    },
    {
      name: "check_prerequisites",
      title: "Check course prerequisites",
      description: "Check whether the student currently meets the prerequisites for one course. This tool does not enroll the student or change the plan.",
      inputSchema: objectSchema({ courseCode: stringField("Course code such as CS410.") }, ["courseCode"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ courseCode }) => checkPrerequisites(String(courseCode).toUpperCase(), profile().completedCourses),
    },
    {
      name: "get_available_courses",
      title: "Find available courses",
      description: "Find courses offered in a term whose prerequisites the student currently meets. This tool does not change the student's plan.",
      inputSchema: objectSchema({ term: stringField("Academic term such as Fall 2026.") }, ["term"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ term }) => getAvailableCourses(term, profile().completedCourses),
    },
    {
      name: "simulate_degree_plan",
      title: "Simulate a degree plan",
      description: "Create a non-binding semester-by-semester degree-plan simulation aligned to a career goal. This is a preview and does not change the official student plan.",
      inputSchema: objectSchema({
        careerGoal: stringField("Career goal to optimize for, such as Penetration Tester, Robotics Engineer, or Data Scientist."),
        workload: stringField("Preferred workload.", { enum: ["lighter", "balanced", "accelerated"] }),
        includeResearch: boolField("Whether to include an independent-research course when feasible."),
      }),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ careerGoal, workload = "balanced", includeResearch = true }, { source = "" } = {}) => {
        const plan = simulateDegreePlan({ profile: profile(), careerGoal: careerGoal || profile().careerGoal, workload, includeResearch });
        store.setState((state) => ({ ...state, pathway: { ...state.pathway, plan }, workload, ...workspaceView(source, "degree") }), { persist: false });
        return plan;
      },
    },
    {
      name: "create_degree_plan",
      title: "Propose an official degree plan",
      description: "Prepare a semester plan and place it in the student's approval queue. This tool does not change the official plan until the student explicitly approves it in PathwayOS.",
      inputSchema: objectSchema({
        careerGoal: stringField("Career goal to optimize for."),
        workload: stringField("Preferred workload.", { enum: ["lighter", "balanced", "accelerated"] }),
      }),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ careerGoal, workload = "balanced" }, { source = "" } = {}) => {
        const plan = simulateDegreePlan({ profile: profile(), careerGoal: careerGoal || profile().careerGoal, workload });
        const approval = store.queueApproval({
          actionType: "create_degree_plan",
          title: `Adopt the ${plan.goal} degree plan`,
          summary: `Replace the official plan with a ${workload} pathway toward ${plan.goal}, targeting ${plan.graduationTarget}.`,
          payload: { plan },
        });
        store.setState({ agentOpen: true, ...workspaceView(source, "approvals") }, { persist: false });
        return { status: "awaiting_student_confirmation", approvalId: approval.id, proposedPlan: compactResult(plan) };
      },
    },
    {
      name: "add_course_to_plan",
      title: "Propose adding a course",
      description: "Place a request to add one course to one term in the student's approval queue. This tool never changes the plan without explicit student approval.",
      inputSchema: objectSchema({
        courseCode: stringField("Course code such as CS410."),
        termId: stringField("Plan term identifier such as spring-2027."),
        rationale: stringField("Why this course supports the student's goal."),
      }, ["courseCode", "termId", "rationale"]),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ courseCode, termId, rationale }, { source = "" } = {}) => {
        const normalized = String(courseCode).toUpperCase();
        const course = getCourse(normalized);
        if (!course) return { status: "not_found", courseCode: normalized };
        const approval = store.queueApproval({
          actionType: "add_course_to_plan",
          title: `Add ${normalized} to the degree plan`,
          summary: `${course.title} will be added to ${termId.replace("-", " ")}. Reason: ${rationale}`,
          payload: { courseCode: normalized, termId, rationale },
        });
        store.setState({ agentOpen: true, ...workspaceView(source, "approvals") }, { persist: false });
        return { status: "awaiting_student_confirmation", approvalId: approval.id, course: { code: course.code, title: course.title, credits: course.credits } };
      },
    },
    {
      name: "identify_skill_gaps",
      title: "Identify career skill gaps",
      description: "Compare current and planned skills with a career target, identifying gaps and courses that cover them. This tool does not modify data.",
      inputSchema: objectSchema({ careerGoal: stringField("Career goal to evaluate.") }),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ careerGoal }, { source = "" } = {}) => {
        const gaps = identifySkillGaps({ profile: profile(), careerGoal: careerGoal || profile().careerGoal, plan: currentPlan() });
        store.setState((state) => ({ ...state, pathway: { ...state.pathway, gaps }, ...workspaceView(source, "roadmap") }), { persist: false });
        return gaps;
      },
    },
    {
      name: "find_research_opportunities",
      title: "Find matched research",
      description: "Search and rank curated university research projects using the student's interests, skills, GPA, completed coursework, and planned coursework. This tool does not save or contact anyone.",
      inputSchema: objectSchema({
        query: stringField("Optional topic, skill, lab, or keyword."),
        eligibleOnly: boolField("Return only projects for which academic eligibility is met or covered by the plan."),
        limit: intField("Maximum number of matches to return.", 1, 15),
      }),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ query = "", eligibleOnly = false, limit = 5 }, { source = "" } = {}) => {
        const ranked = rankResearch({ profile: profile(), careerGoal: profile().careerGoal, plan: currentPlan(), limit: 15 });
        const results = searchRanked(ranked, query, { eligibleOnly }).slice(0, limit);
        store.setState({ opportunityType: "research", ...workspaceView(source, "opportunities") }, { persist: false });
        return results;
      },
    },
    {
      name: "get_research_project",
      title: "Read research project",
      description: "Read full details for one research opportunity. This tool does not save the project or contact the professor.",
      inputSchema: objectSchema({ opportunityId: stringField("Research opportunity identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => {
        const item = getOpportunity(opportunityId);
        return item?.type === "research" ? item : { status: "not_found" };
      },
    },
    {
      name: "check_research_eligibility",
      title: "Check research eligibility",
      description: "Check eligibility, missing skills, and missing coursework for one research project. This tool does not express interest or contact a professor.",
      inputSchema: objectSchema({ opportunityId: stringField("Research opportunity identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => rankResearch({ profile: profile(), plan: currentPlan() }).find((item) => item.id === opportunityId) || { status: "not_found" },
    },
    {
      name: "save_research_opportunity",
      title: "Propose saving research",
      description: "Place a research-save request in the student's approval queue. The project is not saved until the student explicitly approves it.",
      inputSchema: objectSchema({ opportunityId: stringField("Research opportunity identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ opportunityId }) => queueSave(store, opportunityId, "research"),
    },
    {
      name: "express_research_interest",
      title: "Propose research interest",
      description: "Prepare an expression-of-interest action for a research project and place it in the approval queue. No professor is contacted until the student approves and completes the action.",
      inputSchema: objectSchema({
        opportunityId: stringField("Research opportunity identifier."),
        note: stringField("Optional message context for the professor."),
      }, ["opportunityId"]),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ opportunityId, note = "" }) => {
        const item = getOpportunity(opportunityId);
        if (!item || item.type !== "research") return { status: "not_found" };
        const approval = store.queueApproval({
          actionType: "express_research_interest",
          title: `Prepare interest for ${item.lab}`,
          summary: `Prepare an interest request for “${item.title}” with ${item.professor}.${note ? ` Note: ${note}` : ""}`,
          payload: { opportunityId, note },
        });
        return { status: "awaiting_student_confirmation", approvalId: approval.id };
      },
    },
    {
      name: "find_scholarships",
      title: "Find matched scholarships",
      description: "Search and rank curated scholarships using degree, standing, GPA, interests, and career pathway. This tool does not start an application.",
      inputSchema: objectSchema({
        query: stringField("Optional keyword, provider, or scholarship focus."),
        eligibleOnly: boolField("Return only scholarships that meet the visible eligibility rules."),
        limit: intField("Maximum number of matches to return.", 1, 20),
      }),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ query = "", eligibleOnly = false, limit = 5 }, { source = "" } = {}) => {
        const results = searchRanked(rankScholarships({ profile: profile(), careerGoal: profile().careerGoal }), query, { eligibleOnly }).slice(0, limit);
        store.setState({ opportunityType: "scholarship", ...workspaceView(source, "opportunities") }, { persist: false });
        return results;
      },
    },
    {
      name: "get_scholarship_details",
      title: "Read scholarship details",
      description: "Read full eligibility, funding, deadline, and application requirements for one scholarship. This tool does not start an application.",
      inputSchema: objectSchema({ opportunityId: stringField("Scholarship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => {
        const item = getOpportunity(opportunityId);
        return item?.type === "scholarship" ? item : { status: "not_found" };
      },
    },
    {
      name: "check_scholarship_eligibility",
      title: "Check scholarship eligibility",
      description: "Check the visible eligibility conditions for one scholarship. This tool does not start or submit an application.",
      inputSchema: objectSchema({ opportunityId: stringField("Scholarship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => rankScholarships({ profile: profile() }).find((item) => item.id === opportunityId) || { status: "not_found" },
    },
    {
      name: "save_scholarship",
      title: "Propose saving a scholarship",
      description: "Place a scholarship-save request in the student's approval queue. The scholarship is not saved until the student explicitly approves it.",
      inputSchema: objectSchema({ opportunityId: stringField("Scholarship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ opportunityId }) => queueSave(store, opportunityId, "scholarship"),
    },
    {
      name: "update_scholarship_status",
      title: "Propose scholarship status update",
      description: "Place a requested scholarship application-status change in the approval queue. No status is changed until the student approves it.",
      inputSchema: objectSchema({
        opportunityId: stringField("Scholarship identifier."),
        status: stringField("New application status.", { enum: ["Saved", "Preparing", "Submitted", "Awarded", "Not selected"] }),
      }, ["opportunityId", "status"]),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ opportunityId, status }) => queueStatus(store, opportunityId, "scholarship", status),
    },
    {
      name: "find_internships",
      title: "Find matched internships",
      description: "Search and rank curated internships using current and planned skills, coursework, GPA, location preferences, and career goal. This tool does not apply to a job.",
      inputSchema: objectSchema({
        query: stringField("Optional role, company, location, or skill keyword."),
        eligibleOnly: boolField("Return only internships whose visible academic requirements are met or covered by the plan."),
        limit: intField("Maximum number of matches to return.", 1, 20),
      }),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ query = "", eligibleOnly = false, limit = 5 }, { source = "" } = {}) => {
        const results = searchRanked(rankInternships({ profile: profile(), careerGoal: profile().careerGoal, plan: currentPlan() }), query, { eligibleOnly }).slice(0, limit);
        store.setState({ opportunityType: "internship", ...workspaceView(source, "opportunities") }, { persist: false });
        return results;
      },
    },
    {
      name: "get_internship_details",
      title: "Read internship details",
      description: "Read full role, location, timing, skills, and preferred coursework for one internship. This tool does not apply to the role.",
      inputSchema: objectSchema({ opportunityId: stringField("Internship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => {
        const item = getOpportunity(opportunityId);
        return item?.type === "internship" ? item : { status: "not_found" };
      },
    },
    {
      name: "check_internship_eligibility",
      title: "Check internship eligibility",
      description: "Check academic eligibility, matching skills, missing skills, and missing coursework for one internship. This tool does not apply to the role.",
      inputSchema: objectSchema({ opportunityId: stringField("Internship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => rankInternships({ profile: profile(), plan: currentPlan() }).find((item) => item.id === opportunityId) || { status: "not_found" },
    },
    {
      name: "compare_student_skills",
      title: "Compare skills with an internship",
      description: "Compare current and planned student skills with one internship's requested skills. This tool does not modify the degree plan or application status.",
      inputSchema: objectSchema({ opportunityId: stringField("Internship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => {
        const match = rankInternships({ profile: profile(), plan: currentPlan() }).find((item) => item.id === opportunityId);
        return match ? { opportunityId, matchScore: match.matchScore, matchingSkills: match.skills.filter((skill) => !match.missingSkills.includes(skill)), missingSkills: match.missingSkills, missingCourses: match.missingCourses } : { status: "not_found" };
      },
    },
    {
      name: "identify_missing_skills",
      title: "Identify missing internship skills",
      description: "Identify the missing skills for one internship and recommend courses from the student's catalog that can close them. This tool does not change the plan.",
      inputSchema: objectSchema({ opportunityId: stringField("Internship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ opportunityId }) => {
        const match = rankInternships({ profile: profile(), plan: currentPlan() }).find((item) => item.id === opportunityId);
        if (!match) return { status: "not_found" };
        return {
          opportunityId,
          missingSkills: match.missingSkills,
          recommendedCourses: match.missingSkills.map((skill) => ({
            skill,
            courses: ["CS410", "CS421", "CS430", "CS420", "CS330"].map(getCourse).filter(Boolean).filter((course) => course.skills.includes(skill)).map((course) => ({ code: course.code, title: course.title })),
          })),
        };
      },
    },
    {
      name: "save_internship",
      title: "Propose saving an internship",
      description: "Place an internship-save request in the student's approval queue. The internship is not saved until the student explicitly approves it.",
      inputSchema: objectSchema({ opportunityId: stringField("Internship identifier.") }, ["opportunityId"]),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ opportunityId }) => queueSave(store, opportunityId, "internship"),
    },
    {
      name: "update_internship_status",
      title: "Propose internship status update",
      description: "Place a requested internship application-status change in the approval queue. No status is changed until the student approves it.",
      inputSchema: objectSchema({
        opportunityId: stringField("Internship identifier."),
        status: stringField("New application status.", { enum: ["Saved", "Preparing", "Applied", "Interview", "Offer", "Closed"] }),
      }, ["opportunityId", "status"]),
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      handler: async ({ opportunityId, status }) => queueStatus(store, opportunityId, "internship", status),
    },
    {
      name: "build_personalized_pathway",
      title: "Build the complete student pathway",
      description: "Combine degree planning, skill-gap analysis, research, scholarships, and internships into one non-binding academic-to-career roadmap. This tool does not change official records or submit applications.",
      inputSchema: objectSchema({
        careerGoal: stringField("Career goal to optimize for."),
        workload: stringField("Preferred workload.", { enum: ["lighter", "balanced", "accelerated"] }),
      }),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async ({ careerGoal, workload = "balanced" }, { source = "" } = {}) => {
        const pathway = buildPersonalizedPathway({ profile: profile(), careerGoal: careerGoal || profile().careerGoal, workload });
        store.setState({ pathway, pathwayGenerated: true, workload, ...workspaceView(source, "overview") }, { persist: false });
        return pathway;
      },
    },
    {
      name: "get_pending_approvals",
      title: "Read pending student approvals",
      description: "Read actions proposed by the agent that still require the student's explicit approval. This tool cannot approve or reject actions.",
      inputSchema: objectSchema(),
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      handler: async () => store.getState().pendingApprovals.map(({ id, actionType, title, summary, createdAt }) => ({ id, actionType, title, summary, createdAt })),
    },
  ];

  async function run(definition, input = {}, source = "demo-agent", signal = new AbortController().signal) {
    assertNotAborted(signal);
    const started = performance.now();
    try {
      const output = await definition.handler(input, { signal, source });
      assertNotAborted(signal);
      store.recordToolActivity({ name: definition.name, input, output: compactResult(output), source, status: "completed", durationMs: Math.round(performance.now() - started) });
      return output;
    } catch (error) {
      store.recordToolActivity({ name: definition.name, input, output: { error: error instanceof Error ? error.message : "Unknown error" }, source, status: "failed", durationMs: Math.round(performance.now() - started) });
      throw error;
    }
  }

  const publicTools = definitions.map(({ handler, ...tool }) => ({
    ...tool,
    execute: (input, options = {}) => run({ ...tool, handler }, input, "native-agent", options.signal),
  }));

  const registry = new Map(definitions.map((definition) => [definition.name, definition]));
  const execute = async (name, input = {}, source = "demo-agent") => {
    const definition = registry.get(name);
    if (!definition) throw new Error(`Unknown PathwayOS tool: ${name}`);
    return run(definition, input, source);
  };

  let controller = null;
  let lastRegistrationReport = null;

  async function discoverNativeTools() {
    if (typeof document?.modelContext?.getTools !== "function") {
      return { supported: false, count: null, names: [], tools: [], error: null };
    }
    try {
      const discovered = await document.modelContext.getTools();
      const expectedNames = new Set(definitions.map((tool) => tool.name));
      const tools = discovered
        .filter((tool) => expectedNames.has(tool.name))
        .map((tool) => ({
          name: tool.name,
          title: tool.title || "",
          description: tool.description || "",
          origin: tool.origin || "",
          annotations: tool.annotations || null,
        }));
      return { supported: true, count: tools.length, names: tools.map((tool) => tool.name), tools, error: null };
    } catch (error) {
      return { supported: true, count: 0, names: [], tools: [], error: webMCPError(error) };
    }
  }

  async function register() {
    const expectedCount = definitions.length;
    const environment = readWebMCPEnvironment();
    store.setState({
      nativeWebMCP: false,
      registeredToolCount: 0,
      webMCPExpectedToolCount: expectedCount,
      webMCPStatus: "checking",
      webMCPFailures: [],
      webMCPDiscoveredToolNames: [],
      webMCPEnvironment: environment,
    }, { persist: false });

    if (typeof document?.modelContext?.registerTool !== "function") {
      const report = {
        native: false,
        status: "api_unavailable",
        expectedCount,
        count: 0,
        registered: [],
        discovered: [],
        failures: [{ name: "WebMCP API", error: "document.modelContext.registerTool is unavailable. Enable the WebMCP testing flag and relaunch Chrome." }],
        environment,
      };
      lastRegistrationReport = report;
      store.setState({
        nativeWebMCP: false,
        registeredToolCount: 0,
        webMCPStatus: report.status,
        webMCPFailures: report.failures,
        webMCPEnvironment: environment,
      }, { persist: false });
      return report;
    }

    controller?.abort();
    controller = new AbortController();
    const registration = await registerPathwaySiteTools(publicTools, { signal: controller.signal });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const discovery = await discoverNativeTools();
    const registrationComplete = registration.count === expectedCount && registration.failures.length === 0;
    const discoveryComplete = !discovery.supported || discovery.count === expectedCount;
    const native = registrationComplete && discoveryComplete;
    const failures = [...registration.failures];
    if (discovery.error) failures.push({ name: "getTools", error: `${discovery.error.name}: ${discovery.error.message}` });
    if (discovery.supported && discovery.count !== expectedCount && !discovery.error) {
      failures.push({ name: "discovery", error: `Chrome discovered ${discovery.count} of ${expectedCount} PathwayOS tools after registration.` });
    }
    const status = native ? "registered" : registration.count > 0 ? "partial" : "registration_failed";
    const report = {
      native,
      status,
      expectedCount,
      count: discovery.supported ? discovery.count : registration.count,
      registrationCount: registration.count,
      registered: registration.registered,
      discovered: discovery.names,
      failures,
      environment,
    };
    lastRegistrationReport = report;
    store.setState({
      nativeWebMCP: native,
      registeredToolCount: report.count,
      webMCPExpectedToolCount: expectedCount,
      webMCPStatus: status,
      webMCPFailures: failures,
      webMCPDiscoveredToolNames: discovery.names,
      webMCPEnvironment: environment,
    }, { persist: false });
    return report;
  }

  async function diagnostics() {
    const environment = readWebMCPEnvironment();
    const discovery = await discoverNativeTools();
    return {
      environment,
      expectedCount: definitions.length,
      registration: lastRegistrationReport,
      discoveredCount: discovery.count,
      discoveredNames: discovery.names,
      discoveryError: discovery.error,
    };
  }

  async function reregister() {
    unregister();
    return register();
  }

  function unregister() {
    controller?.abort();
    controller = null;
  }

  return {
    definitions,
    publicTools,
    execute,
    register,
    reregister,
    diagnostics,
    discoverNativeTools,
    getRegistrationReport: () => lastRegistrationReport,
    unregister,
  };
}

function queueSave(store, opportunityId, expectedType) {
  const item = getOpportunity(opportunityId);
  if (!item || item.type !== expectedType) return { status: "not_found" };
  const approval = store.queueApproval({
    actionType: "save_opportunity",
    title: `Save ${item.title}`,
    summary: `Add “${item.title}” to the student's saved ${expectedType} opportunities.`,
    payload: { opportunityId },
  });
  return { status: "awaiting_student_confirmation", approvalId: approval.id, opportunity: { id: item.id, title: item.title } };
}

function queueStatus(store, opportunityId, opportunityType, status) {
  const item = getOpportunity(opportunityId);
  if (!item || item.type !== opportunityType) return { status: "not_found" };
  const approval = store.queueApproval({
    actionType: "update_application_status",
    title: `Update status for ${item.title}`,
    summary: `Change the ${opportunityType} status for “${item.title}” to “${status}.”`,
    payload: { opportunityId, opportunityType, status },
  });
  return { status: "awaiting_student_confirmation", approvalId: approval.id };
}

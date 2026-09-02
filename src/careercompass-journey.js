import { student } from "./data.js";
import {
  exploreCareerPath,
  findCareerMatch,
  listCareerFields,
  recommendCareerPaths,
} from "./career-catalog.js";

export const JOURNEY_STEPS = [
  { id: "direction", label: "Direction", short: "Choose a supported career area" },
  { id: "role", label: "Role", short: "Choose the work you want" },
  { id: "priority", label: "Priority", short: "Decide what matters first" },
  { id: "route", label: "Academic route", short: "Fit the goal to your degree" },
  { id: "semester", label: "Next semester", short: "Choose a realistic course plan" },
  { id: "skills", label: "Skill sprint", short: "Focus on one gap at a time" },
  { id: "experience", label: "Experience", short: "Choose the next proof point" },
  { id: "funding", label: "Funding", short: "Add only relevant support" },
  { id: "roadmap", label: "Roadmap", short: "Turn choices into actions" },
];

export const CAREER_GROUPS = [
  {
    id: "software-products",
    title: "Build software and digital products",
    description: "Create applications, websites, mobile products, platforms, cloud systems, or decentralized services.",
    icon: "code",
    topics: [
      "Software Engineering",
      "Web Development",
      "Mobile App Development",
      "Cloud Computing / DevOps",
      "Blockchain / Web3",
    ],
  },
  {
    id: "ai-data-computing",
    title: "Work with AI, data, and advanced computing",
    description: "Build intelligent systems, analyze data, model business decisions, or explore quantum computing.",
    icon: "sparkles",
    topics: [
      "AI/ML",
      "Data Science & Analytics",
      "Business Analytics / FinTech",
      "Quantum Computing",
    ],
  },
  {
    id: "security-networks",
    title: "Protect and connect systems",
    description: "Secure technology, investigate risk, or design the networks and communications that keep systems connected.",
    icon: "shield",
    topics: ["Cybersecurity", "Computer Networks"],
  },
  {
    id: "hardware-physical",
    title: "Build hardware, robots, and physical systems",
    description: "Combine software and engineering to create robots, chips, devices, electronics, or mechanical systems.",
    icon: "bolt",
    topics: [
      "Robotics",
      "Embedded Systems / IoT",
      "Electrical/Electronics Engineering",
      "Mechanical Engineering",
      "Chip Design / VLSI",
    ],
  },
  {
    id: "design-immersive",
    title: "Design human and immersive experiences",
    description: "Understand users or create interactive products, games, augmented reality, and virtual reality experiences.",
    icon: "target",
    topics: ["Human-Computer Interaction (UX/UI)", "AR/VR & Game Development"],
  },
  {
    id: "health-biology",
    title: "Apply technology to health and biology",
    description: "Use engineering, computation, and data to improve healthcare devices or understand biological systems.",
    icon: "flask",
    topics: ["Biomedical Engineering", "Bioinformatics / Computational Biology"],
  },
];

export function careerGroupChoices() {
  const available = new Set(listCareerFields().map((field) => field.topic));
  return CAREER_GROUPS.map((group) => ({
    ...group,
    topics: group.topics.filter((topic) => available.has(topic)),
  })).filter((group) => group.topics.length);
}

export function careerFieldsForGroup(groupId = "") {
  const group = careerGroupChoices().find((item) => item.id === groupId);
  if (!group) return [];
  return group.topics.map((topic) => {
    const detail = exploreCareerPath({ topic });
    return {
      topic,
      roles: detail.status === "ok" ? detail.careerPaths : [],
      typicalDegrees: detail.status === "ok" ? detail.typicalDegrees : [],
      context: fieldContext(topic),
    };
  });
}

export function allSupportedCareerFields() {
  return careerGroupChoices().map((group) => ({
    ...group,
    fields: careerFieldsForGroup(group.id),
  }));
}

export function supportedCareerCounts() {
  const fields = listCareerFields();
  return {
    fields: fields.length,
    roles: fields.reduce((total, field) => total + field.roles.length, 0),
  };
}

const FIELD_CONTEXT = {
  "AI/ML": {
    promise: "build systems that learn from data and make useful predictions or decisions",
    coreSkills: ["Python", "statistics", "model evaluation"],
    proof: "a working model with a clear evaluation report",
    project: "Build a small model, document the data, compare two approaches, and explain where it can fail.",
  },
  "Data Science & Analytics": {
    promise: "turn messy data into decisions people can act on",
    coreSkills: ["SQL", "statistics", "data storytelling"],
    proof: "an analysis that changes a decision, not just a dashboard",
    project: "Analyze a real dataset, identify one decision, and present a recommendation with evidence.",
  },
  Cybersecurity: {
    promise: "find, understand, and reduce security risk",
    coreSkills: ["networks", "threat modeling", "secure systems"],
    proof: "a documented lab, threat model, or responsible vulnerability report",
    project: "Create a legal practice lab, document an attack path, and show the controls that stop it.",
  },
  "Software Engineering": {
    promise: "design and ship reliable software used by real people",
    coreSkills: ["algorithms", "software design", "testing"],
    proof: "a maintained application with tests, documentation, and real users",
    project: "Build one useful application end to end, add tests, deploy it, and collect user feedback.",
  },
  "Cloud Computing / DevOps": {
    promise: "make software reliable, deployable, observable, and scalable",
    coreSkills: ["cloud platforms", "automation", "reliability"],
    proof: "a deployed service with monitoring and repeatable infrastructure",
    project: "Deploy a service with infrastructure as code, logs, alerts, and a recovery runbook.",
  },
  "Web Development": {
    promise: "create fast, accessible, useful experiences for the web",
    coreSkills: ["HTML/CSS", "JavaScript", "accessibility"],
    proof: "a polished web product that works across devices",
    project: "Build an accessible responsive product, measure performance, and test it with users.",
  },
  "Mobile App Development": {
    promise: "build focused experiences people can use anywhere",
    coreSkills: ["mobile UI", "platform APIs", "offline behavior"],
    proof: "a tested app installed on a real device",
    project: "Ship a small mobile app with local storage, notifications, and a clean onboarding flow.",
  },
  "Computer Networks": {
    promise: "keep systems connected, available, and secure",
    coreSkills: ["routing", "protocols", "network troubleshooting"],
    proof: "a reproducible network lab with diagnostics",
    project: "Design a segmented network, simulate failures, and document how you diagnosed them.",
  },
  Robotics: {
    promise: "combine software, sensing, and control to make machines act in the physical world",
    coreSkills: ["control systems", "robot perception", "C++/Python for robotics"],
    proof: "a robot or simulation completing a measurable task",
    project: "Use a simulator or small robot to sense, plan, and complete one repeatable task safely.",
  },
  "Blockchain / Web3": {
    promise: "design verifiable protocols and applications with shared state",
    coreSkills: ["distributed systems", "smart contracts", "security"],
    proof: "a tested contract or protocol with a clear threat model",
    project: "Build a small contract, test edge cases, and document security assumptions before deployment.",
  },
  "AR/VR & Game Development": {
    promise: "create interactive worlds, simulations, and immersive experiences",
    coreSkills: ["3D interaction", "game engines", "performance"],
    proof: "a playable experience with a clear interaction loop",
    project: "Create a small playable scene, test the core interaction, and optimize it for stable performance.",
  },
  "Human-Computer Interaction (UX/UI)": {
    promise: "understand people and turn their needs into usable products",
    coreSkills: ["user research", "prototyping", "accessibility"],
    proof: "a case study showing research, decisions, iterations, and outcomes",
    project: "Research one user problem, prototype two approaches, test them, and document what changed.",
  },
  "Quantum Computing": {
    promise: "develop algorithms and software for quantum systems",
    coreSkills: ["linear algebra", "quantum concepts", "algorithm design"],
    proof: "a clearly explained quantum experiment or simulation",
    project: "Implement a small circuit in a simulator, compare outcomes, and explain the classical tradeoff.",
  },
  "Embedded Systems / IoT": {
    promise: "make software work reliably with sensors, devices, and constrained hardware",
    coreSkills: ["C/C++", "microcontrollers", "hardware interfaces"],
    proof: "a physical prototype with measured reliability",
    project: "Build a sensor device, handle failures, and document power, timing, and communication behavior.",
  },
  "Electrical/Electronics Engineering": {
    promise: "design and improve electrical systems that power modern products",
    coreSkills: ["circuits", "signals", "measurement"],
    proof: "a simulated or built circuit with measured performance",
    project: "Design a circuit, simulate it, measure key behavior, and compare results with the design target.",
  },
  "Mechanical Engineering": {
    promise: "design physical products and manufacturing systems",
    coreSkills: ["mechanics", "CAD", "design analysis"],
    proof: "a tested design with calculations and iteration",
    project: "Design a mechanism, model loads, prototype it, and show how testing changed the design.",
  },
  "Biomedical Engineering": {
    promise: "apply engineering to safer, more useful healthcare technology",
    coreSkills: ["biomechanics", "device design", "validation"],
    proof: "a carefully scoped prototype with safety and user needs documented",
    project: "Prototype a low-risk health-related device concept and document needs, constraints, and validation steps.",
  },
  "Chip Design / VLSI": {
    promise: "design and verify the hardware that computing systems depend on",
    coreSkills: ["digital logic", "Verilog/SystemVerilog", "computer architecture"],
    proof: "a simulated hardware block with a strong verification plan",
    project: "Design a small RTL block, build a testbench, measure coverage, and explain timing tradeoffs.",
  },
  "Business Analytics / FinTech": {
    promise: "combine technology, data, and finance to improve business decisions",
    coreSkills: ["analytics", "financial reasoning", "communication"],
    proof: "a model or analysis tied to a business outcome",
    project: "Analyze a financial or business process, model alternatives, and recommend an action with assumptions.",
  },
  "Bioinformatics / Computational Biology": {
    promise: "use computation to understand biological data and systems",
    coreSkills: ["biology", "statistics", "scientific programming"],
    proof: "a reproducible analysis with biological interpretation",
    project: "Analyze a public biological dataset, document the pipeline, and explain what the result means biologically.",
  },
};

const ROLE_SUMMARIES = {
  "ML Engineer": "Build, evaluate, deploy, and improve machine-learning systems used in products.",
  "AI Research Scientist": "Design experiments and new methods, then communicate results through papers and prototypes.",
  "MLOps Engineer": "Create the pipelines, monitoring, and reliability controls that keep models working in production.",
  "Applied Scientist": "Use scientific experiments and models to solve a concrete product or business problem.",
  "Data Scientist": "Frame questions, analyze data, build models, and turn evidence into decisions.",
  "Data Analyst": "Use SQL, statistics, and visualization to explain what is happening and why.",
  "BI Engineer": "Build trustworthy data models, dashboards, and reporting systems for decision-makers.",
  "Security Analyst": "Monitor risk, investigate suspicious activity, and strengthen defensive controls.",
  "Penetration Tester": "Legally test systems for weaknesses and explain how to fix them responsibly.",
  "SOC Engineer": "Build and improve the detection, triage, and response systems used by a security operations center.",
  "Backend Engineer": "Design APIs, services, data flows, and reliability controls behind an application.",
  "Full-Stack Engineer": "Build complete user-facing products across the interface, APIs, and data layer.",
  "Platform Engineer": "Create internal platforms that make other engineering teams faster and safer.",
  "Cloud Engineer": "Design, automate, and operate cloud infrastructure for secure and scalable services.",
  SRE: "Use software engineering to improve reliability, observability, and incident response.",
  "DevOps Engineer": "Automate delivery, infrastructure, and operational feedback from code to production.",
  "Frontend Engineer": "Build accessible, high-performance interfaces and reusable design systems.",
  "Web Developer": "Create and maintain useful websites and web applications from requirements to deployment.",
  "UI Engineer": "Turn interaction and visual designs into polished, reusable product interfaces.",
  "iOS Engineer": "Build reliable applications for Apple platforms using native frameworks and device capabilities.",
  "Android Engineer": "Build reliable Android applications using native platform patterns and APIs.",
  "Cross-platform Developer": "Create shared mobile experiences that work well across multiple platforms.",
  "Network Engineer": "Design, secure, operate, and troubleshoot networks that connect systems and users.",
  "Telecom Engineer": "Build and optimize communications systems across wireless, carrier, and network infrastructure.",
  "Robotics Engineer": "Integrate sensing, planning, software, and hardware so robots complete real-world tasks.",
  "Controls Engineer": "Model and tune feedback systems so machines behave accurately and safely.",
  "Automation Engineer": "Design repeatable systems that improve industrial or operational processes.",
  "Smart Contract Engineer": "Build and secure on-chain applications whose rules are enforced by code.",
  "Protocol Engineer": "Design distributed protocols, incentives, and systems that coordinate shared state.",
  "Game Engineer": "Build gameplay systems, tools, and performance-sensitive interactive experiences.",
  "XR Developer": "Create immersive augmented, virtual, or mixed-reality interactions and simulations.",
  "Technical Artist": "Bridge art and engineering by building visual pipelines, shaders, tools, and optimized assets.",
  "UX Designer": "Turn user needs into clear flows, prototypes, and accessible product experiences.",
  "Product Designer": "Shape an end-to-end product experience through research, interaction, visual design, and iteration.",
  "UX Researcher": "Plan studies, understand user behavior, and turn evidence into product direction.",
  "Quantum Software Engineer": "Build software, tooling, and algorithms that run on or support quantum systems.",
  "Quantum Research Scientist": "Investigate new quantum methods, experiments, and theoretical approaches.",
  "Embedded Systems Engineer": "Write dependable low-level software that interacts directly with hardware.",
  "IoT Developer": "Connect devices, sensors, cloud services, and data into useful end-to-end systems.",
  EE: "Design, test, and improve electrical and electronic systems across products and infrastructure.",
  "RF Engineer": "Design and evaluate radio-frequency systems, antennas, and wireless performance.",
  "Power Systems Engineer": "Plan and improve the generation, transmission, distribution, and control of electrical power.",
  "Mechanical Design Engineer": "Turn requirements into physical designs, analyses, prototypes, and production-ready parts.",
  "Manufacturing Engineer": "Design reliable, efficient processes that turn product designs into repeatable production.",
  "Biomedical Device Engineer": "Design and validate devices that solve carefully defined healthcare needs.",
  "Clinical Engineer": "Manage and improve medical technology where engineering meets clinical operations.",
  "ASIC Design Engineer": "Translate specifications into digital hardware blocks and integrate them into chips.",
  "Verification Engineer": "Prove hardware behaves correctly by building testbenches, assertions, and coverage strategies.",
  "Physical Design Engineer": "Turn a logical chip design into a manufacturable layout that meets timing, power, and area goals.",
  "Business Analyst": "Clarify business problems, analyze processes and data, and guide practical improvements.",
  "Quant Analyst": "Use mathematics, statistics, and programming to model financial behavior and risk.",
  "FinTech Engineer": "Build secure financial products, data services, and transaction experiences.",
  "Bioinformatics Scientist": "Develop computational methods and pipelines for genomic and biological data.",
  "Computational Biologist": "Use models and data analysis to answer biological questions and test scientific hypotheses.",
};

const PROJECT_BY_PRIORITY = {
  internship: "I’ll optimize the next steps for internship readiness and application timing.",
  research: "I’ll prioritize faculty-ready skills, relevant coursework, and a credible research proof point.",
  portfolio: "I’ll organize the route around one strong project instead of many disconnected tutorials.",
  graduation: "I’ll protect your graduation timeline first, then layer career preparation around it.",
};

const ROUTE_COPY = {
  direct: {
    stay: "Keep your current degree and use career-aligned electives, projects, and experiences.",
    deepen: "Use a focused stream or minor to add depth without changing the core degree.",
  },
  adjacent: {
    bridge: "Keep the current degree and build a deliberate bridge through electives, projects, and a minor if available.",
    explore: "Compare a related major, minor, or graduate path before locking the plan.",
    advisor: "Pause major decisions and prepare an advisor conversation with the exact gaps to discuss.",
  },
  pivot: {
    bridge: "Keep the current degree, complete transferable foundations, and add targeted bridge work.",
    explore: "Explore changing or adding an engineering major/minor because the target field usually expects it.",
    advisor: "Create an advisor-first plan before making a high-impact program change.",
  },
};

export function fieldContext(topic = "") {
  return FIELD_CONTEXT[topic] || {
    promise: `build practical expertise in ${topic || "the selected field"}`,
    coreSkills: ["technical foundations", "problem solving", "communication"],
    proof: "a focused project with clear evidence of learning",
    project: "Build one small, complete project and document the problem, decisions, results, and next improvement.",
  };
}

export function roleSummary(role = "", topic = "") {
  return ROLE_SUMMARIES[role] || `Develop focused expertise and produce measurable work in ${topic || role || "this career area"}.`;
}

export function discoveryCandidates(text = "", profile = student) {
  const exact = findCareerMatch(text);
  const recommendations = recommendCareerPaths({
    degree: profile.degree,
    interests: [...profile.interests, text],
    skills: profile.skills.map((item) => item.name),
    limit: 6,
  });
  const ordered = [];
  const seen = new Set();
  const add = (topic, preferredRole = "", reason = "") => {
    if (!topic || seen.has(topic)) return;
    const detail = exploreCareerPath({ topic, role: preferredRole });
    if (detail.status !== "ok") return;
    seen.add(topic);
    ordered.push({
      topic: detail.topic,
      preferredRole: preferredRole || detail.selectedRole,
      roles: detail.careerPaths,
      reason,
      context: fieldContext(detail.topic),
    });
  };

  if (exact) add(exact.topic, exact.role, "Best match for what you described");
  for (const item of recommendations) {
    add(item.topic, item.roles[0], exact ? "A nearby direction worth comparing" : "Based on your degree, interests, and current skills");
  }
  return ordered.slice(0, 3);
}

export function roleChoices(topic, preferredRole = "", showAll = false) {
  const detail = exploreCareerPath({ topic, role: preferredRole });
  if (detail.status !== "ok") return [];
  let roles = [...detail.careerPaths];
  if (preferredRole && roles.includes(preferredRole)) {
    roles = [preferredRole, ...roles.filter((item) => item !== preferredRole)];
  }
  if (!showAll) roles = roles.slice(0, 3);
  return roles.map((role) => ({ role, summary: roleSummary(role, topic) }));
}

export function priorityOptions() {
  return [
    { id: "internship", title: "Land an internship", description: "Prioritize the skills, courses, and timing that improve internship readiness." },
    { id: "research", title: "Join research", description: "Build the prerequisites and evidence needed to approach a professor or lab." },
    { id: "portfolio", title: "Build a strong portfolio", description: "Create one career-specific project that proves what you can do." },
    { id: "graduation", title: "Graduate on time", description: "Protect degree requirements and workload before adding extra goals." },
  ];
}

export function priorityNarrative(priority) {
  return PROJECT_BY_PRIORITY[priority] || "I’ll use this priority to order the rest of your pathway.";
}

export function routeOptions(alignment) {
  const level = alignment?.level || "adjacent";
  if (level === "direct") {
    return [
      { id: "stay", title: "Stay in my current degree", description: ROUTE_COPY.direct.stay, recommended: true },
      { id: "deepen", title: "Add a focused stream or minor", description: ROUTE_COPY.direct.deepen },
    ];
  }
  return [
    { id: "bridge", title: "Keep my degree and bridge the gaps", description: ROUTE_COPY[level].bridge, recommended: level === "adjacent" },
    { id: "explore", title: "Explore a program change", description: ROUTE_COPY[level].explore, recommended: level === "pivot" },
    { id: "advisor", title: "Prepare an advisor-first plan", description: ROUTE_COPY[level].advisor },
  ];
}

export function academicRouteGuidance(route = "", alignment = {}, topic = "", priority = "") {
  const typical = (alignment?.typicalDegrees || []).slice(0, 2).join(" or ") || "the typical program for this field";
  const priorityText = priority === "internship"
    ? "Keep internship recruiting timing visible while you complete this checkpoint."
    : priority === "research"
      ? "Ask which prerequisite sequence makes you research-ready earliest."
      : priority === "portfolio"
        ? "Protect room for one portfolio proof project while you complete this checkpoint."
        : "Protect graduation requirements before adding optional work.";

  const routes = {
    stay: {
      title: "Lock the current degree route",
      detail: `Confirm that the remaining ${topic || "career"}-aligned electives fit inside the current degree audit. ${priorityText}`,
      label: "Current degree remains the primary route",
    },
    deepen: {
      title: "Confirm a focused stream or minor",
      detail: `Meet the program advisor to identify the smallest concentration, stream, or minor that strengthens ${topic || "this path"} without delaying graduation. ${priorityText}`,
      label: "Current degree plus a focused credential",
    },
    bridge: {
      title: `Confirm the bridge into ${topic || "the selected field"}`,
      detail: `Keep the current degree, reserve elective space for the field-specific gaps, and verify which courses or projects count toward both graduation and career readiness. ${priorityText}`,
      label: "Current degree plus targeted bridge work",
    },
    explore: {
      title: `Compare program-change requirements for ${topic || "this field"}`,
      detail: `Before changing programs, compare the current degree with ${typical}, identify transferable credits, and review the decision with an academic advisor. The next-term courses shown are the safest transferable steps while that review happens. ${priorityText}`,
      label: "Program change under structured review",
    },
    advisor: {
      title: "Complete an advisor-first decision review",
      detail: `Bring the career goal, completed-course history, typical degree routes, and next-term alternatives to an advisor before treating any plan as official. ${priorityText}`,
      label: "No high-impact change before advisor review",
    },
  };
  return routes[route] || {
    title: "Confirm the academic route",
    detail: `Validate how the current program supports ${topic || "the selected career"} before committing the next term. ${priorityText}`,
    label: alignment?.label || "Academic route review",
  };
}

export function workloadOptions() {
  return [
    { id: "lighter", title: "Lighter", description: "More room for work, family, research, or skill-building." },
    { id: "balanced", title: "Balanced", description: "A realistic mix of degree progress and career preparation.", recommended: true },
    { id: "accelerated", title: "Accelerated", description: "Faster progress with less room for outside commitments." },
  ];
}

export function skillChoices(gaps = [], detail = null) {
  const gapItems = Array.isArray(gaps?.gaps) ? gaps.gaps : Array.isArray(gaps) ? gaps : [];
  const fromGaps = gapItems
    .map((item) => typeof item === "string" ? { skill: item, level: 0 } : { skill: item.skill || item.name, level: item.currentLevel ?? item.level ?? 0 })
    .filter((item) => item.skill);
  const context = fieldContext(detail?.topic || "");
  const gapByName = new Map(fromGaps.map((item) => [item.skill.toLowerCase(), item]));
  const contextual = context.coreSkills.map((skill) => gapByName.get(skill.toLowerCase()) || ({ skill, level: 0 }));
  const merged = [];
  const seen = new Set();
  for (const item of [...contextual, ...fromGaps]) {
    const key = item.skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      skill: item.skill,
      level: item.level,
      reason: `${item.skill} is one of the clearest next capabilities for ${detail?.selectedRole || detail?.topic || "this path"}.`,
    });
  }
  return merged.slice(0, 3);
}

export function pickLearningAction(detail, skill) {
  const tiers = ["beginner", "intermediate", "advanced"];
  const normalized = String(skill || "").toLowerCase();
  let resource = null;
  for (const tier of tiers) {
    const items = detail?.learningPath?.[tier] || [];
    resource = items.find((item) => `${item.name || ""} ${item.where || ""}`.toLowerCase().includes(normalized));
    if (resource) return { ...resource, tier };
  }
  for (const tier of tiers) {
    const item = detail?.learningPath?.[tier]?.[0];
    if (item) return { ...item, tier };
  }
  return null;
}

export function portfolioProject(topic, role, skill) {
  const context = fieldContext(topic);
  return {
    title: `${role || topic} proof project`,
    description: context.project,
    focus: skill || context.coreSkills[0],
    evidence: context.proof,
  };
}

export function catalogOpportunityChoices(detail, type, limit = 2) {
  if (!detail || detail.status !== "ok") return [];
  const source = type === "research"
    ? detail.researchContacts
    : type === "scholarship"
      ? detail.scholarships
      : detail.internships;
  return (source || []).slice(0, limit).map((item, index) => ({
    id: `${type}_${index}_${String(item.name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    type,
    title: item.name || "Career opportunity",
    organization: item.affiliation || item.where || detail.topic,
    note: item.note || (type === "research" ? `Research connection related to ${detail.topic}` : `Listed for ${detail.topic}`),
    url: item.url || null,
    verified: Boolean(item.url),
    source: "career-catalog",
  }));
}

function getCareerDegreeAlignmentForMilestone(topic = "") {
  const pivot = new Set(["Electrical/Electronics Engineering", "Mechanical Engineering", "Biomedical Engineering", "Chip Design / VLSI"]);
  if (pivot.has(topic)) return { level: "pivot", typicalDegrees: exploreCareerPath({ topic }).typicalDegrees || [] };
  const detail = exploreCareerPath({ topic });
  const degrees = detail?.typicalDegrees || [];
  const direct = degrees.some((degree) => String(degree).toLowerCase().includes("computer science"));
  return { level: direct ? "direct" : "adjacent", typicalDegrees: degrees };
}

export function finalMilestones({ role, topic, route, plan, skill, experience, scholarship, priority }) {
  const nextTerm = plan?.terms?.find((term) => term.courses?.length) || plan?.terms?.[0];
  const firstCourse = nextTerm?.courses?.[0];
  const context = fieldContext(topic);
  const alignment = getCareerDegreeAlignmentForMilestone(topic);
  const routeAction = academicRouteGuidance(route, alignment, topic, priority);
  return [
    {
      horizon: "This week",
      title: routeAction.title,
      detail: `${routeAction.detail} Career anchor: ${role}.`,
      status: "ready",
    },
    {
      horizon: nextTerm?.label || "Next semester",
      title: firstCourse ? `Start with ${firstCourse.code} — ${firstCourse.title}` : "Protect the next academic milestone",
      detail: nextTerm?.courses?.length ? `${nextTerm.courses.length} focused courses in the proposed ${plan.workload || "balanced"} plan.` : "Use the advisor plan to identify the next required course.",
      status: "planned",
    },
    {
      horizon: "Next 30 days",
      title: `Build ${skill || context.coreSkills[0]}`,
      detail: context.project,
      status: "planned",
    },
    {
      horizon: "Next experience",
      title: experience?.title || (priority === "research" ? "Approach one relevant lab" : "Apply to one focused opportunity"),
      detail: experience?.note || `Use ${context.proof} as your evidence of readiness.`,
      status: "planned",
    },
    {
      horizon: "Funding check",
      title: scholarship?.title || "Review only career-relevant funding",
      detail: scholarship?.note || "Skip generic funding noise and revisit when a relevant cycle opens.",
      status: scholarship ? "planned" : "optional",
    },
  ];
}

export function emptyJourney() {
  return {
    currentStep: "direction",
    completedSteps: [],
    messages: [
      {
        id: "welcome",
        role: "assistant",
        title: "Let’s build your pathway one decision at a time.",
        text: "Start by choosing from the career areas supported in this version. Each selection narrows the next step, so you never need to type an unsupported career or scan the entire catalog.",
      },
    ],
    directionMode: "groups",
    selectedGroup: "",
    draft: "",
    discoveryText: "",
    candidates: [],
    selectedTopic: "",
    suggestedRole: "",
    selectedRole: "",
    showAllRoles: false,
    priority: "",
    route: "",
    workload: "balanced",
    plan: null,
    planApprovalId: "",
    planApproved: false,
    skillOptions: [],
    selectedSkill: "",
    learningAction: null,
    experienceType: "",
    experienceChoices: [],
    selectedExperience: null,
    experienceApprovalId: "",
    experienceSaved: false,
    fundingChoice: "",
    scholarshipChoices: [],
    selectedScholarship: null,
    scholarshipApprovalId: "",
    scholarshipSaved: false,
    finalPathway: null,
    toolLog: [],
    busy: false,
    activeTool: "",
    activityOpen: false,
    summaryOpen: true,
    error: "",
  };
}

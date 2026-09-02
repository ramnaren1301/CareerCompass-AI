import { buildPersonalizedPathway, getCourse, getOpportunity, simulateDegreePlan } from "./engine.js";
import { student } from "./data.js";
import { getCareerCatalogStatus, getCareerField } from "./career-catalog.js";

const STORAGE_KEY = "careercompass-ai-demo-state-v6-careercompass-ai";
const LEGACY_STORAGE_KEYS = ["careercompass-ai-demo-state-v2", "careercompass-ai-demo-state-v3", "careercompass-ai-demo-state-v4", "careercompass-ai-demo-state-v5"];
const MIGRATION_STORAGE_KEYS = [];
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function createWelcomeMessage() {
  return {
    id: "welcome",
    role: "assistant",
    label: "Welcome to CareerCompass AI",
    text: "Hi Maya — tell me what kind of work you want to do after graduation. I can help you choose a career, build a degree plan, find research, scholarships, and internships, and route important changes to your approval queue.",
    actions: [
      { label: "Help me choose a career", action: "choose-career", primary: true },
      { label: "Show all workflows", action: "capabilities" },
    ],
    timestamp: now(),
  };
}

function loadPersisted() {
  if (typeof window === "undefined") return {};
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    return current ? JSON.parse(current) : {};
  } catch {
    return {};
  }
}

function persist(state) {
  if (typeof window === "undefined") return;
  const payload = {
    saved: state.saved,
    applications: state.applications,
    officialPlan: state.officialPlan,
    approvalHistory: state.approvalHistory.slice(0, 30),
    profileGoal: state.profileGoal,
    profileCareerTopic: state.profileCareerTopic,
    careerTopic: state.careerTopic,
    careerRole: state.careerRole,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // The application remains fully usable when storage is blocked by browser policy.
  }
}

function resolveCareerSelection(topic = "", role = "") {
  if (!String(topic || "").trim() && !String(role || "").trim()) return null;
  const field = getCareerField(topic || role);
  if (!field) return null;
  const selectedRole = field.career_paths.find((item) => item.role === role)?.role
    || field.career_paths.find((item) => item.role === topic)?.role
    || field.career_paths[0]?.role
    || field.topic;
  return { field, topic: field.topic, role: selectedRole };
}

export function createInitialState() {
  const persisted = loadPersisted();
  const savedSelection = resolveCareerSelection(
    persisted.profileCareerTopic || persisted.careerTopic || persisted.profileGoal || "",
    persisted.profileGoal || "",
  );
  const profileGoal = savedSelection?.role || "";
  const profileCareerTopic = savedSelection?.topic || "";
  const pathway = buildPersonalizedPathway({ careerGoal: profileGoal, workload: "balanced" });

  const explorerField = getCareerField(persisted.careerTopic || profileCareerTopic || "AI/ML") || getCareerField();
  const explorerRole = explorerField?.career_paths.some((item) => item.role === persisted.careerRole)
    ? persisted.careerRole
    : profileCareerTopic === explorerField?.topic && profileGoal
      ? profileGoal
      : explorerField?.career_paths[0]?.role || "";

  return {
    view: "overview",
    mobileMenuOpen: false,
    agentOpen: typeof window !== "undefined" && window.matchMedia?.("(min-width: 1121px)").matches === true,
    agentUnreadCount: 0,
    opportunityType: "research",
    opportunitySearch: "",
    eligibilityOnly: false,
    careerTopic: explorerField?.topic || "AI/ML",
    careerRole: explorerRole,
    careerSearch: "",
    careerCatalogStatus: getCareerCatalogStatus(),
    selectedOpportunityId: null,
    workload: "balanced",
    profileGoal,
    profileCareerTopic,
    goalPickerOpen: !profileGoal,
    goalBrowseOpen: false,
    goalBrowseSearch: "",
    goalCandidate: null,
    goalError: "",
    pathway,
    pathwayGenerated: Boolean(profileGoal),
    officialPlan: profileGoal ? persisted.officialPlan || null : null,
    saved: persisted.saved || { research: [], scholarship: [], internship: [] },
    applications: persisted.applications || {},
    pendingApprovals: [],
    approvalHistory: persisted.approvalHistory || [],
    toolActivity: [],
    agentMessages: [createWelcomeMessage()],
    agentRunning: false,
    agentDraft: "",
    nativeWebMCP: false,
    registeredToolCount: 0,
    webMCPExpectedToolCount: 33,
    webMCPStatus: "checking",
    webMCPFailures: [],
    webMCPDiscoveredToolNames: [],
    webMCPEnvironment: null,
    notice: null,
  };
}

export function createStore(initial = createInitialState()) {
  let state = initial;
  const listeners = new Set();

  const getState = () => state;
  const notify = () => listeners.forEach((listener) => listener(state));
  const setState = (update, options = {}) => {
    state = typeof update === "function" ? update(state) : { ...state, ...update };
    if (options.persist !== false) persist(state);
    notify();
    return state;
  };
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  function appendMessage(message) {
    const messageId = message.id || id("msg");
    setState((current) => ({
      ...current,
      agentMessages: [...current.agentMessages, { id: messageId, timestamp: now(), ...message }],
      agentUnreadCount: current.agentOpen ? 0 : (current.agentUnreadCount || 0) + (message.role === "assistant" || message.role === "approval" ? 1 : 0),
    }), { persist: false });
    return messageId;
  }

  function updateToolMessage(messageId, update) {
    setState((current) => ({
      ...current,
      agentMessages: current.agentMessages.map((message) => message.id === messageId ? { ...message, ...update } : message),
    }), { persist: false });
  }

  function recordToolActivity({ name, input = {}, output = null, source = "agent", status = "completed", durationMs = 0 }) {
    setState((current) => ({
      ...current,
      toolActivity: [
        { id: id("tool"), name, input, output, source, status, durationMs, timestamp: now() },
        ...current.toolActivity,
      ].slice(0, 50),
    }), { persist: false });
  }

  function queueApproval({ actionType, title, summary, payload, requestedBy = "Pathway Copilot" }) {
    const approval = {
      id: id("approval"),
      actionType,
      title,
      summary,
      payload,
      requestedBy,
      createdAt: now(),
      status: "pending",
    };
    setState((current) => ({
      ...current,
      pendingApprovals: [...current.pendingApprovals, approval],
      notice: { kind: "approval", text: "A pathway change is waiting for your approval." },
    }));
    appendMessage({ role: "approval", approvalId: approval.id, text: summary });
    return approval;
  }

  function selectCareerGoal({ topic = "", role = "", sourceText = "" } = {}, options = {}) {
    const selection = resolveCareerSelection(topic, role);
    if (!selection) return null;
    const pathway = buildPersonalizedPathway({ careerGoal: selection.role, workload: state.workload });

    setState((current) => ({
      ...current,
      profileGoal: selection.role,
      profileCareerTopic: selection.topic,
      careerTopic: selection.topic,
      careerRole: selection.role,
      pathway,
      pathwayGenerated: true,
      officialPlan: null,
      goalPickerOpen: false,
      goalBrowseOpen: false,
      goalBrowseSearch: "",
      goalCandidate: null,
      goalError: "",
      view: "overview",
      notice: { kind: "success", text: `Your entire pathway is now aligned to ${selection.role}.` },
    }));

    if (options.appendMessages !== false) {
      appendMessage({
        role: "user",
        text: sourceText || `Use ${selection.role} in ${selection.topic} as my career goal.`,
      });
      appendMessage({
        role: "assistant",
        label: "Career goal selected",
        text: `Great choice. I rebuilt the degree, skill, research, scholarship, and internship pathway around ${selection.role}.`,
        actions: [
          { label: "Build my complete pathway", action: "build-pathway", primary: true },
          { label: "Show degree plan", action: "open-view", view: "degree" },
          { label: "Find internships", action: "find-opportunities", value: "internship" },
        ],
      });
    }
    return { ...selection, pathway };
  }

  function applyApprovedAction(approval, current) {
    const next = { ...current };
    const payload = approval.payload || {};

    if (approval.actionType === "create_degree_plan") {
      next.officialPlan = payload.plan || simulateDegreePlan({
        careerGoal: next.profileGoal || payload.careerGoal || "",
        workload: next.workload,
      });
      next.pathwayGenerated = true;
    }

    if (approval.actionType === "add_course_to_plan") {
      const base = structuredClone(next.officialPlan || next.pathway.plan);
      const course = getCourse(payload.courseCode);
      const term = base.terms.find((item) => item.id === payload.termId) || base.terms[0];
      if (course && term && !base.terms.some((item) => item.courses.some((planned) => planned.code === course.code))) {
        term.courses.push({ ...course, optional: true });
        term.credits += course.credits;
        base.totalPlannedCredits += course.credits;
        base.projectedCredits += course.credits;
      }
      next.officialPlan = base;
    }

    if (approval.actionType === "save_opportunity") {
      const opportunity = getOpportunity(payload.opportunityId);
      if (opportunity) {
        const type = opportunity.type;
        next.saved = {
          ...next.saved,
          [type]: [...new Set([...(next.saved[type] || []), opportunity.id])],
        };
      }
    }

    if (approval.actionType === "express_research_interest") {
      next.applications = {
        ...next.applications,
        [payload.opportunityId]: { type: "research", status: "Interest ready to send", updatedAt: now() },
      };
    }

    if (approval.actionType === "update_application_status") {
      next.applications = {
        ...next.applications,
        [payload.opportunityId]: { type: payload.opportunityType, status: payload.status, updatedAt: now() },
      };
    }

    if (approval.actionType === "change_profile_goal") {
      const selection = resolveCareerSelection(payload.careerTopic || payload.careerGoal, payload.careerRole || payload.careerGoal);
      if (selection) {
        next.profileGoal = selection.role;
        next.profileCareerTopic = selection.topic;
        next.careerTopic = selection.topic;
        next.careerRole = selection.role;
        next.pathway = buildPersonalizedPathway({ careerGoal: selection.role, workload: next.workload });
        next.pathwayGenerated = true;
        next.officialPlan = null;
        next.goalPickerOpen = false;
        next.goalBrowseOpen = false;
        next.goalBrowseSearch = "";
        next.goalCandidate = null;
        next.goalError = "";
      }
    }

    return next;
  }

  function approve(approvalId) {
    const approval = state.pendingApprovals.find((item) => item.id === approvalId);
    if (!approval) return null;
    setState((current) => {
      const applied = applyApprovedAction(approval, current);
      return {
        ...applied,
        pendingApprovals: current.pendingApprovals.filter((item) => item.id !== approvalId),
        approvalHistory: [{ ...approval, status: "approved", resolvedAt: now() }, ...current.approvalHistory].slice(0, 30),
        notice: { kind: "success", text: "Approved. Your pathway has been updated." },
      };
    });
    appendMessage({ role: "assistant", text: `Done — I applied “${approval.title}” and updated the shared roadmap.` });
    return approval;
  }

  function reject(approvalId) {
    const approval = state.pendingApprovals.find((item) => item.id === approvalId);
    if (!approval) return null;
    setState((current) => ({
      ...current,
      pendingApprovals: current.pendingApprovals.filter((item) => item.id !== approvalId),
      approvalHistory: [{ ...approval, status: "rejected", resolvedAt: now() }, ...current.approvalHistory].slice(0, 30),
      notice: { kind: "neutral", text: "Change cancelled. No student record was modified." },
    }));
    appendMessage({ role: "assistant", text: `No problem — I cancelled “${approval.title}.” Nothing was changed.` });
    return approval;
  }

  function saveDirect(opportunityId) {
    const opportunity = getOpportunity(opportunityId);
    if (!opportunity) return;
    setState((current) => {
      const existing = current.saved[opportunity.type] || [];
      const isSaved = existing.includes(opportunityId);
      return {
        ...current,
        saved: {
          ...current.saved,
          [opportunity.type]: isSaved ? existing.filter((item) => item !== opportunityId) : [...existing, opportunityId],
        },
        notice: { kind: "success", text: isSaved ? "Removed from saved opportunities." : "Saved to your pathway." },
      };
    });
  }

  function clearChat() {
    setState((current) => ({
      ...current,
      agentMessages: [createWelcomeMessage()],
      agentRunning: false,
      agentDraft: "",
      agentUnreadCount: 0,
      agentOpen: true,
    }), { persist: false });
  }

  function resetDemo() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        for (const key of [...LEGACY_STORAGE_KEYS, ...MIGRATION_STORAGE_KEYS]) window.localStorage.removeItem(key);
      } catch {
        // Reset the in-memory demo even when persistent storage is unavailable.
      }
    }
    const runtimeState = {
      nativeWebMCP: state.nativeWebMCP,
      registeredToolCount: state.registeredToolCount,
      webMCPExpectedToolCount: state.webMCPExpectedToolCount,
      webMCPStatus: state.webMCPStatus,
      webMCPFailures: state.webMCPFailures,
      webMCPDiscoveredToolNames: state.webMCPDiscoveredToolNames,
      webMCPEnvironment: state.webMCPEnvironment,
      careerCatalogStatus: state.careerCatalogStatus,
    };
    state = { ...createInitialState(), ...runtimeState };
    notify();
  }

  return {
    getState,
    setState,
    subscribe,
    appendMessage,
    updateToolMessage,
    recordToolActivity,
    queueApproval,
    selectCareerGoal,
    applyCareerGoal: selectCareerGoal,
    approve,
    reject,
    saveDirect,
    clearChat,
    resetDemo,
  };
}

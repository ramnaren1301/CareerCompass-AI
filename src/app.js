import { loadCareerCatalog, exploreCareerPath } from "./career-catalog.js";
import { student } from "./data.js";
import { getCareerDegreeAlignment } from "./engine.js";
import { icon } from "./icons.js";
import { patchHtml } from "./dom-patch.js";
import { createStore } from "./store.js";
import { createWebMCPRuntime } from "./webmcp.js";
import {
  JOURNEY_STEPS,
  academicRouteGuidance,
  allSupportedCareerFields,
  careerFieldsForGroup,
  careerGroupChoices,
  catalogOpportunityChoices,
  emptyJourney,
  fieldContext,
  finalMilestones,
  pickLearningAction,
  portfolioProject,
  priorityNarrative,
  priorityOptions,
  roleChoices,
  roleSummary,
  routeOptions,
  skillChoices,
  supportedCareerCounts,
  workloadOptions,
} from "./careercompass-journey.js";

const root = document.getElementById("app");
const JOURNEY_STORAGE_KEY = "careercompass-ai-journey-v3.0-selection-first";
const catalogStatus = await loadCareerCatalog();
const dataStore = createStore();
dataStore.setState({ careerCatalogStatus: catalogStatus }, { persist: false });
const runtime = createWebMCPRuntime(dataStore);
let nativeWebMCPRegistration = await runtime.register();
if (!nativeWebMCPRegistration.native) {
  const log = nativeWebMCPRegistration.status === "api_unavailable" ? console.warn : console.error;
  log("[CareerCompass AI WebMCP] Native registration is not active.", nativeWebMCPRegistration);
}

let journey = loadJourney();
let renderFrame = 0;
let lastMessageCount = journey.messages.length;
let lastStep = journey.currentStep;

if (journey.selectedRole && journey.selectedTopic) {
  dataStore.selectCareerGoal(
    { topic: journey.selectedTopic, role: journey.selectedRole },
    { appendMessages: false },
  );
}

function loadJourney() {
  if (typeof window === "undefined") return emptyJourney();
  try {
    const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
    if (!raw) return emptyJourney();
    const parsed = JSON.parse(raw);
    const base = emptyJourney();
    return {
      ...base,
      ...parsed,
      directionMode: ["groups", "fields", "all"].includes(parsed.directionMode) ? parsed.directionMode : base.directionMode,
      selectedGroup: typeof parsed.selectedGroup === "string" ? parsed.selectedGroup : "",
      messages: Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : base.messages,
      candidates: [],
      completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
      toolLog: Array.isArray(parsed.toolLog) ? parsed.toolLog.slice(0, 20) : [],
      busy: false,
      activeTool: "",
      error: "",
    };
  } catch {
    return emptyJourney();
  }
}

function persistJourney() {
  if (typeof window === "undefined") return;
  const payload = {
    ...journey,
    busy: false,
    activeTool: "",
    error: "",
    toolLog: journey.toolLog.slice(0, 20),
  };
  try {
    window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // The guided journey remains usable if browser storage is unavailable.
  }
}

function scheduleRender({ scroll = false, focus = false } = {}) {
  cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(() => {
    const messageCountChanged = journey.messages.length !== lastMessageCount;
    const stepChanged = journey.currentStep !== lastStep;
    patchHtml(root, renderApp());
    root.classList.remove("booting");
    if (scroll || messageCountChanged || stepChanged) scrollConversation();
    if (focus) document.querySelector(".active-step-card button:not(:disabled)")?.focus({ preventScroll: true });
    lastMessageCount = journey.messages.length;
    lastStep = journey.currentStep;
  });
}

function setJourney(update, options = {}) {
  journey = typeof update === "function" ? update(journey) : { ...journey, ...update };
  if (options.persist !== false) persistJourney();
  scheduleRender(options);
  return journey;
}

function makeId(prefix = "item") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function appendMessage(role, text, title = "") {
  const message = { id: makeId("message"), role, text, title, timestamp: new Date().toISOString() };
  journey = { ...journey, messages: [...journey.messages, message] };
  return message;
}

function markStepComplete(stepId) {
  if (!journey.completedSteps.includes(stepId)) {
    journey = { ...journey, completedSteps: [...journey.completedSteps, stepId] };
  }
}

function moveToStep(stepId, assistantText = "", title = "") {
  markStepComplete(journey.currentStep);
  journey = { ...journey, currentStep: stepId, error: "" };
  if (assistantText) appendMessage("assistant", assistantText, title);
  persistJourney();
  scheduleRender({ scroll: true });
}

async function executeTool(name, input = {}, label = name) {
  setJourney({ busy: true, activeTool: label, error: "" }, { persist: false });
  const started = performance.now();
  try {
    const [output] = await Promise.all([
      runtime.execute(name, input, "careercompass-ai"),
      new Promise((resolve) => setTimeout(resolve, 180)),
    ]);
    journey = {
      ...journey,
      toolLog: [
        {
          id: makeId("tool"),
          name,
          label,
          status: "completed",
          durationMs: Math.round(performance.now() - started),
          timestamp: new Date().toISOString(),
        },
        ...journey.toolLog,
      ].slice(0, 20),
      busy: false,
      activeTool: "",
    };
    persistJourney();
    scheduleRender();
    return output;
  } catch (error) {
    journey = {
      ...journey,
      busy: false,
      activeTool: "",
      error: error instanceof Error ? error.message : "The careercompass-ai action could not be completed.",
      toolLog: [
        {
          id: makeId("tool"),
          name,
          label,
          status: "failed",
          durationMs: Math.round(performance.now() - started),
          timestamp: new Date().toISOString(),
        },
        ...journey.toolLog,
      ].slice(0, 20),
    };
    persistJourney();
    scheduleRender({ scroll: true });
    throw error;
  }
}

function currentDetail() {
  if (!journey.selectedTopic) return null;
  return exploreCareerPath({ topic: journey.selectedTopic, role: journey.selectedRole || journey.suggestedRole });
}

function currentStepIndex() {
  const index = JOURNEY_STEPS.findIndex((step) => step.id === journey.currentStep);
  return Math.max(0, index);
}

function currentStepMeta() {
  return JOURNEY_STEPS[currentStepIndex()] || JOURNEY_STEPS[0];
}

function nextTerm(plan = journey.plan) {
  return plan?.terms?.find((term) => term.courses?.length) || plan?.terms?.[0] || null;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function stepNumber(stepId) {
  return JOURNEY_STEPS.findIndex((step) => step.id === stepId) + 1;
}

function renderApp() {
  const step = currentStepMeta();
  const progress = Math.round((currentStepIndex() / (JOURNEY_STEPS.length - 1)) * 100);
  return `<div class="compass-app" data-key="compass-app">
    ${renderHeader(progress, step)}
    <main class="compass-layout">
      ${renderJourneyTrail()}
      ${renderConversation()}
      ${renderFocusPanel()}
    </main>
    ${renderActivityDrawer()}
  </div>`;
}

function renderNativeWebMCPStatus() {
  const state = dataStore.getState();
  const expected = state.webMCPExpectedToolCount || runtime.definitions.length;
  const count = Number.isInteger(state.registeredToolCount) ? state.registeredToolCount : 0;
  const status = state.webMCPStatus || "checking";
  const environment = state.webMCPEnvironment || {};
  const failure = state.webMCPFailures?.[0]?.error || "";

  if (status === "registered" && count === expected) {
    return `<span class="mcp-status native-ready" title="Chrome confirmed ${count} native WebMCP tools on this page"><i></i>${count} WebMCP tools registered</span>`;
  }
  if (status === "checking") {
    return `<span class="mcp-status native-checking" title="Checking Chrome native WebMCP registration"><i></i>Checking WebMCP…</span>`;
  }
  const reason = failure
    || (environment.registerToolType !== "function" ? "document.modelContext.registerTool is unavailable" : "Native registration did not complete");
  return `<button class="mcp-status native-failed" data-action="open-webmcp-diagnostics" title="${escapeHtml(reason)}"><i></i>WebMCP ${count}/${expected}</button>`;
}

function renderHeader(progress, step) {
  return `<header class="compass-header" data-key="compass-header">
    <div class="brand-lockup">
      <span class="brand-mark">${icon("route", 22)}</span>
      <div><strong>CareerCompass AI</strong><span>Degree-to-career guide</span></div>
    </div>
    <div class="header-progress" aria-label="Journey progress">
      <div><span>Step ${stepNumber(step.id)} of ${JOURNEY_STEPS.length}</span><strong>${escapeHtml(step.label)}</strong></div>
      <div class="progress-track"><i style="width:${progress}%"></i></div>
    </div>
    <div class="header-actions">
      ${renderNativeWebMCPStatus()}
      <button class="quiet-button" data-action="toggle-activity">${icon("activity", 16)} <span>Agent activity</span></button>
      <button class="quiet-button danger" data-action="start-over">${icon("refresh", 16)} <span>Start over</span></button>
    </div>
  </header>`;
}

function renderJourneyTrail() {
  const activeIndex = currentStepIndex();
  const decisions = [
    journey.selectedRole ? ["Career", journey.selectedRole] : null,
    journey.priority ? ["First priority", priorityOptions().find((item) => item.id === journey.priority)?.title] : null,
    journey.route ? ["Academic route", routeOptions(getCareerDegreeAlignment(journey.selectedRole, student)).find((item) => item.id === journey.route)?.title] : null,
    journey.plan ? ["Next term", `${nextTerm()?.courses?.length || 0} focused courses`] : null,
    journey.selectedSkill ? ["Skill sprint", journey.selectedSkill] : null,
    journey.selectedExperience ? ["Experience", journey.selectedExperience.title] : null,
    journey.selectedScholarship ? ["Funding", journey.selectedScholarship.title] : journey.fundingChoice === "skip" ? ["Funding", "Skipped for now"] : null,
  ].filter(Boolean);

  return `<aside class="journey-trail" data-key="journey-trail">
    <div class="trail-intro">
      <span>Your guided pathway</span>
      <h2>One decision at a time.</h2>
      <p>Future steps stay hidden until your current choice makes them relevant.</p>
    </div>
    <ol class="step-list">
      ${JOURNEY_STEPS.map((step, index) => {
        const completed = index < activeIndex || journey.completedSteps.includes(step.id);
        const active = step.id === journey.currentStep;
        const available = completed || active;
        return `<li class="trail-step ${completed ? "completed" : ""} ${active ? "active" : ""} ${available ? "available" : "locked"}" data-key="trail-${step.id}">
          <button ${available && !active ? `data-action="go-to-step" data-step="${step.id}"` : "disabled"} aria-current="${active ? "step" : "false"}">
            <span class="trail-node">${completed ? icon("check", 14) : index + 1}</span>
            <span><strong>${escapeHtml(step.label)}</strong><small>${active ? escapeHtml(step.short) : completed ? "Decision made" : "Unlocks later"}</small></span>
          </button>
        </li>`;
      }).join("")}
    </ol>
    <div class="decision-stack">
      <div class="decision-stack-head"><span>What we’ve decided</span><small>${decisions.length} saved</small></div>
      ${decisions.length ? decisions.map(([label, value]) => `<div class="decision-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "")}</strong></div>`).join("") : `<p class="empty-copy">Nothing yet. Your first supported selection will begin the pathway.</p>`}
    </div>
  </aside>`;
}

function renderConversation() {
  return `<section class="conversation-workspace" data-key="conversation-workspace">
    <div class="conversation-titlebar">
      <div class="compass-avatar">${icon("sparkles", 20)}</div>
      <div><strong>CareerCompass AI</strong><span>${journey.busy ? escapeHtml(journey.activeTool) : "Guiding one supported selection at a time"}</span></div>
      <span class="live-indicator"><i></i>${journey.busy ? "Working" : "Ready"}</span>
    </div>
    <div class="conversation-scroll" id="conversation-scroll" data-key="conversation-scroll" tabindex="0" aria-label="CareerCompass AI conversation and current decision. Scroll vertically inside this panel.">
      <div class="message-stream">
        ${journey.messages.map(renderMessage).join("")}
        ${renderActiveStep()}
        ${journey.busy ? renderThinking() : ""}
        ${journey.error ? `<div class="inline-error" data-key="inline-error">${icon("info", 17)}<span>${escapeHtml(journey.error)}</span></div>` : ""}
      </div>
    </div>
    ${renderComposer()}
  </section>`;
}

function renderMessage(message) {
  return `<article class="chat-message ${message.role}" data-key="${escapeAttr(message.id)}">
    <span class="message-avatar">${message.role === "assistant" ? icon("sparkles", 15) : escapeHtml(student.initials)}</span>
    <div class="message-bubble">
      ${message.title ? `<span class="message-label">${escapeHtml(message.title)}</span>` : ""}
      <p>${escapeHtml(message.text)}</p>
    </div>
  </article>`;
}

function renderActiveStep() {
  switch (journey.currentStep) {
    case "direction": return renderDirectionStep();
    case "role": return renderRoleStep();
    case "priority": return renderPriorityStep();
    case "route": return renderRouteStep();
    case "semester": return renderSemesterStep();
    case "skills": return renderSkillsStep();
    case "experience": return renderExperienceStep();
    case "funding": return renderFundingStep();
    case "roadmap": return renderRoadmapStep();
    default: return renderDirectionStep();
  }
}

function stepCard({ eyebrow, title, text, body, footer = "", className = "" }) {
  return `<section class="active-step-card ${className}" data-key="active-step-${journey.currentStep}">
    <div class="step-card-heading">
      <span class="step-eyebrow">${escapeHtml(eyebrow)}</span>
      <h2>${escapeHtml(title)}</h2>
      ${text ? `<p>${escapeHtml(text)}</p>` : ""}
    </div>
    ${body}
    ${footer ? `<div class="step-card-footer">${footer}</div>` : ""}
  </section>`;
}

function renderDirectionStep() {
  const mode = journey.directionMode || "groups";
  const counts = supportedCareerCounts();
  const groups = careerGroupChoices();
  const selectedGroup = groups.find((group) => group.id === journey.selectedGroup) || null;

  let title = "Which type of work interests you most?";
  let text = "Start with one supported area. I’ll then show only the career fields and roles available inside your selection.";
  let body = `<div class="supported-catalog-banner">
    <span class="supported-catalog-icon">${icon("check", 17)}</span>
    <div><strong>Choose from ${counts.fields} supported career fields</strong><p>${counts.roles} roles are available in the attached CareerCompass AI catalog. Open-ended career entry is intentionally disabled.</p></div>
  </div>
  <div class="option-grid career-group-options">
    ${groups.map((group) => `<button class="choice-card career-group-choice" data-action="choose-career-group" data-group="${escapeAttr(group.id)}">
      <span class="choice-icon">${icon(group.icon, 20)}</span>
      <h3>${escapeHtml(group.title)}</h3>
      <p>${escapeHtml(group.description)}</p>
      <div class="choice-meta"><span>${group.topics.length} supported field${group.topics.length === 1 ? "" : "s"}</span>${icon("arrow", 17)}</div>
    </button>`).join("")}
  </div>
  <button class="text-action" data-action="browse-all-fields">${icon("search", 14)} Browse all ${counts.fields} supported fields instead</button>`;

  if (mode === "fields" && selectedGroup) {
    const fields = careerFieldsForGroup(selectedGroup.id);
    title = `Choose one path inside “${selectedGroup.title}”`;
    text = `Only these ${fields.length} supported fields belong to the direction you selected. Pick one to see its available roles.`;
    body = `<div class="selected-direction-strip">
      <span class="selected-direction-icon">${icon(selectedGroup.icon, 18)}</span>
      <div><small>Selected direction</small><strong>${escapeHtml(selectedGroup.title)}</strong></div>
      <button data-action="back-to-career-groups">Change</button>
    </div>
    <div class="option-grid field-options selection-field-options">
      ${fields.map((field) => `<button class="choice-card field-choice" data-action="choose-field" data-topic="${escapeAttr(field.topic)}">
        <span class="choice-kicker">${field.roles.length} role${field.roles.length === 1 ? "" : "s"} available</span>
        <h3>${escapeHtml(field.topic)}</h3>
        <p>${escapeHtml(field.context.promise)}</p>
        <div class="choice-meta"><span>${escapeHtml(field.roles.join(" · "))}</span>${icon("arrow", 17)}</div>
      </button>`).join("")}
    </div>
    <button class="text-action" data-action="browse-all-fields">${icon("search", 14)} Browse all supported fields</button>`;
  }

  if (mode === "all") {
    const allGroups = allSupportedCareerFields();
    title = `All ${counts.fields} career fields supported in this version`;
    text = "Choose a field from the catalog. CareerCompass AI will not invent a route for careers that are not represented in the data.";
    body = `<div class="supported-catalog-banner compact">
      <span class="supported-catalog-icon">${icon("shield", 17)}</span>
      <div><strong>Catalog-constrained selection</strong><p>Every option below exists in the attached JSON and has defined roles.</p></div>
    </div>
    <div class="all-supported-fields">
      ${allGroups.map((group) => `<section class="field-group-section">
        <div class="field-group-heading"><span>${icon(group.icon, 16)}</span><div><strong>${escapeHtml(group.title)}</strong><small>${group.fields.length} field${group.fields.length === 1 ? "" : "s"}</small></div></div>
        <div class="field-chip-list">
          ${group.fields.map((field) => `<button data-action="choose-field" data-topic="${escapeAttr(field.topic)}"><strong>${escapeHtml(field.topic)}</strong><span>${escapeHtml(field.roles.join(" · "))}</span>${icon("chevron", 15)}</button>`).join("")}
        </div>
      </section>`).join("")}
    </div>
    <button class="text-action" data-action="back-to-career-groups">${icon("arrow", 14)} Back to six guided directions</button>`;
  }

  return stepCard({
    eyebrow: "Step 1 · Choose from supported options",
    title,
    text,
    body,
    footer: "The primary journey is selection-driven. Unsupported careers cannot silently enter the pathway.",
  });
}

function renderRoleStep() {
  const context = fieldContext(journey.selectedTopic);
  const choices = roleChoices(journey.selectedTopic, journey.suggestedRole, journey.showAllRoles);
  return stepCard({
    eyebrow: `Step 2 · ${journey.selectedTopic}`,
    title: "Which kind of work inside this field fits you best?",
    text: `All of these roles help you ${context.promise}, but the day-to-day work is different.`,
    body: `<div class="role-context-strip">
      <div><span>Field outcome</span><strong>${escapeHtml(context.promise)}</strong></div>
      <div><span>Core foundation</span><strong>${escapeHtml(context.coreSkills.join(" · "))}</strong></div>
    </div>
    <div class="option-grid role-options">
      ${choices.map((item, index) => `<button class="choice-card role-choice ${item.role === journey.suggestedRole ? "recommended" : ""}" data-action="choose-role" data-role="${escapeAttr(item.role)}">
        <span class="choice-kicker">${item.role === journey.suggestedRole ? "Suggested starting role" : `Option ${index + 1}`}</span>
        <h3>${escapeHtml(item.role)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <div class="choice-meta"><span>Explore this role</span>${icon("arrow", 17)}</div>
      </button>`).join("")}
    </div>
    ${currentDetail()?.careerPaths?.length > choices.length ? `<button class="text-action" data-action="show-all-roles">Show the other role in ${escapeHtml(journey.selectedTopic)}</button>` : ""}`,
  });
}

function renderPriorityStep() {
  return stepCard({
    eyebrow: `Step 3 · ${journey.selectedRole}`,
    title: "What should we optimize first?",
    text: "Your answer changes the order of courses, skill work, and opportunities. I’ll keep the other goals in the background.",
    body: `<div class="option-grid priority-options">
      ${priorityOptions().map((option) => `<button class="choice-card priority-choice" data-action="choose-priority" data-value="${option.id}">
        <span class="choice-icon">${icon(option.id === "internship" ? "briefcase" : option.id === "research" ? "flask" : option.id === "portfolio" ? "tools" : "graduation", 20)}</span>
        <h3>${escapeHtml(option.title)}</h3>
        <p>${escapeHtml(option.description)}</p>
        <div class="choice-meta"><span>Make this first</span>${icon("arrow", 17)}</div>
      </button>`).join("")}
    </div>`,
  });
}

function renderRouteStep() {
  const alignment = getCareerDegreeAlignment(journey.selectedRole, student);
  const options = routeOptions(alignment);
  return stepCard({
    eyebrow: "Step 4 · Academic route",
    title: alignment.level === "direct" ? "Your current degree can take you there." : "Your goal needs an intentional academic bridge.",
    text: alignment.message,
    body: `<div class="alignment-card ${alignment.level}">
      <span>${icon(alignment.level === "direct" ? "check" : "info", 18)} ${escapeHtml(alignment.label)}</span>
      <div><small>Your degree</small><strong>${escapeHtml(student.degree)}</strong></div>
      <div><small>Typical route</small><strong>${escapeHtml((alignment.typicalDegrees || []).slice(0, 3).join(" · ") || "Career-specific review")}</strong></div>
    </div>
    <div class="option-stack route-options">
      ${options.map((option) => `<button class="choice-card horizontal-choice ${option.recommended ? "recommended" : ""}" data-action="choose-route" data-value="${option.id}">
        <span class="radio-mark"></span>
        <span><strong>${escapeHtml(option.title)}</strong><small>${escapeHtml(option.description)}</small></span>
        ${option.recommended ? `<em>Recommended</em>` : icon("chevron", 17)}
      </button>`).join("")}
    </div>`,
    footer: "You can revisit this choice later. Changing it will recalculate only the dependent steps.",
  });
}

function renderSemesterStep() {
  const term = nextTerm();
  const approval = journey.planApprovalId ? dataStore.getState().pendingApprovals.find((item) => item.id === journey.planApprovalId) : null;
  const approved = journey.planApproved;
  const alignment = getCareerDegreeAlignment(journey.selectedRole, student);
  const routeAction = academicRouteGuidance(journey.route, alignment, journey.selectedTopic, journey.priority);
  const routeNeedsReview = ["explore", "advisor"].includes(journey.route);
  const priorityReason = {
    internship: `It protects prerequisites while moving the foundations recruiters will expect for ${journey.selectedRole} earlier.`,
    research: `It protects prerequisites and keeps the earliest research-readiness sequence visible.`,
    portfolio: `It protects degree progress while creating room for the selected proof project.`,
    graduation: `It prioritizes required progress and a sustainable workload before optional career additions.`,
  }[journey.priority] || `It protects prerequisites and moves the most useful ${journey.selectedRole} foundations earlier.`;
  return stepCard({
    eyebrow: "Step 5 · Next semester only",
    title: term ? `A focused ${term.label} plan` : "Choose a workload and I’ll build the next term",
    text: "I’m showing only the next semester. Later terms remain in the background until you need them.",
    body: `<div class="route-checkpoint ${escapeAttr(journey.route || "review")}">
      <span class="route-checkpoint-icon">${icon("compass", 18)}</span>
      <div><small>Your selected academic route</small><strong>${escapeHtml(routeAction.label)}</strong><p>${escapeHtml(routeAction.detail)}</p></div>
    </div>
    <div class="workload-selector" role="group" aria-label="Course workload">
      ${workloadOptions().map((option) => `<button class="${journey.workload === option.id ? "active" : ""}" data-action="choose-workload" data-value="${option.id}"><strong>${escapeHtml(option.title)}</strong><span>${escapeHtml(option.description)}</span></button>`).join("")}
    </div>
    ${term ? `<div class="semester-plan-card">
      <div class="semester-plan-head">
        <div><span>${escapeHtml(term.label)}</span><h3>${term.credits} credits · ${term.courses.length} courses</h3></div>
        <span class="on-track-pill">${journey.plan?.onTrack ? icon("check", 14) + " On track" : icon("info", 14) + " Review needed"}</span>
      </div>
      <div class="course-list">
        ${term.courses.map((course, index) => `<article class="course-row" data-key="course-${course.code}">
          <span>${index + 1}</span>
          <div><strong>${escapeHtml(course.code)} · ${escapeHtml(course.title)}</strong><small>${escapeHtml((course.skills || []).slice(0, 3).join(" · "))}</small></div>
          <em>${course.credits} cr</em>
        </article>`).join("")}
      </div>
      <div class="plan-why">${icon("sparkles", 16)}<p><strong>Why this sequence:</strong> ${escapeHtml(priorityReason)}</p></div>
    </div>` : ""}
    ${approval ? `<div class="inline-approval" data-key="plan-approval">
      <div class="approval-icon">${icon("lock", 18)}</div>
      <div><span>Student confirmation required</span><strong>${routeNeedsReview ? "Save this as my working plan while the route is reviewed?" : "Use this as my official working plan?"}</strong><p>${routeNeedsReview ? "This keeps the semester actionable without treating the program decision as final." : "CareerCompass AI has prepared the change but has not applied it."}</p></div>
      <div class="approval-actions"><button class="button secondary" data-action="adjust-plan">Adjust</button><button class="button primary" data-action="approve-plan">Approve plan</button></div>
    </div>` : approved ? `<div class="approved-strip">${icon("check", 16)} Plan approved. We can now choose one skill to build first.</div>` : `<button class="button primary wide" data-action="propose-plan" ${journey.busy || !term ? "disabled" : ""}>${icon("lock", 17)} ${routeNeedsReview ? "Save this working next-semester plan" : "Use this next-semester plan"}</button>`}`,
  });
}

function renderSkillsStep() {
  const detail = currentDetail();
  const options = journey.skillOptions || [];
  const project = journey.selectedSkill ? portfolioProject(journey.selectedTopic, journey.selectedRole, journey.selectedSkill) : null;
  const action = journey.learningAction;
  return stepCard({
    eyebrow: "Step 6 · Skill sprint",
    title: journey.selectedSkill ? `Focus first on ${journey.selectedSkill}` : "Which gap should we close first?",
    text: journey.selectedSkill ? "One focused 30-day sprint is more useful than ten unrelated resources." : "I narrowed the skill analysis to the three most useful next capabilities for your chosen role.",
    body: `<div class="option-grid skill-options">
      ${options.map((option) => `<button class="choice-card skill-choice ${journey.selectedSkill === option.skill ? "selected" : ""}" data-action="choose-skill" data-skill="${escapeAttr(option.skill)}">
        <span class="skill-meter"><i style="width:${Math.min(100, option.level || 18)}%"></i></span>
        <h3>${escapeHtml(option.skill)}</h3>
        <p>${escapeHtml(option.reason)}</p>
        <div class="choice-meta"><span>${option.level ? `${option.level}% current signal` : "Build from the foundation"}</span>${icon("arrow", 17)}</div>
      </button>`).join("")}
    </div>
    ${journey.selectedSkill ? `<div class="deep-dive-card">
      <div class="deep-dive-section">
        <span>Learn</span>
        <h3>${escapeHtml(action?.name || `Start a focused ${journey.selectedSkill} module`)}</h3>
        <p>${escapeHtml(action?.where || `Use a guided beginner resource for ${journey.selectedTopic}.`)}</p>
        ${action?.url ? `<a href="${escapeAttr(action.url)}" target="_blank" rel="noreferrer">Open verified resource ${icon("external", 14)}</a>` : `<small class="verification-note">Resource link needs verification before use.</small>`}
      </div>
      <div class="deep-dive-section">
        <span>Prove</span>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <small>Evidence to produce: ${escapeHtml(project.evidence)}</small>
      </div>
    </div>
    <button class="button primary wide" data-action="confirm-skill">Make this my 30-day sprint ${icon("arrow", 16)}</button>` : ""}`,
    footer: detail?.source?.verificationStatus ? "Only the resource relevant to your selected skill is shown; unverified links remain clearly marked." : "",
  });
}

function renderExperienceStep() {
  if (!journey.experienceType) {
    const recommended = journey.priority === "research" ? "research" : journey.priority === "portfolio" ? "portfolio" : "internship";
    const types = [
      { id: "internship", title: "Internship", icon: "briefcase", description: "Use the degree plan and skill sprint to find the closest work experience." },
      { id: "research", title: "Research", icon: "flask", description: "Find a relevant lab, professor, or research-ready next step." },
      { id: "portfolio", title: "Portfolio project", icon: "tools", description: "Create a proof point when a formal opportunity is not the best next move." },
    ];
    return stepCard({
      eyebrow: "Step 7 · Experience",
      title: "What kind of proof should we pursue first?",
      text: "Choose one. I’ll search only that category and return at most two useful options.",
      body: `<div class="option-grid experience-type-options">
        ${types.map((type) => `<button class="choice-card ${type.id === recommended ? "recommended" : ""}" data-action="choose-experience-type" data-value="${type.id}">
          <span class="choice-icon">${icon(type.icon, 21)}</span>
          <span class="choice-kicker">${type.id === recommended ? "Recommended from your priority" : "Alternative"}</span>
          <h3>${escapeHtml(type.title)}</h3><p>${escapeHtml(type.description)}</p>
          <div class="choice-meta"><span>Explore ${escapeHtml(type.title.toLowerCase())}</span>${icon("arrow", 17)}</div>
        </button>`).join("")}
      </div>`,
    });
  }

  const selected = journey.selectedExperience;
  return stepCard({
    eyebrow: `Step 7 · ${journey.experienceType === "portfolio" ? "Portfolio" : journey.experienceType === "research" ? "Research" : "Internship"}`,
    title: selected ? `Go deeper on ${selected.title}` : `Two focused ${journey.experienceType === "portfolio" ? "project" : journey.experienceType} options`,
    text: selected ? "I’m showing only the option you selected and what makes it useful now." : "These are the closest available choices for your career, academic route, and current skill sprint.",
    body: `<div class="option-stack experience-options">
      ${(journey.experienceChoices || []).map((item, index) => `<button class="opportunity-choice ${selected?.id === item.id ? "selected" : ""}" data-action="choose-experience" data-id="${escapeAttr(item.id)}">
        <span class="opportunity-rank">${index + 1}</span>
        <div><span>${escapeHtml(item.organization || journey.selectedTopic)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.note || "Career-aligned experience")}</p></div>
        <em class="verification-pill ${item.verified ? "verified" : "review"}">${item.verified ? icon("check", 13) + " Source available" : "Verify details"}</em>
      </button>`).join("")}
    </div>
    ${selected ? `<div class="selected-opportunity-detail">
      <div><span>Why it fits now</span><p>${escapeHtml(selected.note || `It creates a relevant proof point for ${journey.selectedRole}.`)}</p></div>
      <div><span>Your preparation</span><p>Use ${escapeHtml(journey.selectedSkill)} and the approved next-semester sequence as the evidence behind your application or outreach.</p></div>
      ${selected.url ? `<a href="${escapeAttr(selected.url)}" target="_blank" rel="noreferrer">Review the supplied source ${icon("external", 14)}</a>` : `<small>CareerCompass AI will keep this as a target, but the listing details must be verified before action.</small>`}
    </div>
    <button class="button primary wide" data-action="confirm-experience">Add this to my pathway ${icon("arrow", 16)}</button>` : ""}
    <button class="text-action" data-action="change-experience-type">Choose a different kind of experience</button>`,
  });
}

function renderFundingStep() {
  if (!journey.fundingChoice) {
    return stepCard({
      eyebrow: "Step 8 · Funding",
      title: "Should funding be part of this pathway now?",
      text: "I will not show a long scholarship directory. We can add at most two career-relevant options, or skip this step.",
      body: `<div class="option-stack funding-decision">
        <button class="choice-card horizontal-choice recommended" data-action="show-funding">
          <span class="choice-icon">${icon("award", 19)}</span><span><strong>Show only relevant scholarships</strong><small>Use my selected career and current academic profile.</small></span><em>Up to 2</em>
        </button>
        <button class="choice-card horizontal-choice" data-action="skip-funding">
          <span class="choice-icon">${icon("arrow", 19)}</span><span><strong>Skip funding for now</strong><small>Keep the pathway focused on courses, skills, and experience.</small></span>${icon("chevron", 17)}
        </button>
      </div>`,
    });
  }

  const selected = journey.selectedScholarship;
  return stepCard({
    eyebrow: "Step 8 · Focused funding",
    title: selected ? `Keep ${selected.title} on the pathway` : "Only the two most relevant funding leads",
    text: "Deadlines, amounts, and links must be rechecked before a real application.",
    body: `<div class="option-stack scholarship-options">
      ${(journey.scholarshipChoices || []).map((item, index) => `<button class="opportunity-choice ${selected?.id === item.id ? "selected" : ""}" data-action="choose-scholarship" data-id="${escapeAttr(item.id)}">
        <span class="opportunity-rank">${index + 1}</span><div><span>${escapeHtml(item.organization || journey.selectedTopic)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.note || "Career-aligned funding lead")}</p></div>
        <em class="verification-pill ${item.verified ? "verified" : "review"}">${item.verified ? "Source available" : "Verify cycle"}</em>
      </button>`).join("")}
    </div>
    ${selected ? `<div class="selected-opportunity-detail"><div><span>Why it remains</span><p>It supports the field you selected without adding unrelated scholarship noise.</p></div>${selected.url ? `<a href="${escapeAttr(selected.url)}" target="_blank" rel="noreferrer">Review supplied source ${icon("external", 14)}</a>` : `<small>Link or cycle details need verification.</small>`}</div>
      <button class="button primary wide" data-action="confirm-funding">Add it and finish my roadmap ${icon("arrow", 16)}</button>` : `<button class="text-action" data-action="skip-funding">Skip these and finish the roadmap</button>`}`,
  });
}

function renderRoadmapStep() {
  const milestones = journey.finalPathway?.milestones || finalMilestones({
    role: journey.selectedRole,
    topic: journey.selectedTopic,
    route: journey.route,
    plan: journey.plan,
    skill: journey.selectedSkill,
    experience: journey.selectedExperience,
    scholarship: journey.selectedScholarship,
    priority: journey.priority,
  });
  return stepCard({
    eyebrow: "Step 9 · Your pathway",
    title: `${journey.selectedRole}: a pathway built from your decisions`,
    text: "This is not every possible resource. It is the next sequence you selected, with each later step dependent on the earlier one.",
    className: "roadmap-step-card",
    body: `<div class="roadmap-summary-line">
      <span><small>Career</small><strong>${escapeHtml(journey.selectedRole)}</strong></span>
      <i>${icon("arrow", 16)}</i>
      <span><small>Priority</small><strong>${escapeHtml(priorityOptions().find((item) => item.id === journey.priority)?.title || "Career preparation")}</strong></span>
      <i>${icon("arrow", 16)}</i>
      <span><small>First skill</small><strong>${escapeHtml(journey.selectedSkill)}</strong></span>
      <i>${icon("arrow", 16)}</i>
      <span><small>Proof</small><strong>${escapeHtml(journey.selectedExperience?.title || "Focused project")}</strong></span>
    </div>
    <div class="milestone-list">
      ${milestones.map((item, index) => `<article class="milestone-row" data-key="milestone-${index}">
        <span class="milestone-index">${index + 1}</span>
        <div><small>${escapeHtml(item.horizon)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p></div>
        <em class="${item.status}">${item.status === "ready" ? "Start" : item.status === "optional" ? "Optional" : "Planned"}</em>
      </article>`).join("")}
    </div>
    <div class="roadmap-actions">
      <button class="button secondary" data-action="go-to-step" data-step="skills">Revisit skill sprint</button>
      <button class="button secondary" data-action="go-to-step" data-step="experience">Revisit experience</button>
      <button class="button primary" data-action="restart-with-career">Explore a different career</button>
    </div>`,
    footer: "Your completed courses and student profile stay intact when you revisit a decision; only dependent recommendations are recalculated.",
  });
}

function renderThinking() {
  return `<article class="chat-message assistant thinking-message" data-key="thinking-message">
    <span class="message-avatar">${icon("sparkles", 15)}</span>
    <div class="message-bubble"><span class="message-label">Using WebMCP</span><p>${escapeHtml(journey.activeTool)}</p><div class="typing-dots"><i></i><i></i><i></i></div></div>
  </article>`;
}

function renderComposer() {
  const instruction = {
    direction: journey.directionMode === "groups" ? "Choose one career area above" : "Choose one supported career field above",
    role: "Choose one available role above",
    priority: "Choose the outcome that matters first",
    route: "Choose one academic route",
    semester: journey.planApprovalId ? "Approve or adjust the proposed semester" : "Choose a workload and confirm the plan",
    skills: journey.selectedSkill ? "Confirm the selected 30-day sprint" : "Choose one skill gap",
    experience: journey.selectedExperience ? "Add the selected experience" : "Choose one experience option",
    funding: "Choose a funding option or skip it",
    roadmap: "Use the roadmap actions above to continue",
  }[journey.currentStep] || "Choose one option above";

  return `<footer class="selection-footer" data-key="selection-footer">
    <div class="selection-guidance">
      <span>${icon("check", 18)}</span>
      <div><strong>${escapeHtml(instruction)}</strong><small>Scroll inside the center panel when more choices are below. Every primary decision is catalog-backed.</small></div>
    </div>
    <button type="button" data-action="explain-current-step">${icon("info", 16)} Why these options?</button>
  </footer>`;
}

function renderFocusPanel() {
  const detail = currentDetail();
  const context = fieldContext(journey.selectedTopic);
  const term = nextTerm();
  const focus = (() => {
    switch (journey.currentStep) {
      case "direction":
        return { label: "Current focus", title: "Choose a supported career direction", text: "Start with one of six areas. CareerCompass AI will then reveal only its available fields and roles.", icon: "compass" };
      case "role":
        return { label: journey.selectedTopic, title: "Choose the work, not just the field", text: context.promise, icon: "target" };
      case "priority":
        return { label: "Selected role", title: journey.selectedRole, text: roleSummary(journey.selectedRole, journey.selectedTopic), icon: "briefcase" };
      case "route":
        return { label: "Degree fit", title: getCareerDegreeAlignment(journey.selectedRole, student).label, text: `Current program: ${student.degree}.`, icon: "graduation" };
      case "semester":
        return { label: "Next academic move", title: term ? term.label : "Workload decision", text: term ? `${term.courses.length} courses selected to protect prerequisites and career relevance.` : "Choose a workload to generate the next term.", icon: "calendar" };
      case "skills":
        return { label: "30-day focus", title: journey.selectedSkill || "Choose one skill", text: journey.selectedSkill ? `Learn it, prove it, then use it in your next experience.` : "Only the top three relevant gaps are being considered.", icon: "bolt" };
      case "experience":
        return { label: "Proof of readiness", title: journey.selectedExperience?.title || (journey.experienceType ? `Choose one ${journey.experienceType}` : "Choose the kind of experience"), text: journey.selectedExperience?.note || "The next recommendation will be constrained by your earlier decisions.", icon: "flask" };
      case "funding":
        return { label: "Optional support", title: journey.selectedScholarship?.title || "Funding without noise", text: journey.fundingChoice === "skip" ? "Funding is out of scope for this version of your pathway." : "At most two career-relevant leads will be considered.", icon: "award" };
      case "roadmap":
        return { label: "Pathway ready", title: journey.selectedRole, text: `Your next sequence is ${term?.label || "next semester"} → ${journey.selectedSkill} → ${journey.selectedExperience?.title || "career proof"}.`, icon: "route" };
      default:
        return { label: "CareerCompass AI", title: "One decision at a time", text: "", icon: "sparkles" };
    }
  })();

  const nextAction = {
    direction: journey.directionMode === "groups" ? "Choose a career area" : "Choose a supported field",
    role: "Select one role",
    priority: "Choose the first outcome",
    route: "Choose the academic route",
    semester: journey.planApprovalId ? "Approve or adjust the plan" : "Confirm the next semester",
    skills: journey.selectedSkill ? "Confirm the skill sprint" : "Select one skill",
    experience: journey.selectedExperience ? "Add the selected proof point" : "Choose one experience",
    funding: "Add funding or skip it",
    roadmap: "Start the first milestone",
  }[journey.currentStep];

  return `<aside class="focus-panel" data-key="focus-panel">
    <div class="focus-card">
      <span class="focus-icon">${icon(focus.icon, 21)}</span>
      <small>${escapeHtml(focus.label)}</small>
      <h2>${escapeHtml(focus.title)}</h2>
      <p>${escapeHtml(focus.text)}</p>
    </div>
    ${journey.selectedRole ? `<div class="path-essentials">
      <span>Path essentials</span>
      <div><small>Field</small><strong>${escapeHtml(journey.selectedTopic)}</strong></div>
      <div><small>Role</small><strong>${escapeHtml(journey.selectedRole)}</strong></div>
      ${detail?.typicalDegrees?.length ? `<div><small>Typical degree</small><strong>${escapeHtml(detail.typicalDegrees[0])}</strong></div>` : ""}
      ${journey.selectedSkill ? `<div><small>Skill now</small><strong>${escapeHtml(journey.selectedSkill)}</strong></div>` : ""}
    </div>` : ""}
    <div class="next-action-card">
      <span>Next decision</span>
      <strong>${escapeHtml(nextAction)}</strong>
      <p>I will not unlock the next part until this decision is complete.</p>
    </div>
    <button class="activity-link" data-action="toggle-activity">${icon("activity", 16)} See how CareerCompass AI used WebMCP <span>${journey.toolLog.length}</span></button>
  </aside>`;
}

function renderNativeDiagnostics() {
  const state = dataStore.getState();
  const environment = state.webMCPEnvironment || {};
  const expected = state.webMCPExpectedToolCount || runtime.definitions.length;
  const count = Number.isInteger(state.registeredToolCount) ? state.registeredToolCount : 0;
  const status = state.webMCPStatus || "checking";
  const firstFailure = state.webMCPFailures?.[0]?.error || "";
  const row = (label, value, good) => `<div><span>${escapeHtml(label)}</span><strong class="${good === true ? "pass" : good === false ? "fail" : "unknown"}">${escapeHtml(String(value))}</strong></div>`;
  const ready = status === "registered" && count === expected;
  return `<section class="native-webmcp-card ${ready ? "ready" : "not-ready"}">
    <div class="native-card-heading">
      <div><span>Chrome-native WebMCP</span><h3>${ready ? `${count} tools discoverable` : `${count} of ${expected} tools discoverable`}</h3></div>
      <button data-action="recheck-webmcp" class="native-recheck">${icon("refresh", 14)} Recheck</button>
    </div>
    <p>${ready ? "Chrome confirmed the registered CareerCompass AI tools through document.modelContext.getTools()." : "CareerCompass AI can still use its local handlers, but Chrome has not confirmed the native tool registry."}</p>
    <div class="native-diagnostic-grid">
      ${row("Secure context", environment.secureContext ?? "Unknown", environment.secureContext === true)}
      ${row("Origin-isolated", environment.originAgentCluster ?? "Unknown", environment.originAgentCluster === true)}
      ${row("Top-level page", environment.topLevelDocument ?? "Unknown", environment.topLevelDocument === true)}
      ${row("registerTool", environment.registerToolType || "undefined", environment.registerToolType === "function")}
      ${row("getTools", environment.getToolsType || "undefined", environment.getToolsType === "function")}
      ${row("Tools policy", environment.toolsPolicyAllowed ?? "Unknown", environment.toolsPolicyAllowed !== false)}
    </div>
    ${firstFailure ? `<div class="native-failure"><strong>Registration reason</strong><span>${escapeHtml(firstFailure)}</span></div>` : ""}
    ${ready ? "" : `<div class="native-setup-steps"><strong>Required local setup</strong><ol>
      <li>Enable <code>chrome://flags/#enable-webmcp-testing</code> and fully relaunch Chrome.</li>
      <li>Close all existing <code>localhost:3000</code> tabs and open a completely new tab.</li>
      <li>Keep this app running with <code>npm run dev</code>; v3.0 sends <code>Origin-Agent-Cluster: ?1</code>.</li>
      <li>Open Application → WebMCP. The Available Tools section should show ${expected} entries.</li>
    </ol></div>`}
  </section>`;
}

function renderActivityDrawer() {
  if (!journey.activityOpen) return "";
  return `<div class="drawer-backdrop" data-action="toggle-activity" data-key="drawer-backdrop"></div>
  <aside class="activity-drawer" data-key="activity-drawer" aria-label="CareerCompass AI tool activity">
    <div class="drawer-header"><div><span>Behind the conversation</span><h2>WebMCP activity</h2></div><button data-action="toggle-activity" aria-label="Close activity">${icon("x", 19)}</button></div>
    <p class="drawer-intro">Chrome-native registration is shown separately from CareerCompass AI local tool calls. A local tool call does not mean Chrome registered the tool.</p>
    <div class="drawer-scroll-content">
      ${renderNativeDiagnostics()}
      <section class="local-tool-card">
        <div class="local-tool-heading"><span>CareerCompass AI calls</span><strong>${journey.toolLog.length}</strong></div>
        <div class="tool-log">
          ${journey.toolLog.length ? journey.toolLog.map((entry) => `<article class="tool-log-row ${entry.status}" data-key="${entry.id}">
            <span>${icon(entry.status === "completed" ? "check" : "info", 15)}</span>
            <div><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.label)} · ${entry.durationMs} ms</small></div>
          </article>`).join("") : `<div class="empty-tool-log">No CareerCompass AI tools have run yet. Your first supported-field selection will start the trace.</div>`}
        </div>
      </section>
    </div>
    <div class="drawer-safety">${icon("shield", 17)}<p><strong>Student remains in control.</strong> Read and reasoning tools can run automatically. Official plan changes still require explicit approval.</p></div>
  </aside>`;
}

function scrollConversation() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const container = document.getElementById("conversation-scroll");
    const active = container?.querySelector(".active-step-card");
    if (!container) return;
    if (!active) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    const containerTop = container.getBoundingClientRect().top;
    const activeTop = active.getBoundingClientRect().top;
    const target = Math.max(0, container.scrollTop + activeTop - containerTop - 18);
    container.scrollTo({ top: target, behavior: "smooth" });
  }));
}

function chooseCareerGroup(groupId) {
  const group = careerGroupChoices().find((item) => item.id === groupId);
  if (!group) {
    setJourney({ error: "That direction is not available in the current career catalog." }, { scroll: true });
    return;
  }
  appendMessage("user", `Show me the supported paths for ${group.title}.`);
  appendMessage("assistant", `I’ll keep only the ${group.topics.length} fields inside this direction. Choose one and I’ll then show its available roles.`, "Direction narrowed");
  setJourney({ directionMode: "fields", selectedGroup: group.id, candidates: [], error: "" }, { scroll: true });
}

function browseAllFields() {
  appendMessage("user", "Show me every career field supported in this version.");
  appendMessage("assistant", "Here is the complete catalog, grouped into six areas. You can select only a field that exists in the attached data.", "Supported catalog opened");
  setJourney({ directionMode: "all", selectedGroup: "", candidates: [], error: "" }, { scroll: true });
}

function backToCareerGroups() {
  setJourney({ directionMode: "groups", selectedGroup: "", candidates: [], error: "" }, { scroll: true });
}

async function chooseField(topic, role) {
  const detail = exploreCareerPath({ topic, role });
  if (detail.status !== "ok" || detail.topic !== topic) {
    setJourney({ error: "That field is not supported by the current CareerCompass AI catalog." }, { scroll: true });
    return;
  }
  const suggestedRole = detail.careerPaths.includes(role) ? role : detail.careerPaths[0] || "";
  appendMessage("user", `I want to explore ${detail.topic}.`);
  setJourney({ selectedTopic: detail.topic, suggestedRole, candidates: [], showAllRoles: false, directionMode: "fields", error: "" }, { persist: false });
  await executeTool("explore_career_path", { topic: detail.topic, role: suggestedRole }, `Opening only the ${detail.topic} path`);
  moveToStep("role", `Good. I’ve removed every other field. Now choose one of the ${detail.careerPaths.length} roles available inside ${detail.topic}.`, "Supported field selected");
}

async function chooseRole(role) {
  const detail = currentDetail();
  if (!detail?.careerPaths?.includes(role)) {
    setJourney({ error: "That role is not available inside the selected career field." }, { scroll: true });
    return;
  }
  appendMessage("user", `${role} feels closest to what I want.`);
  dataStore.selectCareerGoal({ topic: journey.selectedTopic, role }, { appendMessages: false });
  journey = { ...journey, selectedRole: role };
  await executeTool("get_student_profile", {}, "Checking your current academic starting point");
  moveToStep("priority", `I’ll use ${role} as the anchor for every later decision. ${roleSummary(role, journey.selectedTopic)} What should this pathway optimize first?`, "Role selected");
}

async function choosePriority(value) {
  const option = priorityOptions().find((item) => item.id === value);
  if (!option) {
    setJourney({ error: "Choose one of the available pathway priorities." }, { scroll: true });
    return;
  }
  appendMessage("user", `${option.title} matters most right now.`);
  journey = { ...journey, priority: value };
  await executeTool("get_degree_requirements", {}, "Checking only the degree constraints relevant to your goal");
  moveToStep("route", priorityNarrative(value), "Priority set");
}

async function chooseRoute(value) {
  const alignment = getCareerDegreeAlignment(journey.selectedRole, student);
  const option = routeOptions(alignment).find((item) => item.id === value);
  if (!option) {
    setJourney({ error: "Choose one of the academic routes shown for this degree fit." }, { scroll: true });
    return;
  }
  appendMessage("user", `Use this route: ${option.title}.`);
  journey = { ...journey, route: value };
  await generatePlan(journey.workload || "balanced", false);
  moveToStep("semester", "I used that route to build only your next semester. Choose a workload, review the courses, and approve the working plan before we move on.", "Academic route selected");
}

async function generatePlan(workload, renderAfter = true) {
  journey = { ...journey, workload, planApprovalId: "", planApproved: false };
  const plan = await executeTool("simulate_degree_plan", {
    careerGoal: journey.selectedRole,
    workload,
    includeResearch: journey.priority === "research",
  }, `Simulating a ${workload} next-semester route`);
  journey = { ...journey, plan, workload };
  persistJourney();
  if (renderAfter) scheduleRender({ scroll: true });
  return plan;
}

async function proposePlan() {
  const result = await executeTool("create_degree_plan", {
    careerGoal: journey.selectedRole,
    workload: journey.workload,
  }, "Preparing the plan for your confirmation");
  setJourney({ planApprovalId: result.approvalId || "" }, { scroll: true });
}

async function approvePlan() {
  const approvalId = journey.planApprovalId;
  if (!approvalId) return;
  dataStore.approve(approvalId);
  appendMessage("user", ["explore", "advisor"].includes(journey.route) ? "Save this as my working next-semester plan while I review the academic route." : "Approve this as my working degree plan.");
  const gaps = await executeTool("identify_skill_gaps", { careerGoal: journey.selectedRole }, "Finding the smallest set of useful skill gaps");
  const options = skillChoices(gaps, currentDetail());
  journey = { ...journey, planApproved: true, skillOptions: options, planApprovalId: "" };
  moveToStep("skills", "Plan approved. Instead of showing every possible skill, I narrowed the analysis to three. Pick one for the first 30-day sprint.", "Plan confirmed");
}

function adjustPlan() {
  if (journey.planApprovalId) dataStore.reject(journey.planApprovalId);
  appendMessage("user", "I want to adjust the workload before approving.");
  setJourney({ planApprovalId: "", planApproved: false }, { scroll: true });
}

function chooseSkill(skill) {
  const detail = currentDetail();
  if (!journey.skillOptions.some((option) => option.skill === skill)) {
    setJourney({ error: "Choose one of the skill gaps generated for this pathway." }, { scroll: true });
    return;
  }
  appendMessage("user", `Focus first on ${skill}.`);
  setJourney({ selectedSkill: skill, learningAction: pickLearningAction(detail, skill) }, { scroll: true });
}

function confirmSkill() {
  appendMessage("user", `Make ${journey.selectedSkill} my first 30-day skill sprint.`);
  moveToStep("experience", `Done. I’ll use ${journey.selectedSkill} as the filter for your first proof point. Choose whether that proof should come from an internship, research, or a portfolio project.`, "Skill sprint selected");
}

async function chooseExperienceType(type) {
  if (!["internship", "research", "portfolio"].includes(type)) {
    setJourney({ error: "Choose internship, research, or a portfolio project." }, { scroll: true });
    return;
  }
  const detail = currentDetail();
  appendMessage("user", `Look for a ${type === "portfolio" ? "portfolio project" : type} first.`);
  let choices = [];

  if (type === "portfolio") {
    const project = portfolioProject(journey.selectedTopic, journey.selectedRole, journey.selectedSkill);
    choices = [
      { id: "portfolio_primary", type, title: project.title, organization: "Self-directed", note: project.description, verified: true, source: "generated" },
      { id: "portfolio_stretch", type, title: `${journey.selectedRole} stretch project`, organization: "Mentor-reviewed", note: `Extend the first project with a real user, dataset, device, or operational constraint and document the result.`, verified: true, source: "generated" },
    ];
    journey = { ...journey, experienceType: type, experienceChoices: choices, selectedExperience: null };
    appendMessage("assistant", "I created two proof projects from your selected role and skill. Choose the one you can realistically finish.", "Portfolio options ready");
    persistJourney();
    scheduleRender({ scroll: true });
    return;
  }

  const tool = type === "research" ? "find_research_opportunities" : "find_internships";
  await executeTool(tool, { query: journey.selectedTopic, eligibleOnly: false, limit: 2 }, `Finding two ${type} options for ${journey.selectedRole}`);
  choices = catalogOpportunityChoices(detail, type, 2);

  if (!choices.length && type === "research") {
    choices = [
      {
        id: "research_brief",
        type: "research",
        title: `Faculty search brief for ${journey.selectedTopic}`,
        organization: student.degree,
        note: `The attached catalog does not provide a verified research contact for this field. Build a focused outreach brief using ${journey.selectedSkill} and your proof project instead of showing unrelated labs.`,
        verified: false,
        source: "generated",
      },
    ];
  }

  if (!choices.length && type === "internship") {
    choices = [
      {
        id: "internship_brief",
        type: "internship",
        title: `${journey.selectedRole} internship search brief`,
        organization: journey.selectedTopic,
        note: `The catalog does not provide a verified listing for this path. Use the selected skill, next-semester courses, and proof project as filters for a targeted search.`,
        verified: false,
        source: "generated",
      },
    ];
  }

  journey = { ...journey, experienceType: type, experienceChoices: choices, selectedExperience: null };
  appendMessage("assistant", `I kept only ${choices.length} ${type} option${choices.length === 1 ? "" : "s"}. Choose one and I’ll explain why it belongs in your pathway.`, "Focused options ready");
  persistJourney();
  scheduleRender({ scroll: true });
}

function chooseExperience(id) {
  const item = journey.experienceChoices.find((choice) => choice.id === id);
  if (!item) return;
  appendMessage("user", `Go deeper on ${item.title}.`);
  setJourney({ selectedExperience: item }, { scroll: true });
}

function confirmExperience() {
  if (!journey.selectedExperience) return;
  appendMessage("user", `Add ${journey.selectedExperience.title} to my pathway.`);
  moveToStep("funding", "Added. Before I assemble the roadmap, decide whether funding belongs in this version. I’ll either show two relevant leads or leave it out entirely.", "Experience selected");
}

async function showFunding() {
  appendMessage("user", "Show only funding that fits this career path.");
  await executeTool("find_scholarships", { query: journey.selectedTopic, eligibleOnly: false, limit: 2 }, "Finding no more than two relevant funding leads");
  const choices = catalogOpportunityChoices(currentDetail(), "scholarship", 2);
  journey = { ...journey, fundingChoice: "show", scholarshipChoices: choices, selectedScholarship: null };
  appendMessage("assistant", choices.length ? "I found two focused leads. Choose one to keep, or skip both." : "The catalog does not contain a sufficiently specific funding lead for this field, so I am not filling the screen with generic awards.", "Funding narrowed");
  persistJourney();
  scheduleRender({ scroll: true });
  if (!choices.length) await finishRoadmap();
}

function chooseScholarship(id) {
  const item = journey.scholarshipChoices.find((choice) => choice.id === id);
  if (!item) return;
  appendMessage("user", `Keep ${item.title} on my pathway.`);
  setJourney({ selectedScholarship: item }, { scroll: true });
}

async function skipFunding() {
  appendMessage("user", "Skip funding for now.");
  journey = { ...journey, fundingChoice: "skip", selectedScholarship: null };
  await finishRoadmap();
}

async function confirmFunding() {
  if (!journey.selectedScholarship) return;
  appendMessage("user", `Add ${journey.selectedScholarship.title} and finish my roadmap.`);
  await finishRoadmap();
}

async function finishRoadmap() {
  await executeTool("build_personalized_pathway", {
    careerGoal: journey.selectedRole,
    workload: journey.workload,
  }, "Connecting your selected decisions into one roadmap");
  const milestones = finalMilestones({
    role: journey.selectedRole,
    topic: journey.selectedTopic,
    route: journey.route,
    plan: journey.plan,
    skill: journey.selectedSkill,
    experience: journey.selectedExperience,
    scholarship: journey.selectedScholarship,
    priority: journey.priority,
  });
  journey = { ...journey, finalPathway: { milestones, builtAt: new Date().toISOString() } };
  moveToStep("roadmap", `Your pathway is ready. It contains only the decisions you made: ${journey.selectedRole}, a ${journey.workload} next term, ${journey.selectedSkill} as the first skill sprint, and ${journey.selectedExperience?.title || "one focused proof point"}.`, "Pathway assembled");
}

function dependentResetFor(stepId) {
  const order = JOURNEY_STEPS.map((step) => step.id);
  const targetIndex = order.indexOf(stepId);
  const cleared = { ...journey, currentStep: stepId, error: "" };
  cleared.completedSteps = journey.completedSteps.filter((id) => order.indexOf(id) < targetIndex);

  if (targetIndex <= order.indexOf("direction")) {
    return emptyJourney();
  }
  if (targetIndex <= order.indexOf("role")) {
    Object.assign(cleared, {
      selectedRole: "", priority: "", route: "", plan: null, planApprovalId: "", planApproved: false,
      skillOptions: [], selectedSkill: "", learningAction: null, experienceType: "", experienceChoices: [], selectedExperience: null,
      fundingChoice: "", scholarshipChoices: [], selectedScholarship: null, finalPathway: null,
    });
  } else if (targetIndex <= order.indexOf("priority")) {
    Object.assign(cleared, {
      priority: "", route: "", plan: null, planApprovalId: "", planApproved: false, skillOptions: [], selectedSkill: "", learningAction: null,
      experienceType: "", experienceChoices: [], selectedExperience: null, fundingChoice: "", scholarshipChoices: [], selectedScholarship: null, finalPathway: null,
    });
  } else if (targetIndex <= order.indexOf("route")) {
    Object.assign(cleared, {
      route: "", plan: null, planApprovalId: "", planApproved: false, skillOptions: [], selectedSkill: "", learningAction: null,
      experienceType: "", experienceChoices: [], selectedExperience: null, fundingChoice: "", scholarshipChoices: [], selectedScholarship: null, finalPathway: null,
    });
  } else if (targetIndex <= order.indexOf("semester")) {
    Object.assign(cleared, {
      planApprovalId: "", planApproved: false, skillOptions: [], selectedSkill: "", learningAction: null,
      experienceType: "", experienceChoices: [], selectedExperience: null, fundingChoice: "", scholarshipChoices: [], selectedScholarship: null, finalPathway: null,
    });
  } else if (targetIndex <= order.indexOf("skills")) {
    Object.assign(cleared, {
      selectedSkill: "", learningAction: null, experienceType: "", experienceChoices: [], selectedExperience: null,
      fundingChoice: "", scholarshipChoices: [], selectedScholarship: null, finalPathway: null,
    });
  } else if (targetIndex <= order.indexOf("experience")) {
    Object.assign(cleared, {
      experienceType: "", experienceChoices: [], selectedExperience: null, fundingChoice: "", scholarshipChoices: [], selectedScholarship: null, finalPathway: null,
    });
  } else if (targetIndex <= order.indexOf("funding")) {
    Object.assign(cleared, { fundingChoice: "", scholarshipChoices: [], selectedScholarship: null, finalPathway: null });
  }
  return cleared;
}

function goToStep(stepId) {
  const targetIndex = JOURNEY_STEPS.findIndex((step) => step.id === stepId);
  if (targetIndex < 0 || targetIndex > currentStepIndex()) return;
  appendMessage("user", `Let’s revisit ${JOURNEY_STEPS[targetIndex].label.toLowerCase()}.`);
  journey = dependentResetFor(stepId);
  appendMessage("assistant", "I kept your completed student profile and cleared only the decisions that depend on this step.", "Pathway recalculated");
  persistJourney();
  scheduleRender({ scroll: true });
}

function startOver() {
  try {
    window.localStorage.removeItem(JOURNEY_STORAGE_KEY);
  } catch {
    // Continue with in-memory reset.
  }
  dataStore.resetDemo();
  journey = emptyJourney();
  persistJourney();
  scheduleRender({ scroll: true, focus: true });
}

function restartWithCareer() {
  const retainedMessages = [
    ...journey.messages,
    { id: makeId("message"), role: "user", text: "I want to explore a different career.", timestamp: new Date().toISOString() },
    { id: makeId("message"), role: "assistant", title: "Career exploration reopened", text: "Choose a supported direction below. I’ll keep your student profile but rebuild every career-dependent choice.", timestamp: new Date().toISOString() },
  ];
  const fresh = emptyJourney();
  journey = { ...fresh, messages: retainedMessages };
  dataStore.resetDemo();
  persistJourney();
  scheduleRender({ scroll: true, focus: true });
}

function explainCurrentStep() {
  const group = careerGroupChoices().find((item) => item.id === journey.selectedGroup);
  const explanations = {
    direction: journey.directionMode === "groups"
      ? "These six directions cover all 20 career fields in the attached catalog. Choose the closest direction first so you see only the fields relevant to that area."
      : journey.directionMode === "fields"
        ? `These are the only supported fields inside ${group?.title || "your selected direction"}. Selecting one prevents unrelated careers from entering the pathway.`
        : "This is the full supported catalog. Careers outside these 20 fields are not accepted by this MVP because CareerCompass AI does not have structured data for them.",
    role: `These are the roles defined for ${journey.selectedTopic}. The role you choose becomes the anchor for courses, skill gaps, and opportunities.`,
    priority: "The first priority changes the order of later recommendations. Internship, research, portfolio, and graduation-first pathways should not be identical.",
    route: "These route options reflect how closely your current degree aligns with the selected career, instead of assuming every degree is a direct fit.",
    semester: "Only the next semester is shown because it is the decision you can act on now. Prerequisites and later terms remain in the planning engine.",
    skills: "Only the three most useful gaps are shown. Selecting one creates a focused 30-day learn-and-prove sprint.",
    experience: "The options are constrained by your role, priority, academic route, approved semester, and selected skill sprint.",
    funding: "Funding is optional and capped at two relevant leads so generic scholarships do not distract from the pathway.",
    roadmap: "The roadmap contains only the choices made in this journey. It is not a generic dashboard or a dump of the entire catalog.",
  };
  appendMessage("assistant", explanations[journey.currentStep] || "Choose one of the available options to keep the pathway focused.", "Why these options");
  persistJourney();
  scheduleRender({ scroll: true });
}

root.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control || journey.busy) return;
  const action = control.dataset.action;
  const run = async () => {
    switch (action) {
      case "choose-career-group":
        chooseCareerGroup(control.dataset.group);
        break;
      case "browse-all-fields":
        browseAllFields();
        break;
      case "back-to-career-groups":
        backToCareerGroups();
        break;
      case "choose-field":
        await chooseField(control.dataset.topic, control.dataset.role);
        break;
      case "show-all-roles":
        setJourney({ showAllRoles: true }, { scroll: true });
        break;
      case "choose-role":
        await chooseRole(control.dataset.role);
        break;
      case "choose-priority":
        await choosePriority(control.dataset.value);
        break;
      case "choose-route":
        await chooseRoute(control.dataset.value);
        break;
      case "choose-workload":
        appendMessage("user", `Use a ${control.dataset.value} workload.`);
        await generatePlan(control.dataset.value);
        break;
      case "propose-plan":
        await proposePlan();
        break;
      case "approve-plan":
        await approvePlan();
        break;
      case "adjust-plan":
        adjustPlan();
        break;
      case "choose-skill":
        chooseSkill(control.dataset.skill);
        break;
      case "confirm-skill":
        confirmSkill();
        break;
      case "choose-experience-type":
        await chooseExperienceType(control.dataset.value);
        break;
      case "change-experience-type":
        setJourney({ experienceType: "", experienceChoices: [], selectedExperience: null }, { scroll: true });
        break;
      case "choose-experience":
        chooseExperience(control.dataset.id);
        break;
      case "confirm-experience":
        confirmExperience();
        break;
      case "show-funding":
        await showFunding();
        break;
      case "skip-funding":
        await skipFunding();
        break;
      case "choose-scholarship":
        chooseScholarship(control.dataset.id);
        break;
      case "confirm-funding":
        await confirmFunding();
        break;
      case "go-to-step":
        goToStep(control.dataset.step);
        break;
      case "restart-with-career":
        restartWithCareer();
        break;
      case "start-over":
        startOver();
        break;
      case "explain-current-step":
        explainCurrentStep();
        break;
      case "open-webmcp-diagnostics":
        setJourney({ activityOpen: true }, { persist: false });
        break;
      case "recheck-webmcp":
        nativeWebMCPRegistration = await runtime.reregister();
        window.__CAREERCOMPASS_AI_WEBMCP_REGISTRATION__ = nativeWebMCPRegistration;
        scheduleRender();
        break;
      case "toggle-activity":
        setJourney({ activityOpen: !journey.activityOpen }, { persist: false });
        break;
      default:
        break;
    }
  };
  run().catch((error) => console.error("CareerCompass AI action failed", error));
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && journey.activityOpen) setJourney({ activityOpen: false }, { persist: false });
});

window.CareerCompassAI = {
  getState: () => structuredClone(journey),
  getDataState: () => structuredClone(dataStore.getState()),
  tools: runtime.definitions.map(({ name, title, description, annotations }) => ({ name, title, description, annotations })),
  executeTool: (name, input = {}) => runtime.execute(name, input, "careercompass-ai-console"),
  startOver,
  goToStep,
};
window.CareerCompassAIWebMCP = {
  tools: runtime.publicTools,
  execute: (name, input = {}) => runtime.execute(name, input, "careercompass-ai-console"),
  getState: () => dataStore.getState(),
  diagnostics: () => runtime.diagnostics(),
  registration: () => runtime.getRegistrationReport(),
  getNativeTools: () => runtime.discoverNativeTools(),
  reregister: () => runtime.reregister(),
};
window.__CAREERCOMPASS_AI_WEBMCP_REGISTRATION__ = nativeWebMCPRegistration;

scheduleRender({ scroll: true, focus: true });

async function configureServiceWorker() {
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  if (localHost) {
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("careercompass-ai-")).map((key) => caches.delete(key)));
    }
    const reloadKey = "careercompass-ai-webmcp-local-sw-cleared-v3.0";
    if (wasControlled && !sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "1");
      location.reload();
    }
    return;
  }
  await navigator.serviceWorker.register("./service-worker.js");
}
configureServiceWorker().catch((error) => console.warn("CareerCompass AI service worker setup skipped", error));

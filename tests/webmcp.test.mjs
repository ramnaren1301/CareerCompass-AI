import test from "node:test";
import assert from "node:assert/strict";
import { buildPersonalizedPathway } from "../src/engine.js";
import { createWebMCPRuntime } from "../src/webmcp.js";

function runtimeFixture() {
  let state = {
    profileGoal: "Machine Learning Engineer",
    officialPlan: null,
    pathway: buildPersonalizedPathway({ careerGoal: "Machine Learning Engineer" }),
    workload: "balanced",
    pendingApprovals: [],
    careerTopic: "AI/ML",
    careerRole: "ML Engineer",
    view: "overview",
  };
  const store = {
    getState: () => state,
    setState: (update) => { state = typeof update === "function" ? update(state) : { ...state, ...update }; },
    recordToolActivity: () => {},
    queueApproval: (input) => ({ id: "approval_test", ...input }),
  };
  return { runtime: createWebMCPRuntime(store), store };
}

test("WebMCP exposes 33 unique, strict tool contracts", () => {
  const { runtime } = runtimeFixture();
  assert.equal(runtime.definitions.length, 33);
  assert.equal(new Set(runtime.definitions.map((tool) => tool.name)).size, 33);
  for (const tool of runtime.definitions) {
    assert.match(tool.name, /^[a-z][a-z0-9_]+$/);
    assert.ok(tool.title.length > 4);
    assert.ok(tool.description.length > 20);
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
  }
});

test("read-only and approval-gated tools are clearly separated", () => {
  const { runtime } = runtimeFixture();
  const writes = runtime.definitions.filter((tool) => !tool.annotations.readOnlyHint).map((tool) => tool.name);
  assert.equal(writes.length, 8);
  assert.deepEqual(writes.sort(), [
    "add_course_to_plan",
    "create_degree_plan",
    "express_research_interest",
    "save_internship",
    "save_research_opportunity",
    "save_scholarship",
    "update_internship_status",
    "update_scholarship_status",
  ].sort());
});

test("JSON career tools are read-only, untrusted-content-aware, and executable", async () => {
  const { runtime, store } = runtimeFixture();
  const names = [
    "get_career_catalog_status",
    "list_career_fields",
    "explore_career_path",
    "recommend_career_paths",
    "compare_career_paths",
  ];
  for (const name of names) {
    const definition = runtime.definitions.find((tool) => tool.name === name);
    assert.ok(definition, `missing ${name}`);
    assert.equal(definition.annotations.readOnlyHint, true);
    assert.equal(definition.annotations.untrustedContentHint, true);
  }

  const status = await runtime.execute("get_career_catalog_status");
  assert.equal(status.fieldCount, 20);
  assert.equal(status.asOf, "August 2026");

  const result = await runtime.execute("explore_career_path", { topic: "Cybersecurity" });
  assert.equal(result.status, "ok");
  assert.equal(result.topic, "Cybersecurity");
  assert.equal(store.getState().view, "overview");
  assert.equal(store.getState().careerRole, "Security Analyst");

  await runtime.execute("explore_career_path", { topic: "Robotics" }, "direct-test");
  assert.equal(store.getState().view, "career");
  assert.equal(store.getState().careerTopic, "Robotics");
});

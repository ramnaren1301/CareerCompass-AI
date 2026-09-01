import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, createStore } from "../src/store.js";

test("the overview starts without a hard-coded career goal", () => {
  const state = createInitialState();
  assert.equal(state.profileGoal, "");
  assert.equal(state.profileCareerTopic, "");
  assert.equal(state.goalPickerOpen, true);
  assert.equal(state.pathway.plan.goal, "Career goal not selected");
});

test("a conversational career selection rebuilds the entire active pathway", () => {
  const store = createStore(createInitialState());
  const selected = store.selectCareerGoal(
    { topic: "Cybersecurity", role: "Penetration Tester", sourceText: "I want to protect systems and test their security." },
    { appendMessages: false },
  );
  assert.equal(selected.role, "Penetration Tester");
  assert.equal(store.getState().profileGoal, "Penetration Tester");
  assert.equal(store.getState().profileCareerTopic, "Cybersecurity");
  assert.equal(store.getState().pathway.plan.goal, "Penetration Tester");
  assert.ok(store.getState().pathway.plan.terms.flatMap((term) => term.courses).some((course) => course.code === "CS440"));
  assert.equal(store.getState().goalPickerOpen, false);
});

test("agent write requests do not change state before approval", () => {
  const store = createStore(createInitialState());
  store.selectCareerGoal({ topic: "Cybersecurity", role: "Penetration Tester" }, { appendMessages: false });
  const plan = store.getState().pathway.plan;
  const approval = store.queueApproval({
    actionType: "create_degree_plan",
    title: "Adopt plan",
    summary: "Use the proposed plan.",
    payload: { plan },
  });
  assert.equal(store.getState().officialPlan, null);
  assert.equal(store.getState().pendingApprovals.length, 1);
  store.approve(approval.id);
  assert.equal(store.getState().pendingApprovals.length, 0);
  assert.equal(store.getState().officialPlan.goal, "Penetration Tester");
  assert.equal(store.getState().approvalHistory[0].status, "approved");
});

test("rejected requests leave the official plan unchanged", () => {
  const store = createStore(createInitialState());
  store.selectCareerGoal({ topic: "Robotics", role: "Robotics Engineer" }, { appendMessages: false });
  const approval = store.queueApproval({
    actionType: "create_degree_plan",
    title: "Adopt plan",
    summary: "Use the proposed plan.",
    payload: { plan: store.getState().pathway.plan },
  });
  store.reject(approval.id);
  assert.equal(store.getState().officialPlan, null);
  assert.equal(store.getState().approvalHistory[0].status, "rejected");
});

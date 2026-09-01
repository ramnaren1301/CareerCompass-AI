import test from "node:test";
import assert from "node:assert/strict";
import {
  checkPrerequisites,
  getCareerDegreeAlignment,
  getDegreeProgress,
  rankInternships,
  rankResearch,
  rankScholarships,
  simulateDegreePlan,
} from "../src/engine.js";
import { student } from "../src/data.js";

test("degree progress reflects the seeded student profile", () => {
  assert.equal(student.careerGoal, "");
  const progress = getDegreeProgress(student);
  assert.equal(progress.percent, 68);
  assert.equal(progress.remaining, 38);
  assert.equal(progress.graduationTarget, "May 2028");
});

test("Machine Learning is blocked until Algorithms is completed", () => {
  const status = checkPrerequisites("CS410", student.completedCourses);
  assert.equal(status.eligible, false);
  assert.deepEqual(status.missing, ["CS310"]);
});

test("simulated degree plan respects prerequisite order", () => {
  const plan = simulateDegreePlan({ careerGoal: "Machine Learning Engineer" });
  const termIndex = new Map();
  plan.terms.forEach((term, index) => term.courses.forEach((course) => termIndex.set(course.code, index)));
  assert.ok(termIndex.get("CS310") < termIndex.get("CS410"));
  assert.ok(termIndex.get("CS410") < termIndex.get("CS421"));
  assert.ok(termIndex.get("CS490") < termIndex.get("CS491"));
  assert.equal(plan.remaining.length, 0);
  assert.equal(plan.onTrack, true);
});

test("every planned course has prerequisites completed in an earlier term", () => {
  const plan = simulateDegreePlan({ careerGoal: "Machine Learning Engineer" });
  const completed = new Set(student.completedCourses);
  for (const term of plan.terms) {
    for (const course of term.courses) {
      for (const prerequisite of course.prerequisites) assert.ok(completed.has(prerequisite), `${course.code} missing ${prerequisite}`);
    }
    term.courses.forEach((course) => completed.add(course.code));
  }
});

test("opportunity match scores are ranked, calibrated, and explainable", () => {
  const options = { careerGoal: "Machine Learning Engineer" };
  for (const ranked of [rankResearch(options), rankScholarships(options), rankInternships(options)]) {
    assert.ok(ranked.length >= 15);
    assert.ok(ranked[0].matchScore < 100);
    for (let index = 1; index < ranked.length; index += 1) assert.ok(ranked[index - 1].matchScore >= ranked[index].matchScore);
    assert.ok(ranked[0].reasons.length >= 3);
  }
  assert.equal(rankInternships(options)[0].title, "Machine Learning Engineering Intern");
  assert.equal(rankScholarships(options)[0].title, "AI Future Scholars Award");
});


test("catalog careers generate different role-aligned course routes", () => {
  const cyber = simulateDegreePlan({ careerGoal: "Security Analyst" });
  const ux = simulateDegreePlan({ careerGoal: "UX Researcher" });
  const robotics = simulateDegreePlan({ careerGoal: "Robotics Engineer" });
  const codes = (plan) => plan.terms.flatMap((term) => term.courses.map((course) => course.code));
  assert.equal(cyber.catalogTopic, "Cybersecurity");
  assert.ok(codes(cyber).includes("CS440"));
  assert.equal(ux.catalogTopic, "Human-Computer Interaction (UX/UI)");
  assert.ok(codes(ux).includes("CS250"));
  assert.equal(robotics.catalogTopic, "Robotics");
  assert.ok(codes(robotics).includes("CS413"));
  assert.notDeepEqual(codes(cyber), codes(ux));
});

test("engineering pivots are explained instead of silently treated as ML", () => {
  const alignment = getCareerDegreeAlignment("Mechanical Design Engineer");
  assert.equal(alignment.level, "pivot");
  assert.match(alignment.message, /advisor review/i);
});

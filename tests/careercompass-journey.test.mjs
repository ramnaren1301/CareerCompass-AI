import test from "node:test";
import assert from "node:assert/strict";
import {
  JOURNEY_STEPS,
  allSupportedCareerFields,
  careerFieldsForGroup,
  careerGroupChoices,
  catalogOpportunityChoices,
  emptyJourney,
  finalMilestones,
  roleChoices,
  routeOptions,
  skillChoices,
  supportedCareerCounts,
} from "../src/careercompass-journey.js";
import { exploreCareerPath } from "../src/career-catalog.js";
import { getCareerDegreeAlignment } from "../src/engine.js";

test("the CareerCompass AI defines one ordered nine-step journey", () => {
  assert.deepEqual(
    JOURNEY_STEPS.map((step) => step.id),
    ["direction", "role", "priority", "route", "semester", "skills", "experience", "funding", "roadmap"],
  );
  const journey = emptyJourney();
  assert.equal(journey.currentStep, "direction");
  assert.equal(journey.selectedRole, "");
  assert.equal(journey.finalPathway, null);
  assert.match(journey.messages[0].text, /choosing from the career areas supported/i);
});

test("selection-first career groups cover every supported field exactly once", () => {
  const groups = careerGroupChoices();
  const counts = supportedCareerCounts();
  const topics = groups.flatMap((group) => group.topics);

  assert.equal(groups.length, 6);
  assert.equal(counts.fields, 20);
  assert.equal(counts.roles, 54);
  assert.equal(topics.length, 20);
  assert.equal(new Set(topics).size, 20);
  assert.equal(allSupportedCareerFields().flatMap((group) => group.fields).length, 20);
  assert.ok(careerFieldsForGroup("hardware-physical").some((field) => field.topic === "Robotics"));
});

test("role selection stays inside the chosen field and returns at most three choices", () => {
  const roles = roleChoices("AI/ML", "MLOps Engineer");
  assert.ok(roles.length > 0 && roles.length <= 3);
  assert.equal(roles[0].role, "MLOps Engineer");
  assert.ok(roles.every((item) => item.summary.length > 20));
});

test("academic route options reflect degree alignment instead of pretending all careers fit equally", () => {
  const alignment = getCareerDegreeAlignment("ASIC Design Engineer");
  const routes = routeOptions(alignment);
  assert.equal(alignment.level, "pivot");
  assert.ok(routes.some((route) => route.id === "explore" && route.recommended));
  assert.ok(routes.some((route) => route.id === "advisor"));
});

test("skill and opportunity helpers enforce progressive disclosure", () => {
  const detail = exploreCareerPath({ topic: "Robotics", role: "Robotics Engineer" });
  const skills = skillChoices({ gaps: [
    { skill: "Robot perception", currentLevel: 0 },
    { skill: "Control systems", currentLevel: 1 },
    { skill: "Programming", currentLevel: 2 },
    { skill: "Extra unrelated item", currentLevel: 0 },
  ] }, detail);
  const internships = catalogOpportunityChoices(detail, "internship", 2);

  assert.equal(skills.length, 3);
  assert.ok(internships.length <= 2);
  assert.ok(internships.every((item) => item.type === "internship"));
});

test("the final roadmap is assembled only from the student's selected decisions", () => {
  const milestones = finalMilestones({
    role: "Robotics Engineer",
    topic: "Robotics",
    route: "bridge",
    priority: "internship",
    skill: "Control systems",
    plan: {
      workload: "balanced",
      terms: [{ label: "Fall 2026", courses: [{ code: "CS310", title: "Algorithms" }] }],
    },
    experience: { title: "NVIDIA Ignite", note: "Focused student internship" },
    scholarship: null,
  });

  assert.equal(milestones.length, 5);
  assert.match(milestones[0].title, /bridge/i);
  assert.match(milestones[0].detail, /Robotics Engineer/);
  assert.match(milestones[1].title, /CS310/);
  assert.match(milestones[2].title, /Control systems/);
  assert.equal(milestones[3].title, "NVIDIA Ignite");
});

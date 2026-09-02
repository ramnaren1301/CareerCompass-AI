import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { careerCatalogFallback } from "../src/career-catalog-data.js";
import {
  compareCareerPaths,
  exploreCareerPath,
  findCareerMatch,
  getCareerCatalogStatus,
  getCareerField,
  listCareerFields,
  recommendCareerPaths,
} from "../src/career-catalog.js";


test("generated fallback remains identical to the attached runtime JSON", () => {
  const external = JSON.parse(readFileSync(new URL("../data/careercompass-career-catalog.json", import.meta.url), "utf8"));
  assert.deepEqual(careerCatalogFallback, external);
});

test("attached career JSON is normalized with complete catalog counts", () => {
  const status = getCareerCatalogStatus();
  assert.equal(status.fieldCount, 20);
  assert.equal(status.roleCount, 54);
  assert.equal(status.scholarshipCount, 31);
  assert.equal(status.internshipCount, 41);
  assert.equal(status.researchContactCount, 4);
  assert.equal(status.totalEntries, 192);
  assert.equal(status.verifiedLinks, 22);
  assert.equal(status.linksNeedingVerification, 170);
  assert.equal(status.asOf, "August 2026");
  assert.match(status.verificationStatus, /AI\/ML fully verified/i);
});

test("all 20 career fields can be listed and searched", () => {
  assert.equal(listCareerFields().length, 20);
  const robotics = listCareerFields({ query: "Robotics Engineer" });
  assert.equal(robotics.length, 1);
  assert.equal(robotics[0].topic, "Robotics");
  assert.ok(robotics[0].roles.includes("Robotics Engineer"));
});

test("AI/ML exploration preserves the JSON structure and null URLs", () => {
  const result = exploreCareerPath({ topic: "AI/ML", role: "MLOps Engineer" });
  assert.equal(result.status, "ok");
  assert.equal(result.selectedRole, "MLOps Engineer");
  assert.deepEqual(result.careerPaths, ["ML Engineer", "AI Research Scientist", "MLOps Engineer", "Applied Scientist"]);
  assert.equal(result.learningPath.beginner.length, 4);
  assert.equal(result.learningPath.intermediate.length, 3);
  assert.equal(result.learningPath.advanced.length, 3);
  assert.equal(result.scholarships[0].name, "Amazon Future Engineer Scholarship");
  assert.equal(result.internships[0].name, "Google STEP");
  assert.equal(result.researchContacts.length, 4);

  const mit = result.notableUniversities.find((item) => item.name === "MIT");
  const meta = result.internships.find((item) => item.name === "Meta University");
  assert.equal(mit.url, null);
  assert.equal(meta.url, null);
});


test("career intent matching prefers meaningful phrases over short role substrings", () => {
  assert.deepEqual(findCareerMatch("Machine Learning Engineer"), { topic: "AI/ML", role: "ML Engineer", strength: 96 });
  assert.equal(findCareerMatch("I want to become an ML engineer").topic, "AI/ML");
  assert.equal(findCareerMatch("EE").topic, "Electrical/Electronics Engineering");
  assert.equal(findCareerMatch("site reliability engineer").topic, "Cloud Computing / DevOps");
});

test("role text resolves back to its containing career field", () => {
  assert.equal(getCareerField("Physical Design Engineer").topic, "Chip Design / VLSI");
  assert.equal(getCareerField("UX Researcher").topic, "Human-Computer Interaction (UX/UI)");
});

test("career recommendations and comparisons return bounded structured results", () => {
  const recommendations = recommendCareerPaths({
    degree: "Computer Science",
    interests: ["AI", "Robotics"],
    skills: ["Python", "SQL"],
    limit: 3,
  });
  assert.equal(recommendations.length, 3);
  assert.equal(recommendations[0].topic, "AI/ML");
  assert.ok(recommendations[0].matchScore <= 98);

  const comparison = compareCareerPaths(["AI/ML", "Cybersecurity", "AI/ML"]);
  assert.equal(comparison.length, 2);
  assert.equal(comparison[0].topic, "AI/ML");
  assert.equal(comparison[0].learningResources, 10);
  assert.equal(comparison[1].topic, "Cybersecurity");
});


test("conversational phrases resolve across multiple JSON career fields", () => {
  assert.deepEqual(findCareerMatch("I want to build robots"), { topic: "Robotics", role: "Robotics Engineer", strength: 92 });
  assert.equal(findCareerMatch("I want to build intelligent robots")?.role, "Robotics Engineer");
  assert.equal(findCareerMatch("I enjoy protecting systems from hackers")?.role, "Security Analyst");
  const penetrationIntent = findCareerMatch("I want to protect companies by ethically testing their systems");
  assert.equal(penetrationIntent?.topic, "Cybersecurity");
  assert.equal(penetrationIntent?.role, "Penetration Tester");
  assert.ok(penetrationIntent?.strength >= 90);
  assert.equal(findCareerMatch("I want to design chips")?.role, "ASIC Design Engineer");
  assert.equal(findCareerMatch("I want to design computer chips")?.role, "ASIC Design Engineer");
  assert.equal(findCareerMatch("I like working with data and business decisions")?.role, "Business Analyst");
  assert.equal(findCareerMatch("I want to make mobile apps")?.topic, "Mobile App Development");
});

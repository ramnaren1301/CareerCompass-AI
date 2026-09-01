import {
  careerProfiles,
  courses,
  degreeProgram,
  internships,
  researchOpportunities,
  scholarships,
  student,
  terms,
} from "./data.js";
import { findCareerMatch, getCareerField } from "./career-catalog.js";

const normalize = (value = "") => String(value).trim().toLowerCase();
const unique = (items) => [...new Set(items.filter(Boolean))];
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const calibrateMatch = (raw, ceiling = 96) => Math.min(ceiling, Math.max(35, Math.round(raw * 0.9 + 5)));
const tokenize = (value = "") => normalize(value).split(/[^a-z0-9+#.]+/).filter((item) => item.length > 1);

const TRACKS = {
  "Machine Learning Engineer": ["CS240", "CS310", "CS330", "CS320", "CS401", "CS410", "CS450", "CS420", "CS430", "CS421", "CS490", "CS491"],
  "Data Scientist": ["CS240", "CS310", "CS320", "CS330", "CS380", "CS410", "STAT310", "CS420", "CS450", "CS490", "CS491"],
  "Software Engineer": ["CS230", "CS240", "CS310", "CS320", "CS330", "CS340", "CS350", "CS370", "CS430", "CS490", "CS491"],
  "Cybersecurity Engineer": ["CS260", "CS310", "CS330", "CS340", "CS350", "CS430", "CS440", "CS490", "CS491"],
};

const CATALOG_PLANS = {
  "AI/ML": {
    track: "Machine Learning Engineer",
    skills: ["Python", "Algorithms", "Statistics", "Machine Learning", "Model Evaluation", "MLOps", "Cloud", "Communication"],
    courses: ["CS401", "CS410", "CS411", "CS412", "CS413", "CS415", "CS421"],
  },
  "Data Science & Analytics": {
    track: "Data Scientist",
    skills: ["Python", "Statistics", "SQL", "Visualization", "Machine Learning", "Experiment Design", "Communication"],
    courses: ["CS320", "CS380", "CS410", "STAT310", "CS420"],
  },
  Cybersecurity: {
    track: "Cybersecurity Engineer",
    skills: ["Cybersecurity", "Networking", "Threat Modeling", "Application Security", "Python", "Cloud", "Communication"],
    courses: ["CS260", "CS340", "CS350", "CS430", "CS440"],
  },
  "Software Engineering": {
    track: "Software Engineer",
    skills: ["Algorithms", "Software Design", "Testing", "Git", "APIs", "SQL", "Cloud", "Communication"],
    courses: ["CS230", "CS310", "CS320", "CS330", "CS370", "CS430"],
  },
  "Cloud Computing / DevOps": {
    track: "Software Engineer",
    skills: ["Cloud", "Linux", "Networking", "Automation", "Reliability", "Python", "Distributed Systems", "Communication"],
    courses: ["CS330", "CS340", "CS350", "CS370", "CS430", "CS421"],
  },
  "Web Development": {
    track: "Software Engineer",
    skills: ["JavaScript", "APIs", "Web Development", "Accessibility", "Testing", "Git", "Communication"],
    courses: ["CS230", "CS250", "CS320", "CS330", "CS370", "CS430"],
  },
  "Mobile App Development": {
    track: "Software Engineer",
    skills: ["Software Design", "APIs", "Testing", "Git", "User Experience", "Mobile Development", "Communication"],
    courses: ["CS230", "CS250", "CS310", "CS320", "CS330", "CS430"],
  },
  "Computer Networks": {
    track: "Cybersecurity Engineer",
    skills: ["Networking", "Distributed Systems", "Linux", "Security", "Automation", "Communication"],
    courses: ["CS260", "CS340", "CS350", "CS370", "CS430", "CS440"],
  },
  Robotics: {
    track: "Machine Learning Engineer",
    skills: ["Python", "C++", "Algorithms", "Robotics", "Computer Vision", "Control Systems", "Communication"],
    courses: ["CS310", "CS401", "CS410", "CS413", "CS414", "CS450"],
  },
  "Blockchain / Web3": {
    track: "Software Engineer",
    skills: ["Distributed Systems", "Security", "Smart Contracts", "Cryptography", "Software Design", "Testing", "Communication"],
    courses: ["CS260", "CS310", "CS330", "CS350", "CS370", "CS440"],
  },
  "AR/VR & Game Development": {
    track: "Software Engineer",
    skills: ["C++", "Computer Graphics", "Game Development", "3D Math", "Software Design", "User Experience", "Communication"],
    courses: ["CS220", "CS250", "CS310", "CS330", "CS413", "CS490", "CS491"],
  },
  "Human-Computer Interaction (UX/UI)": {
    track: "Software Engineer",
    skills: ["UX Research", "Accessibility", "Prototyping", "User Experience", "Communication", "Data Analysis"],
    courses: ["CS230", "CS250", "CS330", "CS380", "CS415", "CS490", "CS491"],
  },
  "Quantum Computing": {
    track: "Data Scientist",
    skills: ["Mathematics", "Algorithms", "Probability", "Python", "Quantum Computing", "Research", "Communication"],
    courses: ["CS310", "CS360", "CS401", "STAT310", "CS450", "CS490", "CS491"],
  },
  "Embedded Systems / IoT": {
    track: "Software Engineer",
    skills: ["C", "Computer Architecture", "Embedded Systems", "Networking", "Hardware Interfaces", "Security", "Communication"],
    courses: ["CS220", "CS260", "CS310", "CS340", "CS350", "CS440", "CS490", "CS491"],
  },
  "Electrical/Electronics Engineering": {
    track: "Software Engineer",
    skills: ["Circuits", "Signal Processing", "Mathematics", "Hardware Design", "Programming", "Communication"],
    courses: ["CS220", "CS310", "CS340", "CS350", "CS450", "CS490", "CS491"],
  },
  "Mechanical Engineering": {
    track: "Software Engineer",
    skills: ["Engineering Design", "CAD", "Mathematics", "Manufacturing", "Simulation", "Communication"],
    courses: ["CS220", "CS250", "CS310", "CS330", "CS401", "CS450", "CS490", "CS491"],
  },
  "Biomedical Engineering": {
    track: "Data Scientist",
    skills: ["Data Analysis", "Statistics", "Programming", "Biomedical Systems", "Research", "Communication"],
    courses: ["CS240", "CS310", "CS320", "CS380", "CS410", "STAT310", "CS450", "CS490", "CS491"],
  },
  "Chip Design / VLSI": {
    track: "Software Engineer",
    skills: ["Digital Logic", "Computer Architecture", "Verilog", "Verification", "Scripting", "Communication"],
    courses: ["CS220", "CS260", "CS310", "CS330", "CS350", "CS450", "CS490", "CS491"],
  },
  "Business Analytics / FinTech": {
    track: "Data Scientist",
    skills: ["SQL", "Statistics", "Visualization", "Finance", "Python", "Experiment Design", "Communication"],
    courses: ["CS240", "CS310", "CS320", "CS380", "STAT310", "CS410", "CS490", "CS491"],
  },
  "Bioinformatics / Computational Biology": {
    track: "Data Scientist",
    skills: ["Python", "Statistics", "Data Analysis", "Algorithms", "Biology", "Research", "Communication"],
    courses: ["CS240", "CS310", "CS320", "CS410", "STAT310", "CS450", "CS490", "CS491"],
  },
};

const PIVOT_TOPICS = new Set([
  "Electrical/Electronics Engineering",
  "Mechanical Engineering",
  "Biomedical Engineering",
  "Chip Design / VLSI",
]);

export const getCourse = (code) => courses.find((item) => item.code === code) || null;
export const getOpportunity = (id) =>
  [...researchOpportunities, ...scholarships, ...internships].find((item) => item.id === id) || null;

export function detectCareerGoal(input = "", fallback = "") {
  const text = normalize(input);
  if (!text) return fallback;
  const catalogMatch = findCareerMatch(input);
  if (catalogMatch?.role) return catalogMatch.role;
  for (const profile of Object.values(careerProfiles)) {
    if (profile.keywords.some((keyword) => text.includes(keyword))) return profile.label;
  }
  return fallback;
}

export function getCareerProfile(goal = "") {
  const requested = String(goal || "").trim();
  if (careerProfiles[requested]) {
    const match = findCareerMatch(requested);
    return {
      ...careerProfiles[requested],
      planningTrack: requested,
      catalogTopic: match?.topic || "",
      catalogRole: match?.role || requested,
      typicalDegrees: getCareerField(match?.topic || "")?.typical_degree || [],
    };
  }

  const match = findCareerMatch(requested);
  if (match) {
    const catalogPlan = CATALOG_PLANS[match.topic] || CATALOG_PLANS["Software Engineering"];
    const base = careerProfiles[catalogPlan.track] || careerProfiles["Software Engineer"];
    const field = getCareerField(match.topic);
    const role = match.role || field?.career_paths[0]?.role || requested || match.topic;
    return {
      ...base,
      label: role,
      planningTrack: catalogPlan.track,
      catalogTopic: match.topic,
      catalogRole: role,
      prioritySkills: unique([...catalogPlan.skills, ...base.prioritySkills]).slice(0, 10),
      recommendedCourses: unique([...catalogPlan.courses, ...base.recommendedCourses]),
      typicalDegrees: field?.typical_degree || [],
    };
  }

  if (requested) {
    return {
      ...careerProfiles["Software Engineer"],
      label: requested,
      planningTrack: "Software Engineer",
      catalogTopic: "",
      catalogRole: requested,
      typicalDegrees: [],
    };
  }

  return {
    ...careerProfiles["Software Engineer"],
    label: "Career goal not selected",
    planningTrack: "Software Engineer",
    catalogTopic: "",
    catalogRole: "",
    prioritySkills: ["Algorithms", "Problem Solving", "Communication", "Git", "Data Literacy", "Software Design"],
    typicalDegrees: [],
  };
}

export function getCareerDegreeAlignment(careerGoal, profile = student) {
  const careerProfile = getCareerProfile(careerGoal);
  const field = getCareerField(careerProfile.catalogTopic || careerGoal);
  const degrees = field?.typical_degree || careerProfile.typicalDegrees || [];
  const current = normalize(profile.degree);
  const direct = degrees.some((degree) => {
    const normalized = normalize(degree);
    return normalized.includes("computer science") || current.includes(normalized) || normalized.includes(current.replace(/b\.?s\.?\s*/g, ""));
  });

  if (direct || !field) {
    return {
      level: "direct",
      label: "Direct degree fit",
      message: `${profile.degree} is a direct academic route for this career field.`,
      typicalDegrees: degrees,
    };
  }

  if (PIVOT_TOPICS.has(field.topic)) {
    return {
      level: "pivot",
      label: "Program change may be needed",
      message: `${field.topic} usually requires a different engineering major. PathwayOS will show transferable courses, but an academic-advisor review is essential.`,
      typicalDegrees: degrees,
    };
  }

  return {
    level: "adjacent",
    label: "Adjacent degree fit",
    message: `${profile.degree} can support this path, but electives, projects, a minor, or graduate study may be needed.`,
    typicalDegrees: degrees,
  };
}

export function getDegreeProgress(profile = student) {
  return {
    percent: Math.round((profile.creditsEarned / profile.creditsRequired) * 100),
    earned: profile.creditsEarned,
    required: profile.creditsRequired,
    remaining: Math.max(0, profile.creditsRequired - profile.creditsEarned),
    onTrack: true,
    graduationTarget: profile.graduationTarget,
  };
}

export function getCompletedCourseDetails(profile = student) {
  return profile.completedCourses.map(getCourse).filter(Boolean);
}

export function checkPrerequisites(courseCode, completedCourses = student.completedCourses) {
  const target = getCourse(courseCode);
  if (!target) return { courseCode, exists: false, eligible: false, missing: [] };
  const completed = new Set(completedCourses);
  const missing = target.prerequisites.filter((code) => !completed.has(code));
  return {
    courseCode,
    exists: true,
    eligible: missing.length === 0,
    missing,
    prerequisites: target.prerequisites,
  };
}

export function getAvailableCourses(termLabel = "Fall 2026", completedCourses = student.completedCourses) {
  const season = termLabel.split(" ")[0];
  return courses
    .filter((item) => !completedCourses.includes(item.code))
    .filter((item) => item.terms.includes(season))
    .map((item) => ({ ...item, prerequisiteStatus: checkPrerequisites(item.code, completedCourses) }))
    .filter((item) => item.prerequisiteStatus.eligible);
}

function prerequisiteClosure(codes, completedCourses = student.completedCourses) {
  const result = new Set(codes);
  let changed = true;
  while (changed) {
    changed = false;
    for (const code of [...result]) {
      const item = getCourse(code);
      for (const prerequisite of item?.prerequisites || []) {
        if (!result.has(prerequisite) && !completedCourses.includes(prerequisite)) {
          result.add(prerequisite);
          changed = true;
        }
      }
    }
  }
  return [...result];
}

function courseSetFor(careerProfile) {
  const catalogCourses = CATALOG_PLANS[careerProfile.catalogTopic]?.courses || [];
  const trackCourses = unique([...(TRACKS[careerProfile.planningTrack] || TRACKS["Software Engineer"]), "CS490", "CS491"]);
  const trackSet = new Set(trackCourses);
  const roleTerms = new Set(tokenize(`${careerProfile.label} ${careerProfile.catalogTopic} ${careerProfile.prioritySkills.join(" ")}`));
  const specialtyCandidates = unique([...catalogCourses, ...(careerProfile.recommendedCourses || [])])
    .filter((code) => !trackSet.has(code))
    .map((code, index) => {
      const course = getCourse(code);
      const tokens = tokenize(`${course?.title || ""} ${(course?.skills || []).join(" ")}`);
      const overlap = tokens.filter((token) => roleTerms.has(token)).length;
      return { code, score: overlap * 20 - index };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 1)
    .map((item) => item.code);
  return unique([...trackCourses, ...specialtyCandidates]);
}

function sortCandidates(codes, careerProfile) {
  const preferredOrder = courseSetFor(careerProfile);
  const priority = new Map(preferredOrder.map((code, index) => [code, index]));
  return [...codes].sort((a, b) => (priority.get(a) ?? 999) - (priority.get(b) ?? 999));
}

export function simulateDegreePlan({
  profile = student,
  careerGoal = profile.careerGoal,
  workload = "balanced",
  includeResearch = true,
} = {}) {
  const careerProfile = getCareerProfile(careerGoal);
  let targetCodes = courseSetFor(careerProfile);
  if (!includeResearch) targetCodes = targetCodes.filter((code) => code !== "CS450");
  const candidateCodes = sortCandidates(
    prerequisiteClosure(targetCodes, profile.completedCourses).filter((code) => !profile.completedCourses.includes(code)),
    careerProfile,
  );
  const completed = new Set(profile.completedCourses);
  const unscheduled = new Set(candidateCodes);
  const plan = [];
  const standardLimit = workload === "accelerated" ? 18 : workload === "lighter" ? 12 : profile.preferences.maxCreditsPerTerm;

  for (const term of terms) {
    const creditLimit = term.season === "Summer" ? Math.min(6, standardLimit) : standardLimit;
    const termCourses = [];
    let credits = 0;
    let added = true;

    while (added) {
      added = false;
      for (const code of candidateCodes) {
        if (!unscheduled.has(code)) continue;
        const item = getCourse(code);
        if (!item || !item.terms.includes(term.season)) continue;
        if (!item.prerequisites.every((prerequisite) => completed.has(prerequisite))) continue;
        if (credits + item.credits > creditLimit) continue;
        termCourses.push({ ...item, optional: profile.creditsEarned + sumPlanCredits(plan) + credits >= profile.creditsRequired });
        unscheduled.delete(code);
        credits += item.credits;
        added = true;
      }
    }

    for (const item of termCourses) completed.add(item.code);
    plan.push({ ...term, credits, courses: termCourses });
  }

  const remaining = [...unscheduled].map(getCourse).filter(Boolean);
  const alignment = getCareerDegreeAlignment(careerProfile.label, profile);
  return {
    goal: careerProfile.label,
    catalogTopic: careerProfile.catalogTopic,
    planningTrack: careerProfile.planningTrack,
    alignment,
    workload,
    terms: plan,
    remaining,
    totalPlannedCredits: sumPlanCredits(plan),
    projectedCredits: profile.creditsEarned + sumPlanCredits(plan),
    graduationTarget: profile.graduationTarget,
    onTrack: remaining.length === 0 || remaining.every((item) => item.optional),
  };
}

function sumPlanCredits(plan) {
  return plan.reduce((total, term) => total + (term.credits || 0), 0);
}

export function plannedCourseCodes(plan) {
  return plan.terms.flatMap((term) => term.courses.map((item) => item.code));
}

export function skillInventory(profile = student, plan = simulateDegreePlan({ profile })) {
  const current = new Map(profile.skills.map((item) => [normalize(item.name), { ...item, source: "current" }]));
  for (const code of profile.completedCourses) {
    const item = getCourse(code);
    for (const skill of item?.skills || []) {
      const key = normalize(skill);
      if (!current.has(key)) current.set(key, { name: skill, level: 66, source: "completed" });
    }
  }
  for (const code of plannedCourseCodes(plan)) {
    const item = getCourse(code);
    for (const skill of item?.skills || []) {
      const key = normalize(skill);
      if (!current.has(key)) current.set(key, { name: skill, level: 52, source: "planned" });
    }
  }
  return [...current.values()];
}

export function identifySkillGaps({ profile = student, careerGoal = profile.careerGoal, plan } = {}) {
  const degreePlan = plan || simulateDegreePlan({ profile, careerGoal });
  const inventory = skillInventory(profile, degreePlan);
  const byName = new Map(inventory.map((item) => [normalize(item.name), item]));
  const prioritySkills = getCareerProfile(careerGoal).prioritySkills;
  return prioritySkills.map((skill, index) => {
    const current = byName.get(normalize(skill));
    const target = Math.max(72, 88 - index * 2);
    const level = current?.level || 18;
    return {
      name: skill,
      currentLevel: level,
      targetLevel: target,
      gap: Math.max(0, target - level),
      status: level >= target ? "ready" : current?.source === "planned" ? "covered-by-plan" : "gap",
      source: current?.source || "missing",
    };
  });
}

function skillsFrom(profile, plan) {
  return new Set(skillInventory(profile, plan).map((item) => normalize(item.name)));
}

function overlapScore(required, available) {
  if (!required?.length) return 1;
  return required.filter((item) => available.has(normalize(item))).length / required.length;
}

function courseFit(requiredCourses = [], profile, plan) {
  if (!requiredCourses.length) return { ratio: 1, missing: [] };
  const available = new Set([...profile.completedCourses, ...plannedCourseCodes(plan)]);
  const missing = requiredCourses.filter((code) => !available.has(code));
  return { ratio: (requiredCourses.length - missing.length) / requiredCourses.length, missing };
}

function scoreResearch(item, profile, plan, careerGoal) {
  const availableSkills = skillsFrom(profile, plan);
  const interestSet = new Set(profile.interests.map(normalize));
  const skillRatio = overlapScore(item.skills, availableSkills);
  const interestRatio = overlapScore(item.interests, interestSet);
  const course = courseFit(item.requiredCourses, profile, plan);
  const gpaFit = profile.gpa >= item.minGpa ? 1 : Math.max(0, 1 - (item.minGpa - profile.gpa));
  const careerProfile = getCareerProfile(careerGoal);
  const goalText = normalize(`${careerProfile.label} ${careerProfile.catalogTopic} ${careerProfile.prioritySkills.join(" ")}`);
  const goalFit = item.skills.some((skill) => goalText.includes(normalize(skill))) || item.interests.some((interest) => goalText.includes(normalize(interest))) ? 1 : 0.58;
  const gpaMargin = clamp((profile.gpa - item.minGpa) / 0.8, 0, 1);
  const rawScore = clamp(Math.round(22 * skillRatio + 23 * interestRatio + 24 * course.ratio + 14 * gpaFit + 12 * goalFit + 5 * gpaMargin));
  const score = calibrateMatch(rawScore, 95);
  const missingSkills = item.skills.filter((skill) => !availableSkills.has(normalize(skill)));
  return {
    ...item,
    matchScore: score,
    eligible: gpaFit === 1 && course.missing.length === 0,
    missingSkills,
    missingCourses: course.missing,
    reasons: unique([
      interestRatio > 0.45 ? `Strong fit with ${item.interests.find((interest) => interestSet.has(normalize(interest))) || "your research interests"}` : null,
      goalFit === 1 ? `Relevant to your ${careerProfile.label} direction` : "Builds transferable research experience",
      skillRatio > 0.5 ? "Uses skills already in your academic pathway" : "Builds a high-priority career skill",
      course.missing.length === 0 ? "Required coursework is completed or already planned" : `${course.missing.length} prerequisite course${course.missing.length > 1 ? "s" : ""} can be added to your plan`,
      gpaFit === 1 ? `Your ${profile.gpa.toFixed(2)} GPA meets the requirement` : "GPA requirement is not yet met",
    ].filter(Boolean)),
  };
}

function scoreScholarship(item, profile, careerGoal) {
  const majorFit = item.majors.some((major) => normalize(profile.degree).includes(normalize(major)) || normalize(major).includes("any")) ? 1 : 0.4;
  const careerProfile = getCareerProfile(careerGoal);
  const interestSet = new Set([...profile.interests, ...careerProfile.prioritySkills].map(normalize));
  const interestRatio = item.interests.some((interest) => interestSet.has(normalize(interest)) || normalize(interest) === "stem") ? 1 : 0.55;
  const standingFit = item.standings.includes(profile.standing) ? 1 : 0;
  const gpaFit = profile.gpa >= item.minGpa ? 1 : Math.max(0, 1 - (item.minGpa - profile.gpa));
  const goalText = normalize(`${careerProfile.label} ${careerProfile.catalogTopic} ${careerProfile.prioritySkills.join(" ")}`);
  const goalSpecificity = item.interests.some((interest) => goalText.includes(normalize(interest))) ? 1 : normalize(item.interests.join(" ")).includes("stem") ? 0.68 : 0.48;
  const institutionFit = normalize(item.provider).includes("northstar") ? 1 : 0.65;
  const gpaMargin = clamp((profile.gpa - item.minGpa) / 0.8, 0, 1);
  const rawScore = clamp(Math.round(22 * majorFit + 24 * interestRatio + 15 * standingFit + 15 * gpaFit + 4 * gpaMargin + 8 * goalSpecificity + 12 * institutionFit));
  const score = calibrateMatch(rawScore, 96);
  return {
    ...item,
    matchScore: score,
    eligible: majorFit === 1 && standingFit === 1 && gpaFit === 1,
    missingSkills: [],
    missingCourses: [],
    reasons: unique([
      majorFit === 1 ? "Your degree is explicitly eligible" : "Broad STEM eligibility may require review",
      interestRatio === 1 ? `Aligned with your ${careerProfile.label} pathway` : "Supports your broader academic progress",
      gpaFit === 1 ? `Your ${profile.gpa.toFixed(2)} GPA exceeds the minimum` : "GPA requirement is not yet met",
      standingFit === 1 ? `${profile.standing} students are eligible` : "Class-standing eligibility needs review",
    ]),
  };
}

function scoreInternship(item, profile, plan, careerGoal) {
  const availableSkills = skillsFrom(profile, plan);
  const skillRatio = overlapScore(item.skills, availableSkills);
  const course = courseFit(item.preferredCourses, profile, plan);
  const gpaFit = profile.gpa >= item.minGpa ? 1 : Math.max(0, 1 - (item.minGpa - profile.gpa));
  const preferenceFit = item.workMode === profile.preferences.preferredWorkMode || item.workMode === "Remote" || profile.preferences.preferredLocations.some((place) => item.location.includes(place)) ? 1 : 0.65;
  const careerProfile = getCareerProfile(careerGoal);
  const goalWords = normalize(`${careerProfile.label} ${careerProfile.catalogTopic} ${careerProfile.prioritySkills.join(" ")}`);
  const goalFit = item.skills.filter((skill) => goalWords.includes(normalize(skill))).length / Math.max(1, item.skills.length);
  const roleTerms = new Set(tokenize(`${careerProfile.label} ${careerProfile.catalogTopic} ${careerProfile.planningTrack}`));
  const titleTerms = tokenize(item.title);
  const titleOverlap = titleTerms.filter((term) => roleTerms.has(term)).length / Math.max(1, Math.min(4, titleTerms.length));
  const titleFit = Math.max(0.48, Math.min(1, 0.5 + titleOverlap * 0.8));
  const rawScore = clamp(Math.round(30 * skillRatio + 22 * course.ratio + 13 * gpaFit + 10 * preferenceFit + 8 * Math.max(goalFit, 0.42) + 12 * titleFit + 5));
  const score = calibrateMatch(rawScore, 95);
  const missingSkills = item.skills.filter((skill) => !availableSkills.has(normalize(skill)));
  return {
    ...item,
    matchScore: score,
    eligible: gpaFit === 1 && course.missing.length === 0,
    missingSkills,
    missingCourses: course.missing,
    reasons: unique([
      titleFit >= 0.7 ? `Role title is relevant to your ${careerProfile.label} direction` : "Offers transferable professional experience",
      skillRatio >= 0.7 ? "Most requested skills are already present or covered by your plan" : "Your next courses close the main skill gaps",
      course.missing.length === 0 ? "Preferred coursework is completed or scheduled before the internship" : `${course.missing.length} preferred course${course.missing.length > 1 ? "s are" : " is"} still missing`,
      preferenceFit === 1 ? `${item.workMode} format fits your preferences` : "Location or work format is a secondary fit",
      gpaFit === 1 ? "Academic eligibility is met" : "GPA requirement needs attention",
    ]),
  };
}

export function rankResearch({ profile = student, careerGoal = profile.careerGoal, plan, limit = 15 } = {}) {
  const degreePlan = plan || simulateDegreePlan({ profile, careerGoal });
  return researchOpportunities
    .map((item) => scoreResearch(item, profile, degreePlan, careerGoal))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

export function rankScholarships({ profile = student, careerGoal = profile.careerGoal, limit = 20 } = {}) {
  return scholarships
    .map((item) => scoreScholarship(item, profile, careerGoal))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

export function rankInternships({ profile = student, careerGoal = profile.careerGoal, plan, limit = 20 } = {}) {
  const degreePlan = plan || simulateDegreePlan({ profile, careerGoal });
  return internships
    .map((item) => scoreInternship(item, profile, degreePlan, careerGoal))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

export function searchRanked(items, query = "", filters = {}) {
  const search = normalize(query);
  return items.filter((item) => {
    const haystack = normalize(`${item.title} ${item.company || ""} ${item.lab || ""} ${item.provider || ""} ${item.description || ""} ${(item.skills || []).join(" ")} ${(item.interests || []).join(" ")}`);
    if (search && !haystack.includes(search)) return false;
    if (filters.eligibleOnly && !item.eligible) return false;
    if (filters.minScore && item.matchScore < filters.minScore) return false;
    return true;
  });
}

export function buildPersonalizedPathway({ profile = student, careerGoal = profile.careerGoal, workload = "balanced" } = {}) {
  const careerProfile = getCareerProfile(careerGoal);
  const plan = simulateDegreePlan({ profile, careerGoal: careerProfile.label, workload });
  const gaps = identifySkillGaps({ profile, careerGoal: careerProfile.label, plan });
  const research = rankResearch({ profile, careerGoal: careerProfile.label, plan, limit: 3 });
  const scholarships = rankScholarships({ profile, careerGoal: careerProfile.label, limit: 3 });
  const internships = rankInternships({ profile, careerGoal: careerProfile.label, plan, limit: 3 });
  const nextTerm = plan.terms.find((term) => term.courses.length) || plan.terms[0];
  return {
    careerGoal: careerProfile.label,
    catalogTopic: careerProfile.catalogTopic,
    planningTrack: careerProfile.planningTrack,
    alignment: plan.alignment,
    degreeProgress: getDegreeProgress(profile),
    plan,
    gaps,
    research,
    scholarships,
    internships,
    nextTerm,
    milestones: [
      { term: "Fall 2026", label: `Build the strongest academic foundations for ${careerProfile.label}`, status: "next" },
      { term: "Spring 2027", label: `Add role-specific depth in ${careerProfile.catalogTopic || careerProfile.planningTrack}`, status: "planned" },
      { term: "Summer 2027", label: `Pursue a ${careerProfile.label} internship, research role, or portfolio project`, status: "planned" },
      { term: "Fall 2027", label: "Launch a career-aligned capstone and close remaining skill gaps", status: "planned" },
      { term: "Spring 2028", label: `Finish the capstone and graduate ready for ${careerProfile.label} opportunities`, status: "planned" },
    ],
  };
}

export function requirementProgress(profile = student) {
  const completed = getCompletedCourseDetails(profile);
  const counts = completed.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  return degreeProgram.requirementGroups.map((group) => ({
    ...group,
    completed: Math.min(group.required, counts[group.id] || 0),
    percent: Math.round((Math.min(group.required, counts[group.id] || 0) / group.required) * 100),
  }));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

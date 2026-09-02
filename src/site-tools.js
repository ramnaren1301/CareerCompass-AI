/**
 * Imperative WebMCP registration for CareerCompass AI.
 *
 * Keep these direct calls in checked-in source. They are the live browser
 * integration and make the repository implementation easy to inspect.
 * The app imports this module from the top-level page, never from an iframe.
 */

function requireTool(toolMap, name) {
  const tool = toolMap.get(name);
  if (!tool) throw new Error(`Missing CareerCompass AI WebMCP definition: ${name}`);
  return tool;
}

export async function registerPathwaySiteTools(publicTools, { signal } = {}) {
  const toolMap = new Map(publicTools.map((tool) => [tool.name, tool]));
  const registered = [];
  const failures = [];

  async function safelyRegister(name, register) {
    try {
      await register();
      registered.push(name);
    } catch (error) {
      failures.push({
        name,
        error: `${error?.name || "Error"}: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const getCareerCatalogStatus = requireTool(toolMap, "get_career_catalog_status");
  await safelyRegister("get_career_catalog_status", () =>
    document.modelContext.registerTool({
      name: "get_career_catalog_status",
      description: getCareerCatalogStatus.description,
      inputSchema: getCareerCatalogStatus.inputSchema,
      execute: async (input, options = {}) => getCareerCatalogStatus.execute(input, { signal: options.signal }),
      title: getCareerCatalogStatus.title,
      annotations: getCareerCatalogStatus.annotations,
    }, { signal }),
  );

  const listCareerFields = requireTool(toolMap, "list_career_fields");
  await safelyRegister("list_career_fields", () =>
    document.modelContext.registerTool({
      name: "list_career_fields",
      description: listCareerFields.description,
      inputSchema: listCareerFields.inputSchema,
      execute: async (input, options = {}) => listCareerFields.execute(input, { signal: options.signal }),
      title: listCareerFields.title,
      annotations: listCareerFields.annotations,
    }, { signal }),
  );

  const exploreCareerPath = requireTool(toolMap, "explore_career_path");
  await safelyRegister("explore_career_path", () =>
    document.modelContext.registerTool({
      name: "explore_career_path",
      description: exploreCareerPath.description,
      inputSchema: exploreCareerPath.inputSchema,
      execute: async (input, options = {}) => exploreCareerPath.execute(input, { signal: options.signal }),
      title: exploreCareerPath.title,
      annotations: exploreCareerPath.annotations,
    }, { signal }),
  );

  const recommendCareerPaths = requireTool(toolMap, "recommend_career_paths");
  await safelyRegister("recommend_career_paths", () =>
    document.modelContext.registerTool({
      name: "recommend_career_paths",
      description: recommendCareerPaths.description,
      inputSchema: recommendCareerPaths.inputSchema,
      execute: async (input, options = {}) => recommendCareerPaths.execute(input, { signal: options.signal }),
      title: recommendCareerPaths.title,
      annotations: recommendCareerPaths.annotations,
    }, { signal }),
  );

  const compareCareerPaths = requireTool(toolMap, "compare_career_paths");
  await safelyRegister("compare_career_paths", () =>
    document.modelContext.registerTool({
      name: "compare_career_paths",
      description: compareCareerPaths.description,
      inputSchema: compareCareerPaths.inputSchema,
      execute: async (input, options = {}) => compareCareerPaths.execute(input, { signal: options.signal }),
      title: compareCareerPaths.title,
      annotations: compareCareerPaths.annotations,
    }, { signal }),
  );

  const getStudentProfile = requireTool(toolMap, "get_student_profile");
  await safelyRegister("get_student_profile", () =>
    document.modelContext.registerTool({
      name: "get_student_profile",
      description: getStudentProfile.description,
      inputSchema: getStudentProfile.inputSchema,
      execute: async (input, options = {}) => getStudentProfile.execute(input, { signal: options.signal }),
      title: getStudentProfile.title,
      annotations: getStudentProfile.annotations,
    }, { signal }),
  );

  const getDegreeRequirements = requireTool(toolMap, "get_degree_requirements");
  await safelyRegister("get_degree_requirements", () =>
    document.modelContext.registerTool({
      name: "get_degree_requirements",
      description: getDegreeRequirements.description,
      inputSchema: getDegreeRequirements.inputSchema,
      execute: async (input, options = {}) => getDegreeRequirements.execute(input, { signal: options.signal }),
      title: getDegreeRequirements.title,
      annotations: getDegreeRequirements.annotations,
    }, { signal }),
  );

  const getCompletedCourses = requireTool(toolMap, "get_completed_courses");
  await safelyRegister("get_completed_courses", () =>
    document.modelContext.registerTool({
      name: "get_completed_courses",
      description: getCompletedCourses.description,
      inputSchema: getCompletedCourses.inputSchema,
      execute: async (input, options = {}) => getCompletedCourses.execute(input, { signal: options.signal }),
      title: getCompletedCourses.title,
      annotations: getCompletedCourses.annotations,
    }, { signal }),
  );

  const checkPrerequisites = requireTool(toolMap, "check_prerequisites");
  await safelyRegister("check_prerequisites", () =>
    document.modelContext.registerTool({
      name: "check_prerequisites",
      description: checkPrerequisites.description,
      inputSchema: checkPrerequisites.inputSchema,
      execute: async (input, options = {}) => checkPrerequisites.execute(input, { signal: options.signal }),
      title: checkPrerequisites.title,
      annotations: checkPrerequisites.annotations,
    }, { signal }),
  );

  const getAvailableCourses = requireTool(toolMap, "get_available_courses");
  await safelyRegister("get_available_courses", () =>
    document.modelContext.registerTool({
      name: "get_available_courses",
      description: getAvailableCourses.description,
      inputSchema: getAvailableCourses.inputSchema,
      execute: async (input, options = {}) => getAvailableCourses.execute(input, { signal: options.signal }),
      title: getAvailableCourses.title,
      annotations: getAvailableCourses.annotations,
    }, { signal }),
  );

  const simulateDegreePlan = requireTool(toolMap, "simulate_degree_plan");
  await safelyRegister("simulate_degree_plan", () =>
    document.modelContext.registerTool({
      name: "simulate_degree_plan",
      description: simulateDegreePlan.description,
      inputSchema: simulateDegreePlan.inputSchema,
      execute: async (input, options = {}) => simulateDegreePlan.execute(input, { signal: options.signal }),
      title: simulateDegreePlan.title,
      annotations: simulateDegreePlan.annotations,
    }, { signal }),
  );

  const createDegreePlan = requireTool(toolMap, "create_degree_plan");
  await safelyRegister("create_degree_plan", () =>
    document.modelContext.registerTool({
      name: "create_degree_plan",
      description: createDegreePlan.description,
      inputSchema: createDegreePlan.inputSchema,
      execute: async (input, options = {}) => createDegreePlan.execute(input, { signal: options.signal }),
      title: createDegreePlan.title,
      annotations: createDegreePlan.annotations,
    }, { signal }),
  );

  const addCourseToPlan = requireTool(toolMap, "add_course_to_plan");
  await safelyRegister("add_course_to_plan", () =>
    document.modelContext.registerTool({
      name: "add_course_to_plan",
      description: addCourseToPlan.description,
      inputSchema: addCourseToPlan.inputSchema,
      execute: async (input, options = {}) => addCourseToPlan.execute(input, { signal: options.signal }),
      title: addCourseToPlan.title,
      annotations: addCourseToPlan.annotations,
    }, { signal }),
  );

  const identifySkillGaps = requireTool(toolMap, "identify_skill_gaps");
  await safelyRegister("identify_skill_gaps", () =>
    document.modelContext.registerTool({
      name: "identify_skill_gaps",
      description: identifySkillGaps.description,
      inputSchema: identifySkillGaps.inputSchema,
      execute: async (input, options = {}) => identifySkillGaps.execute(input, { signal: options.signal }),
      title: identifySkillGaps.title,
      annotations: identifySkillGaps.annotations,
    }, { signal }),
  );

  const findResearchOpportunities = requireTool(toolMap, "find_research_opportunities");
  await safelyRegister("find_research_opportunities", () =>
    document.modelContext.registerTool({
      name: "find_research_opportunities",
      description: findResearchOpportunities.description,
      inputSchema: findResearchOpportunities.inputSchema,
      execute: async (input, options = {}) => findResearchOpportunities.execute(input, { signal: options.signal }),
      title: findResearchOpportunities.title,
      annotations: findResearchOpportunities.annotations,
    }, { signal }),
  );

  const getResearchProject = requireTool(toolMap, "get_research_project");
  await safelyRegister("get_research_project", () =>
    document.modelContext.registerTool({
      name: "get_research_project",
      description: getResearchProject.description,
      inputSchema: getResearchProject.inputSchema,
      execute: async (input, options = {}) => getResearchProject.execute(input, { signal: options.signal }),
      title: getResearchProject.title,
      annotations: getResearchProject.annotations,
    }, { signal }),
  );

  const checkResearchEligibility = requireTool(toolMap, "check_research_eligibility");
  await safelyRegister("check_research_eligibility", () =>
    document.modelContext.registerTool({
      name: "check_research_eligibility",
      description: checkResearchEligibility.description,
      inputSchema: checkResearchEligibility.inputSchema,
      execute: async (input, options = {}) => checkResearchEligibility.execute(input, { signal: options.signal }),
      title: checkResearchEligibility.title,
      annotations: checkResearchEligibility.annotations,
    }, { signal }),
  );

  const saveResearchOpportunity = requireTool(toolMap, "save_research_opportunity");
  await safelyRegister("save_research_opportunity", () =>
    document.modelContext.registerTool({
      name: "save_research_opportunity",
      description: saveResearchOpportunity.description,
      inputSchema: saveResearchOpportunity.inputSchema,
      execute: async (input, options = {}) => saveResearchOpportunity.execute(input, { signal: options.signal }),
      title: saveResearchOpportunity.title,
      annotations: saveResearchOpportunity.annotations,
    }, { signal }),
  );

  const expressResearchInterest = requireTool(toolMap, "express_research_interest");
  await safelyRegister("express_research_interest", () =>
    document.modelContext.registerTool({
      name: "express_research_interest",
      description: expressResearchInterest.description,
      inputSchema: expressResearchInterest.inputSchema,
      execute: async (input, options = {}) => expressResearchInterest.execute(input, { signal: options.signal }),
      title: expressResearchInterest.title,
      annotations: expressResearchInterest.annotations,
    }, { signal }),
  );

  const findScholarships = requireTool(toolMap, "find_scholarships");
  await safelyRegister("find_scholarships", () =>
    document.modelContext.registerTool({
      name: "find_scholarships",
      description: findScholarships.description,
      inputSchema: findScholarships.inputSchema,
      execute: async (input, options = {}) => findScholarships.execute(input, { signal: options.signal }),
      title: findScholarships.title,
      annotations: findScholarships.annotations,
    }, { signal }),
  );

  const getScholarshipDetails = requireTool(toolMap, "get_scholarship_details");
  await safelyRegister("get_scholarship_details", () =>
    document.modelContext.registerTool({
      name: "get_scholarship_details",
      description: getScholarshipDetails.description,
      inputSchema: getScholarshipDetails.inputSchema,
      execute: async (input, options = {}) => getScholarshipDetails.execute(input, { signal: options.signal }),
      title: getScholarshipDetails.title,
      annotations: getScholarshipDetails.annotations,
    }, { signal }),
  );

  const checkScholarshipEligibility = requireTool(toolMap, "check_scholarship_eligibility");
  await safelyRegister("check_scholarship_eligibility", () =>
    document.modelContext.registerTool({
      name: "check_scholarship_eligibility",
      description: checkScholarshipEligibility.description,
      inputSchema: checkScholarshipEligibility.inputSchema,
      execute: async (input, options = {}) => checkScholarshipEligibility.execute(input, { signal: options.signal }),
      title: checkScholarshipEligibility.title,
      annotations: checkScholarshipEligibility.annotations,
    }, { signal }),
  );

  const saveScholarship = requireTool(toolMap, "save_scholarship");
  await safelyRegister("save_scholarship", () =>
    document.modelContext.registerTool({
      name: "save_scholarship",
      description: saveScholarship.description,
      inputSchema: saveScholarship.inputSchema,
      execute: async (input, options = {}) => saveScholarship.execute(input, { signal: options.signal }),
      title: saveScholarship.title,
      annotations: saveScholarship.annotations,
    }, { signal }),
  );

  const updateScholarshipStatus = requireTool(toolMap, "update_scholarship_status");
  await safelyRegister("update_scholarship_status", () =>
    document.modelContext.registerTool({
      name: "update_scholarship_status",
      description: updateScholarshipStatus.description,
      inputSchema: updateScholarshipStatus.inputSchema,
      execute: async (input, options = {}) => updateScholarshipStatus.execute(input, { signal: options.signal }),
      title: updateScholarshipStatus.title,
      annotations: updateScholarshipStatus.annotations,
    }, { signal }),
  );

  const findInternships = requireTool(toolMap, "find_internships");
  await safelyRegister("find_internships", () =>
    document.modelContext.registerTool({
      name: "find_internships",
      description: findInternships.description,
      inputSchema: findInternships.inputSchema,
      execute: async (input, options = {}) => findInternships.execute(input, { signal: options.signal }),
      title: findInternships.title,
      annotations: findInternships.annotations,
    }, { signal }),
  );

  const getInternshipDetails = requireTool(toolMap, "get_internship_details");
  await safelyRegister("get_internship_details", () =>
    document.modelContext.registerTool({
      name: "get_internship_details",
      description: getInternshipDetails.description,
      inputSchema: getInternshipDetails.inputSchema,
      execute: async (input, options = {}) => getInternshipDetails.execute(input, { signal: options.signal }),
      title: getInternshipDetails.title,
      annotations: getInternshipDetails.annotations,
    }, { signal }),
  );

  const checkInternshipEligibility = requireTool(toolMap, "check_internship_eligibility");
  await safelyRegister("check_internship_eligibility", () =>
    document.modelContext.registerTool({
      name: "check_internship_eligibility",
      description: checkInternshipEligibility.description,
      inputSchema: checkInternshipEligibility.inputSchema,
      execute: async (input, options = {}) => checkInternshipEligibility.execute(input, { signal: options.signal }),
      title: checkInternshipEligibility.title,
      annotations: checkInternshipEligibility.annotations,
    }, { signal }),
  );

  const compareStudentSkills = requireTool(toolMap, "compare_student_skills");
  await safelyRegister("compare_student_skills", () =>
    document.modelContext.registerTool({
      name: "compare_student_skills",
      description: compareStudentSkills.description,
      inputSchema: compareStudentSkills.inputSchema,
      execute: async (input, options = {}) => compareStudentSkills.execute(input, { signal: options.signal }),
      title: compareStudentSkills.title,
      annotations: compareStudentSkills.annotations,
    }, { signal }),
  );

  const identifyMissingSkills = requireTool(toolMap, "identify_missing_skills");
  await safelyRegister("identify_missing_skills", () =>
    document.modelContext.registerTool({
      name: "identify_missing_skills",
      description: identifyMissingSkills.description,
      inputSchema: identifyMissingSkills.inputSchema,
      execute: async (input, options = {}) => identifyMissingSkills.execute(input, { signal: options.signal }),
      title: identifyMissingSkills.title,
      annotations: identifyMissingSkills.annotations,
    }, { signal }),
  );

  const saveInternship = requireTool(toolMap, "save_internship");
  await safelyRegister("save_internship", () =>
    document.modelContext.registerTool({
      name: "save_internship",
      description: saveInternship.description,
      inputSchema: saveInternship.inputSchema,
      execute: async (input, options = {}) => saveInternship.execute(input, { signal: options.signal }),
      title: saveInternship.title,
      annotations: saveInternship.annotations,
    }, { signal }),
  );

  const updateInternshipStatus = requireTool(toolMap, "update_internship_status");
  await safelyRegister("update_internship_status", () =>
    document.modelContext.registerTool({
      name: "update_internship_status",
      description: updateInternshipStatus.description,
      inputSchema: updateInternshipStatus.inputSchema,
      execute: async (input, options = {}) => updateInternshipStatus.execute(input, { signal: options.signal }),
      title: updateInternshipStatus.title,
      annotations: updateInternshipStatus.annotations,
    }, { signal }),
  );

  const buildPersonalizedPathway = requireTool(toolMap, "build_personalized_pathway");
  await safelyRegister("build_personalized_pathway", () =>
    document.modelContext.registerTool({
      name: "build_personalized_pathway",
      description: buildPersonalizedPathway.description,
      inputSchema: buildPersonalizedPathway.inputSchema,
      execute: async (input, options = {}) => buildPersonalizedPathway.execute(input, { signal: options.signal }),
      title: buildPersonalizedPathway.title,
      annotations: buildPersonalizedPathway.annotations,
    }, { signal }),
  );

  const getPendingApprovals = requireTool(toolMap, "get_pending_approvals");
  await safelyRegister("get_pending_approvals", () =>
    document.modelContext.registerTool({
      name: "get_pending_approvals",
      description: getPendingApprovals.description,
      inputSchema: getPendingApprovals.inputSchema,
      execute: async (input, options = {}) => getPendingApprovals.execute(input, { signal: options.signal }),
      title: getPendingApprovals.title,
      annotations: getPendingApprovals.annotations,
    }, { signal }),
  );

  if (failures.length) {
    console.error(`[CareerCompass AI WebMCP] ${failures.length} of ${toolMap.size} tools failed to register.`, failures);
  } else {
    console.info(`[CareerCompass AI WebMCP] Registered ${registered.length} tools with document.modelContext.`);
  }
  return { count: registered.length, registered, failures };
}

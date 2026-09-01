export const student = {
  id: "stu_maya_chen",
  name: "Maya Chen",
  initials: "MC",
  email: "maya.chen@northstar.edu",
  degree: "B.S. Computer Science",
  stream: "Artificial Intelligence & Machine Learning",
  standing: "Sophomore",
  graduationTarget: "May 2028",
  careerGoal: "",
  gpa: 3.72,
  creditsEarned: 82,
  creditsRequired: 120,
  completedCourses: [
    "CS101", "CS102", "CS201", "CS220", "MATH101", "MATH102",
    "MATH210", "MATH230", "STAT201", "ENG101", "COMM210", "SCI110"
  ],
  skills: [
    { name: "Python", level: 82 },
    { name: "Java", level: 68 },
    { name: "SQL", level: 64 },
    { name: "Git", level: 74 },
    { name: "Data Structures", level: 71 },
    { name: "Pandas", level: 62 },
    { name: "Communication", level: 70 }
  ],
  interests: ["Machine Learning", "Computer Vision", "Responsible AI", "Robotics"],
  preferences: {
    maxCreditsPerTerm: 15,
    preferredWorkMode: "Hybrid",
    preferredLocations: ["Boston", "New York", "Remote"],
    weeklyResearchHours: 8
  }
};

export const degreeProgram = {
  id: "bs_cs",
  name: "B.S. Computer Science",
  school: "Northstar University",
  requiredCredits: 120,
  minimumGpa: 2.0,
  streams: ["AI / Machine Learning", "Software Engineering", "Data Science", "Cybersecurity"],
  requirementGroups: [
    { id: "core", label: "Computer Science Core", required: 12 },
    { id: "math", label: "Mathematics & Statistics", required: 6 },
    { id: "stream", label: "AI/ML Stream", required: 5 },
    { id: "capstone", label: "Senior Experience", required: 2 },
    { id: "gened", label: "General Education", required: 10 }
  ]
};

const course = (code, title, credits, category, skills, prerequisites = [], terms = ["Fall", "Spring"], description = "") => ({
  code, title, credits, category, skills, prerequisites, terms, description
});

export const courses = [
  course("CS101", "Programming Foundations", 4, "core", ["Python", "Problem Solving"], [], ["Fall", "Spring", "Summer"], "Programming fundamentals using Python."),
  course("CS102", "Object-Oriented Programming", 4, "core", ["Java", "Object-Oriented Design"], ["CS101"], ["Fall", "Spring"], "Objects, classes, testing, and reusable design."),
  course("CS201", "Data Structures", 4, "core", ["Data Structures", "Algorithms", "Java"], ["CS102"], ["Fall", "Spring"], "Lists, trees, graphs, hashing, and complexity."),
  course("CS220", "Computer Systems", 4, "core", ["Computer Architecture", "C", "Systems"], ["CS102"], ["Fall", "Spring"], "Low-level execution, memory, processes, and hardware interfaces."),
  course("CS230", "Web Application Engineering", 3, "core", ["JavaScript", "APIs", "Web Development"], ["CS102"], ["Fall", "Spring"], "Accessible full-stack web applications and APIs."),
  course("CS240", "Data Management Fundamentals", 3, "core", ["SQL", "Data Modeling"], ["CS102"], ["Fall", "Spring"], "Relational modeling, SQL, indexing, and transactions."),
  course("CS250", "Human-Centered Computing", 3, "core", ["UX Research", "Accessibility", "Prototyping"], ["CS101"], ["Spring"], "Designing usable and inclusive computing experiences."),
  course("CS260", "Secure Coding Foundations", 3, "core", ["Application Security", "Threat Modeling"], ["CS102"], ["Fall"], "Secure development, common vulnerabilities, and defensive coding."),
  course("CS310", "Algorithms", 4, "core", ["Algorithms", "Complexity", "Problem Solving"], ["CS201", "MATH210"], ["Fall", "Spring"], "Algorithm design, proof techniques, and computational limits."),
  course("CS320", "Database Systems", 4, "core", ["SQL", "Databases", "Data Modeling"], ["CS201", "CS240"], ["Fall", "Spring"], "Database architecture, query optimization, and distributed data."),
  course("CS330", "Software Engineering", 4, "core", ["Software Design", "Testing", "Git", "Teamwork"], ["CS201"], ["Fall", "Spring"], "Architecture, delivery practices, testing, and team software projects."),
  course("CS340", "Computer Networks", 4, "core", ["Networking", "Distributed Systems"], ["CS220"], ["Spring"], "Protocols, routing, reliability, and network programming."),
  course("CS350", "Operating Systems", 4, "core", ["Operating Systems", "Concurrency", "C"], ["CS220", "CS310"], ["Fall"], "Processes, threads, scheduling, storage, and synchronization."),
  course("CS360", "Theory of Computation", 3, "core", ["Automata", "Complexity"], ["CS310", "MATH210"], ["Spring"], "Formal languages, computability, and complexity."),
  course("CS370", "Distributed Systems", 4, "elective", ["Distributed Systems", "Cloud", "Reliability"], ["CS340", "CS350"], ["Spring"], "Consensus, replication, fault tolerance, and distributed design."),
  course("CS380", "Data Visualization", 3, "elective", ["Visualization", "Python", "Communication"], ["STAT201", "CS201"], ["Fall"], "Visual reasoning and interactive data storytelling."),
  course("CS401", "Artificial Intelligence", 4, "stream", ["Artificial Intelligence", "Search", "Knowledge Representation"], ["CS310", "STAT201"], ["Fall"], "Search, planning, probabilistic reasoning, and intelligent agents."),
  course("CS410", "Machine Learning", 4, "stream", ["Machine Learning", "Python", "Model Evaluation"], ["CS310", "MATH230", "STAT201"], ["Fall", "Spring"], "Supervised and unsupervised learning with responsible evaluation."),
  course("CS411", "Deep Learning", 3, "stream", ["Deep Learning", "PyTorch", "Neural Networks"], ["CS410"], ["Spring"], "Neural architectures, optimization, representation learning, and deployment."),
  course("CS412", "Natural Language Processing", 3, "stream", ["NLP", "Transformers", "Python"], ["CS410"], ["Fall"], "Text modeling, language understanding, and modern transformer methods."),
  course("CS413", "Computer Vision", 3, "stream", ["Computer Vision", "Deep Learning", "Python"], ["CS410"], ["Spring"], "Image formation, recognition, detection, and vision systems."),
  course("CS414", "Reinforcement Learning", 3, "stream", ["Reinforcement Learning", "Probability", "Python"], ["CS410"], ["Fall"], "Sequential decision making and learning from interaction."),
  course("CS415", "Responsible AI", 3, "stream", ["Responsible AI", "Fairness", "Model Governance"], ["CS401", "COMM210"], ["Spring"], "Fairness, accountability, transparency, safety, and policy."),
  course("CS420", "Data Engineering", 4, "stream", ["Data Engineering", "SQL", "Pipelines", "Cloud"], ["CS320", "CS330"], ["Fall"], "Reliable data pipelines, orchestration, and analytical platforms."),
  course("CS421", "MLOps and Model Deployment", 4, "stream", ["MLOps", "Cloud", "Docker", "Model Monitoring"], ["CS410", "CS330"], ["Spring"], "Production ML systems, deployment, monitoring, and governance."),
  course("CS430", "Cloud Computing", 3, "elective", ["Cloud", "Containers", "Distributed Systems"], ["CS340", "CS330"], ["Fall", "Spring"], "Cloud architecture, containers, serverless systems, and cost-aware design."),
  course("CS440", "Cybersecurity Engineering", 4, "elective", ["Cybersecurity", "Threat Modeling", "Networks"], ["CS260", "CS340"], ["Spring"], "Security engineering across applications, infrastructure, and operations."),
  course("CS450", "Independent Research", 3, "research", ["Research", "Technical Writing", "Experiment Design"], ["CS310"], ["Fall", "Spring", "Summer"], "Faculty-supervised research resulting in a paper or prototype."),
  course("CS490", "Senior Capstone I", 3, "capstone", ["Product Development", "Teamwork", "Communication"], ["CS330", "CS310"], ["Fall"], "Define and prototype a substantial computing project."),
  course("CS491", "Senior Capstone II", 3, "capstone", ["Product Development", "Delivery", "Communication"], ["CS490"], ["Spring"], "Build, evaluate, and present a production-quality capstone."),
  course("MATH101", "Calculus I", 4, "math", ["Calculus"], [], ["Fall", "Spring", "Summer"]),
  course("MATH102", "Calculus II", 4, "math", ["Calculus"], ["MATH101"], ["Fall", "Spring"]),
  course("MATH210", "Discrete Mathematics", 3, "math", ["Logic", "Proofs", "Combinatorics"], ["MATH101"], ["Fall", "Spring"]),
  course("MATH230", "Linear Algebra", 3, "math", ["Linear Algebra", "Vectors", "Matrices"], ["MATH101"], ["Fall", "Spring"]),
  course("STAT201", "Probability and Statistics", 4, "math", ["Statistics", "Probability", "R"], ["MATH102"], ["Fall", "Spring"]),
  course("STAT310", "Applied Statistical Modeling", 3, "math", ["Statistics", "Regression", "Experiment Design"], ["STAT201"], ["Spring"]),
  course("ENG101", "Academic Writing", 3, "gened", ["Writing"], [], ["Fall", "Spring", "Summer"]),
  course("COMM210", "Technical Communication", 3, "gened", ["Communication", "Presentation"], ["ENG101"], ["Fall", "Spring"]),
  course("SCI110", "Scientific Inquiry", 4, "gened", ["Scientific Method"], [], ["Fall", "Spring"])
];

const research = (id, title, lab, professor, skills, interests, requiredCourses, minGpa, deadline, commitment, description) => ({
  id, type: "research", title, lab, professor, skills, interests, requiredCourses, minGpa, deadline, commitment, description,
  campus: "Northstar University", source: "Curated university research feed"
});

export const researchOpportunities = [
  research("res_cv_vision", "Human-Aware Computer Vision", "Vision & Learning Lab", "Dr. Elena Ruiz", ["Python", "Machine Learning", "Computer Vision"], ["Computer Vision", "Responsible AI"], ["CS310", "CS410"], 3.2, "Sep 18, 2026", "8 hrs/week", "Build vision models that detect objects while measuring fairness and uncertainty."),
  research("res_robotics", "Learning for Assistive Robotics", "Robotics & Autonomy Lab", "Prof. Marcus Lee", ["Python", "Machine Learning", "Algorithms"], ["Robotics", "Machine Learning"], ["CS310", "CS410"], 3.0, "Sep 25, 2026", "10 hrs/week", "Train policies for safe robot assistance in human environments."),
  research("res_nlp", "Trustworthy Language Models", "Language Intelligence Group", "Dr. Priya Nair", ["Python", "NLP", "Responsible AI"], ["Responsible AI", "Machine Learning"], ["CS310", "CS410"], 3.3, "Oct 2, 2026", "8 hrs/week", "Evaluate reliability, bias, and explanations in language-model systems."),
  research("res_health", "Predictive Models for Student Wellbeing", "AI for Social Good Lab", "Dr. Noah Williams", ["Python", "Statistics", "Machine Learning"], ["Machine Learning", "Responsible AI"], ["STAT201", "CS310"], 3.0, "Sep 30, 2026", "6 hrs/week", "Develop privacy-conscious models for identifying academic support needs."),
  research("res_edge", "Efficient AI on Edge Devices", "Embedded Intelligence Lab", "Prof. Sunita Rao", ["Python", "Computer Systems", "Deep Learning"], ["Machine Learning", "Robotics"], ["CS220", "CS410"], 3.2, "Oct 9, 2026", "8 hrs/week", "Compress and benchmark neural networks on low-power devices."),
  research("res_graph", "Graph Learning for Scientific Discovery", "Data & Discovery Lab", "Dr. Omar Haddad", ["Python", "Algorithms", "Machine Learning"], ["Machine Learning"], ["CS310", "MATH230"], 3.4, "Oct 15, 2026", "10 hrs/week", "Use graph neural methods to model complex scientific relationships."),
  research("res_climate", "Climate Forecasting with Deep Learning", "Computational Sustainability Lab", "Dr. Hannah Kim", ["Python", "Statistics", "Deep Learning"], ["Machine Learning"], ["STAT201", "CS410"], 3.1, "Oct 20, 2026", "8 hrs/week", "Forecast extreme weather patterns using spatiotemporal data."),
  research("res_security", "Adversarial Machine Learning", "Secure AI Lab", "Prof. James Okafor", ["Python", "Cybersecurity", "Machine Learning"], ["Responsible AI", "Machine Learning"], ["CS260", "CS410"], 3.4, "Sep 28, 2026", "10 hrs/week", "Study attacks and defenses for deployed ML models."),
  research("res_education", "Adaptive Learning Systems", "Learning Sciences Studio", "Dr. Sofia Martinez", ["Python", "Data Analysis", "UX Research"], ["Machine Learning", "Responsible AI"], ["STAT201", "CS250"], 3.0, "Oct 12, 2026", "6 hrs/week", "Design adaptive course experiences with interpretable recommendations."),
  research("res_multimodal", "Multimodal Reasoning", "Foundation Models Lab", "Dr. Aisha Bell", ["Python", "Deep Learning", "NLP", "Computer Vision"], ["Computer Vision", "Machine Learning"], ["CS410", "CS411"], 3.5, "Nov 1, 2026", "10 hrs/week", "Explore models that reason jointly over language, images, and structured data."),
  research("res_causal", "Causal ML for Public Policy", "Responsible Data Lab", "Prof. Daniel Cho", ["Python", "Statistics", "Experiment Design"], ["Responsible AI"], ["STAT201", "STAT310"], 3.3, "Oct 22, 2026", "8 hrs/week", "Build causal models for transparent policy evaluation."),
  research("res_recsys", "Fair Recommendation Systems", "Personalization Lab", "Dr. Mei Thompson", ["Python", "SQL", "Machine Learning"], ["Responsible AI", "Machine Learning"], ["CS320", "CS410"], 3.2, "Oct 17, 2026", "8 hrs/week", "Improve ranking quality while reducing popularity and demographic bias."),
  research("res_hci", "Human-AI Collaboration", "Interactive Intelligence Lab", "Dr. Lucas Green", ["UX Research", "Python", "Communication"], ["Responsible AI"], ["CS250", "COMM210"], 3.0, "Sep 29, 2026", "6 hrs/week", "Study how people understand, correct, and collaborate with AI systems."),
  research("res_data", "Data Quality for ML Pipelines", "Reliable Systems Lab", "Prof. Grace Patel", ["SQL", "Python", "Data Engineering"], ["Machine Learning"], ["CS320", "CS330"], 3.1, "Oct 6, 2026", "8 hrs/week", "Detect data drift, schema failures, and quality regressions in ML pipelines."),
  research("res_rl", "Safe Reinforcement Learning", "Autonomous Systems Lab", "Dr. Victor Nguyen", ["Python", "Probability", "Reinforcement Learning"], ["Robotics", "Responsible AI"], ["CS410", "CS414"], 3.5, "Nov 4, 2026", "10 hrs/week", "Develop constrained learning methods for safety-critical decision systems.")
];

const scholarship = (id, title, provider, amount, deadline, minGpa, majors, interests, standings, requirements) => ({
  id, type: "scholarship", title, provider, amount, deadline, minGpa, majors, interests, standings, requirements,
  source: "Curated scholarship catalog"
});

export const scholarships = [
  scholarship("sch_ai_future", "AI Future Scholars Award", "Northstar Computing Foundation", 7500, "Oct 12, 2026", 3.3, ["Computer Science", "Data Science"], ["Machine Learning", "Responsible AI"], ["Sophomore", "Junior"], ["Essay", "Faculty reference", "Unofficial transcript"]),
  scholarship("sch_stem_excellence", "STEM Excellence Scholarship", "Horizon Education Trust", 5000, "Nov 1, 2026", 3.5, ["Computer Science", "Engineering", "Mathematics"], ["STEM"], ["Sophomore", "Junior", "Senior"], ["Transcript", "Activities summary"]),
  scholarship("sch_women_ai", "Women Building Responsible AI", "Equitable Tech Alliance", 10000, "Oct 25, 2026", 3.0, ["Computer Science", "Data Science"], ["Responsible AI", "Machine Learning"], ["Sophomore", "Junior"], ["Personal statement", "Project portfolio"]),
  scholarship("sch_first_research", "Undergraduate Research Launch Grant", "Northstar Office of Research", 3000, "Sep 30, 2026", 2.8, ["Any STEM major"], ["Research"], ["Sophomore", "Junior"], ["Research mentor", "One-page proposal"]),
  scholarship("sch_cloud", "Cloud Innovators Scholarship", "Open Compute Foundation", 6000, "Nov 14, 2026", 3.2, ["Computer Science", "Information Systems"], ["Cloud", "Machine Learning"], ["Sophomore", "Junior"], ["Technical essay", "Resume"]),
  scholarship("sch_data_good", "Data for Good Fellowship", "Civic Analytics Network", 8000, "Dec 2, 2026", 3.2, ["Computer Science", "Statistics", "Public Policy"], ["Responsible AI", "Social Impact"], ["Sophomore", "Junior", "Senior"], ["Essay", "Community impact example"]),
  scholarship("sch_robotics", "Future Roboticists Award", "Robotics Industry Council", 4500, "Oct 28, 2026", 3.1, ["Computer Science", "Robotics", "Engineering"], ["Robotics"], ["Sophomore", "Junior"], ["Project description", "Recommendation"]),
  scholarship("sch_cyber", "Secure Futures Scholarship", "Cyber Defense Consortium", 7000, "Nov 9, 2026", 3.0, ["Computer Science", "Cybersecurity"], ["Cybersecurity"], ["Sophomore", "Junior", "Senior"], ["Security interest statement", "Transcript"]),
  scholarship("sch_leadership", "Technology Leadership Award", "NextGen Leaders", 3500, "Oct 18, 2026", 3.0, ["Any technology major"], ["Leadership"], ["Sophomore", "Junior"], ["Leadership essay", "Service record"]),
  scholarship("sch_open_source", "Open Source Contributor Grant", "Code Commons", 4000, "Nov 20, 2026", 2.8, ["Computer Science", "Software Engineering"], ["Open Source"], ["Sophomore", "Junior", "Senior"], ["Public repository", "Contribution summary"]),
  scholarship("sch_cv", "Vision Computing Scholarship", "Imaging Science Society", 5500, "Dec 5, 2026", 3.2, ["Computer Science", "Electrical Engineering"], ["Computer Vision"], ["Sophomore", "Junior"], ["Project abstract", "Transcript"]),
  scholarship("sch_transfer", "Academic Momentum Award", "Northstar Alumni Association", 2500, "Oct 5, 2026", 3.4, ["Any major"], ["Academic Achievement"], ["Sophomore", "Junior"], ["Transcript", "Short response"]),
  scholarship("sch_community", "Community Technologist Scholarship", "Digital Neighborhoods Fund", 5000, "Nov 6, 2026", 3.0, ["Computer Science", "Information Systems"], ["Social Impact"], ["Sophomore", "Junior"], ["Community project plan"]),
  scholarship("sch_inclusive", "Inclusive Computing Scholarship", "Access by Design", 6500, "Oct 31, 2026", 3.0, ["Computer Science", "Human-Computer Interaction"], ["Accessibility", "Responsible AI"], ["Sophomore", "Junior"], ["Accessibility essay", "Portfolio"]),
  scholarship("sch_math", "Computational Mathematics Award", "Euler Scholars Fund", 4200, "Nov 11, 2026", 3.4, ["Computer Science", "Mathematics", "Statistics"], ["Mathematics", "Machine Learning"], ["Sophomore", "Junior"], ["Transcript", "Faculty reference"]),
  scholarship("sch_green", "Green Computing Scholarship", "Sustainable Systems Coalition", 4800, "Dec 1, 2026", 3.1, ["Computer Science", "Engineering"], ["Sustainability", "Cloud"], ["Sophomore", "Junior", "Senior"], ["Sustainability statement"]),
  scholarship("sch_entrepreneur", "Student Technology Venture Grant", "LaunchPad University Network", 9000, "Nov 30, 2026", 2.8, ["Any major"], ["Entrepreneurship", "Technology"], ["Sophomore", "Junior", "Senior"], ["Pitch deck", "Prototype link"]),
  scholarship("sch_global", "Global Technology Scholars", "World Learning Exchange", 6000, "Dec 12, 2026", 3.2, ["Computer Science", "Engineering"], ["Global Impact"], ["Sophomore", "Junior"], ["Essay", "Language or travel plan"]),
  scholarship("sch_peer", "Peer Mentor in Computing Award", "Northstar Student Success Center", 2200, "Sep 26, 2026", 3.0, ["Computer Science"], ["Mentoring", "Leadership"], ["Sophomore", "Junior", "Senior"], ["Mentoring statement", "Faculty reference"]),
  scholarship("sch_capstone", "Applied AI Capstone Fund", "Innovation Partners Council", 5000, "Jan 20, 2027", 3.2, ["Computer Science", "Data Science"], ["Machine Learning", "Product Development"], ["Junior", "Senior"], ["Capstone proposal", "Budget"])
];

const internship = (id, role, company, location, workMode, term, deadline, skills, preferredCourses, minGpa, description) => ({
  id, type: "internship", title: role, role, company, location, workMode, term, deadline, skills, preferredCourses, minGpa, paid: true,
  description, source: "Curated employer opportunity feed"
});

export const internships = [
  internship("int_ml_nova", "Machine Learning Engineering Intern", "Nova Labs", "Boston, MA", "Hybrid", "Summer 2027", "Oct 20, 2026", ["Python", "Machine Learning", "SQL", "Git"], ["CS310", "CS410", "STAT201"], 3.2, "Prototype ranking models and help productionize evaluation pipelines."),
  internship("int_swe_aurora", "Software Engineering Intern — AI Platform", "Aurora Compute", "Remote", "Remote", "Summer 2027", "Oct 30, 2026", ["Python", "Java", "Algorithms", "Git"], ["CS310", "CS330"], 3.0, "Build APIs and developer tooling for an internal AI platform."),
  internship("int_ds_atlas", "Data Science Intern", "Atlas Health", "New York, NY", "Hybrid", "Summer 2027", "Nov 3, 2026", ["Python", "SQL", "Statistics", "Pandas"], ["STAT201", "CS320"], 3.1, "Analyze product data and develop interpretable predictive models."),
  internship("int_cv_lumen", "Computer Vision Intern", "Lumen Mobility", "Pittsburgh, PA", "On-site", "Summer 2027", "Oct 18, 2026", ["Python", "Computer Vision", "Machine Learning", "C++"], ["CS410", "CS413"], 3.3, "Develop perception models for autonomous warehouse vehicles."),
  internship("int_mlops_orbit", "MLOps Engineering Intern", "Orbit Cloud", "Remote", "Remote", "Summer 2027", "Nov 8, 2026", ["Python", "Docker", "Cloud", "MLOps"], ["CS330", "CS421", "CS430"], 3.0, "Automate model deployment, monitoring, and incident response."),
  internship("int_nlp_scribe", "NLP Research Intern", "Scribe AI", "Cambridge, MA", "Hybrid", "Summer 2027", "Oct 27, 2026", ["Python", "NLP", "Deep Learning"], ["CS410", "CS412"], 3.4, "Evaluate language models and develop domain-adaptation experiments."),
  internship("int_data_polaris", "Data Engineering Intern", "Polaris Retail", "New York, NY", "Hybrid", "Summer 2027", "Nov 12, 2026", ["SQL", "Python", "Data Engineering", "Cloud"], ["CS320", "CS420"], 3.0, "Build reliable batch and streaming data pipelines."),
  internship("int_robotics_kinetic", "Robotics Software Intern", "Kinetic Robotics", "Boston, MA", "On-site", "Summer 2027", "Oct 22, 2026", ["Python", "C++", "Algorithms", "Robotics"], ["CS310", "CS410"], 3.2, "Develop planning and perception software for collaborative robots."),
  internship("int_responsible_civic", "Responsible AI Intern", "Civic Systems Lab", "Washington, DC", "Hybrid", "Spring 2027", "Sep 29, 2026", ["Python", "Responsible AI", "Statistics", "Communication"], ["STAT201", "CS415"], 3.1, "Assess model fairness and produce transparent impact documentation."),
  internship("int_backend_vertex", "Backend Engineering Intern", "Vertex Education", "Remote", "Remote", "Summer 2027", "Nov 6, 2026", ["Java", "SQL", "APIs", "Testing"], ["CS320", "CS330"], 2.9, "Build secure services that power adaptive learning products."),
  internship("int_analytics_river", "Product Analytics Intern", "River Financial", "New York, NY", "Hybrid", "Summer 2027", "Nov 15, 2026", ["SQL", "Python", "Statistics", "Visualization"], ["STAT201", "CS380"], 3.0, "Translate behavioral data into product experiments and dashboards."),
  internship("int_security_sentinel", "AI Security Intern", "Sentinel Works", "Arlington, VA", "Hybrid", "Summer 2027", "Oct 24, 2026", ["Python", "Cybersecurity", "Machine Learning"], ["CS260", "CS410", "CS440"], 3.3, "Test ML systems against adversarial and data-poisoning attacks."),
  internship("int_research_quantum", "Applied Research Intern", "Quantum Grove", "Cambridge, MA", "On-site", "Summer 2027", "Nov 1, 2026", ["Python", "Algorithms", "Research", "Machine Learning"], ["CS310", "CS410", "CS450"], 3.5, "Run experiments on new learning algorithms and publish findings."),
  internship("int_swe_harbor", "Software Engineering Intern", "Harbor Systems", "Boston, MA", "Hybrid", "Summer 2027", "Nov 10, 2026", ["Java", "Git", "Testing", "Algorithms"], ["CS310", "CS330"], 3.0, "Ship customer-facing features in a collaborative engineering team."),
  internship("int_cloud_zenith", "Cloud Platform Intern", "Zenith Infrastructure", "Remote", "Remote", "Summer 2027", "Nov 18, 2026", ["Cloud", "Linux", "Python", "Networking"], ["CS340", "CS430"], 3.0, "Build automation for a multi-region developer platform."),
  internship("int_vision_terra", "Geospatial Vision Intern", "TerraSight", "Remote", "Remote", "Summer 2027", "Nov 4, 2026", ["Python", "Computer Vision", "Statistics"], ["CS410", "CS413", "STAT201"], 3.2, "Analyze satellite imagery for environmental monitoring."),
  internship("int_bio_helix", "ML Intern — Computational Biology", "Helix Research", "Boston, MA", "Hybrid", "Summer 2027", "Oct 31, 2026", ["Python", "Machine Learning", "Statistics", "Research"], ["CS410", "STAT201"], 3.4, "Build predictive models for high-dimensional biological data."),
  internship("int_frontend_canvas", "Frontend Engineering Intern — AI UX", "Canvas Intelligence", "New York, NY", "Hybrid", "Summer 2027", "Nov 7, 2026", ["JavaScript", "UX Research", "APIs", "Accessibility"], ["CS230", "CS250"], 3.0, "Create understandable interfaces for human-AI collaboration."),
  internship("int_recsys_mosaic", "Recommendation Systems Intern", "Mosaic Media", "Remote", "Remote", "Summer 2027", "Nov 13, 2026", ["Python", "SQL", "Machine Learning", "Algorithms"], ["CS310", "CS320", "CS410"], 3.2, "Improve ranking, retrieval, and recommendation quality."),
  internship("int_qa_modelcheck", "AI Quality Engineering Intern", "ModelCheck", "Remote", "Remote", "Spring 2027", "Oct 6, 2026", ["Python", "Testing", "Model Evaluation", "Communication"], ["CS330", "CS410"], 3.0, "Design test suites and quality gates for AI-enabled products.")
];

export const careerProfiles = {
  "Machine Learning Engineer": {
    label: "Machine Learning Engineer",
    keywords: ["ml engineer", "machine learning", "ai engineer", "artificial intelligence"],
    prioritySkills: ["Python", "Algorithms", "Statistics", "Machine Learning", "SQL", "MLOps", "Cloud", "Deep Learning", "Communication"],
    recommendedCourses: ["CS310", "CS320", "CS410", "CS411", "CS420", "CS421", "CS430", "CS415", "CS490", "CS491"]
  },
  "Data Scientist": {
    label: "Data Scientist",
    keywords: ["data scientist", "data science", "analytics"],
    prioritySkills: ["Python", "Statistics", "SQL", "Machine Learning", "Visualization", "Experiment Design", "Communication"],
    recommendedCourses: ["CS310", "CS320", "CS380", "CS410", "CS420", "STAT310", "CS415", "CS490", "CS491"]
  },
  "Software Engineer": {
    label: "Software Engineer",
    keywords: ["software engineer", "backend", "full stack", "developer"],
    prioritySkills: ["Java", "Algorithms", "Software Design", "Testing", "SQL", "Cloud", "Git", "Communication"],
    recommendedCourses: ["CS310", "CS320", "CS330", "CS340", "CS350", "CS370", "CS430", "CS490", "CS491"]
  },
  "Cybersecurity Engineer": {
    label: "Cybersecurity Engineer",
    keywords: ["cybersecurity", "security engineer", "cyber"],
    prioritySkills: ["Cybersecurity", "Networking", "Application Security", "Threat Modeling", "Python", "Cloud", "Communication"],
    recommendedCourses: ["CS260", "CS310", "CS330", "CS340", "CS350", "CS430", "CS440", "CS490", "CS491"]
  }
};

export const terms = [
  { id: "fall-2026", label: "Fall 2026", season: "Fall", year: 2026 },
  { id: "spring-2027", label: "Spring 2027", season: "Spring", year: 2027 },
  { id: "summer-2027", label: "Summer 2027", season: "Summer", year: 2027 },
  { id: "fall-2027", label: "Fall 2027", season: "Fall", year: 2027 },
  { id: "spring-2028", label: "Spring 2028", season: "Spring", year: 2028 }
];

export const allOpportunities = [...researchOpportunities, ...scholarships, ...internships];

import { careerCatalogFallback } from "./career-catalog-data.js";

const normalize = (value = "") => String(value).trim().toLowerCase();
const words = (value = "") => normalize(value).split(/[^a-z0-9+#.]+/).filter((item) => item.length > 1);
const unique = (items) => [...new Set(items.filter(Boolean))];

let catalog = normalizeCatalog(careerCatalogFallback);
let catalogSource = "embedded-fallback";
let loadWarning = null;

const CAREER_ALIASES = {
  "AI/ML": [
    ["artificial intelligence", "AI Research Scientist"],
    ["machine learning", "ML Engineer"],
    ["ml engineer", "ML Engineer"],
    ["ai engineer", "ML Engineer"],
    ["build ai", "ML Engineer"],
    ["train models", "ML Engineer"],
    ["intelligent systems", "Applied Scientist"],
    ["mlops", "MLOps Engineer"],
    ["deep learning", "ML Engineer"],
  ],
  "Data Science & Analytics": [
    ["data science", "Data Scientist"],
    ["work with data", "Data Scientist"],
    ["analyze data", "Data Analyst"],
    ["data analytics", "Data Analyst"],
    ["dashboards", "BI Engineer"],
    ["business intelligence", "BI Engineer"],
  ],
  Cybersecurity: [
    ["cyber security", "Security Analyst"],
    ["protect systems", "Security Analyst"],
    ["protecting systems", "Security Analyst"],
    ["cyber defense", "Security Analyst"],
    ["stop hackers", "Security Analyst"],
    ["ethical hacking", "Penetration Tester"],
    ["penetration testing", "Penetration Tester"],
    ["ethically testing", "Penetration Tester"],
    ["test systems for weaknesses", "Penetration Tester"],
    ["find security weaknesses", "Penetration Tester"],
    ["security operations", "SOC Engineer"],
    ["soc analyst", "SOC Engineer"],
  ],
  "Software Engineering": [
    ["software development", "Full-Stack Engineer"],
    ["build software", "Full-Stack Engineer"],
    ["build applications", "Full-Stack Engineer"],
    ["build apps", "Full-Stack Engineer"],
    ["backend development", "Backend Engineer"],
    ["backend systems", "Backend Engineer"],
    ["full stack", "Full-Stack Engineer"],
    ["platform engineering", "Platform Engineer"],
  ],
  "Cloud Computing / DevOps": [
    ["cloud computing", "Cloud Engineer"],
    ["cloud infrastructure", "Cloud Engineer"],
    ["cloud engineer", "Cloud Engineer"],
    ["site reliability", "SRE"],
    ["reliability engineering", "SRE"],
    ["devops", "DevOps Engineer"],
    ["deployment automation", "DevOps Engineer"],
  ],
  "Web Development": [
    ["web development", "Web Developer"],
    ["build websites", "Web Developer"],
    ["make websites", "Web Developer"],
    ["frontend development", "Frontend Engineer"],
    ["front end", "Frontend Engineer"],
    ["ui engineering", "UI Engineer"],
  ],
  "Mobile App Development": [
    ["mobile apps", "Cross-platform Developer"],
    ["mobile applications", "Cross-platform Developer"],
    ["ios development", "iOS Engineer"],
    ["iphone apps", "iOS Engineer"],
    ["android development", "Android Engineer"],
    ["android apps", "Android Engineer"],
    ["flutter", "Cross-platform Developer"],
    ["react native", "Cross-platform Developer"],
  ],
  "Computer Networks": [
    ["computer networking", "Network Engineer"],
    ["network infrastructure", "Network Engineer"],
    ["network engineer", "Network Engineer"],
    ["telecommunications", "Telecom Engineer"],
    ["telecom", "Telecom Engineer"],
  ],
  Robotics: [
    ["build intelligent robots", "Robotics Engineer"],
    ["intelligent robots", "Robotics Engineer"],
    ["build robots", "Robotics Engineer"],
    ["design robots", "Robotics Engineer"],
    ["robot software", "Robotics Engineer"],
    ["robotics", "Robotics Engineer"],
    ["control systems", "Controls Engineer"],
    ["industrial automation", "Automation Engineer"],
    ["automation engineer", "Automation Engineer"],
  ],
  "Blockchain / Web3": [
    ["blockchain", "Protocol Engineer"],
    ["web3", "Protocol Engineer"],
    ["smart contracts", "Smart Contract Engineer"],
    ["solidity", "Smart Contract Engineer"],
    ["crypto protocols", "Protocol Engineer"],
  ],
  "AR/VR & Game Development": [
    ["augmented reality", "XR Developer"],
    ["virtual reality", "XR Developer"],
    ["mixed reality", "XR Developer"],
    ["game development", "Game Engineer"],
    ["build games", "Game Engineer"],
    ["technical art", "Technical Artist"],
  ],
  "Human-Computer Interaction (UX/UI)": [
    ["human computer interaction", "UX Researcher"],
    ["user experience", "UX Designer"],
    ["design user experiences", "UX Designer"],
    ["product design", "Product Designer"],
    ["ux research", "UX Researcher"],
    ["user interface design", "Product Designer"],
  ],
  "Quantum Computing": [
    ["quantum computing", "Quantum Software Engineer"],
    ["quantum computers", "Quantum Software Engineer"],
    ["quantum software", "Quantum Software Engineer"],
    ["quantum research", "Quantum Research Scientist"],
  ],
  "Embedded Systems / IoT": [
    ["internet of things", "IoT Developer"],
    ["iot", "IoT Developer"],
    ["embedded systems", "Embedded Systems Engineer"],
    ["firmware", "Embedded Systems Engineer"],
    ["microcontrollers", "Embedded Systems Engineer"],
  ],
  "Electrical/Electronics Engineering": [
    ["electrical engineering", "EE"],
    ["electronics engineering", "EE"],
    ["radio frequency", "RF Engineer"],
    ["rf systems", "RF Engineer"],
    ["power systems", "Power Systems Engineer"],
    ["electric power", "Power Systems Engineer"],
  ],
  "Mechanical Engineering": [
    ["mechanical engineering", "Mechanical Design Engineer"],
    ["mechanical design", "Mechanical Design Engineer"],
    ["design machines", "Mechanical Design Engineer"],
    ["manufacturing engineering", "Manufacturing Engineer"],
    ["manufacturing systems", "Manufacturing Engineer"],
  ],
  "Biomedical Engineering": [
    ["biomedical engineering", "Biomedical Device Engineer"],
    ["medical devices", "Biomedical Device Engineer"],
    ["healthcare devices", "Biomedical Device Engineer"],
    ["clinical engineering", "Clinical Engineer"],
  ],
  "Chip Design / VLSI": [
    ["design computer chips", "ASIC Design Engineer"],
    ["computer chips", "ASIC Design Engineer"],
    ["chip design", "ASIC Design Engineer"],
    ["design chips", "ASIC Design Engineer"],
    ["semiconductor design", "ASIC Design Engineer"],
    ["asic", "ASIC Design Engineer"],
    ["vlsi", "Physical Design Engineer"],
    ["chip verification", "Verification Engineer"],
    ["physical design", "Physical Design Engineer"],
  ],
  "Business Analytics / FinTech": [
    ["data and business decisions", "Business Analyst"],
    ["business decisions", "Business Analyst"],
    ["financial technology", "FinTech Engineer"],
    ["fintech", "FinTech Engineer"],
    ["business analytics", "Business Analyst"],
    ["business analyst", "Business Analyst"],
    ["quant finance", "Quant Analyst"],
    ["quantitative finance", "Quant Analyst"],
    ["financial modeling", "Quant Analyst"],
  ],
  "Bioinformatics / Computational Biology": [
    ["computational biology", "Computational Biologist"],
    ["bioinformatics", "Bioinformatics Scientist"],
    ["genomic data", "Bioinformatics Scientist"],
    ["biology and coding", "Computational Biologist"],
  ],
};

function normalizeCatalog(input) {
  if (!input || !Array.isArray(input.fields)) throw new Error("Career catalog must contain a fields array.");
  const fields = input.fields
    .filter((field) => field && typeof field.topic === "string")
    .map((field) => ({
      topic: field.topic.trim(),
      note: field.note || "",
      career_paths: Array.isArray(field.career_paths) ? field.career_paths.filter((item) => item?.role) : [],
      typical_degree: Array.isArray(field.typical_degree) ? field.typical_degree.filter(Boolean) : [],
      notable_universities: normalizeLinks(field.notable_universities),
      learning_path: {
        beginner: normalizeLinks(field.learning_path?.beginner),
        intermediate: normalizeLinks(field.learning_path?.intermediate),
        advanced: normalizeLinks(field.learning_path?.advanced),
      },
      scholarships: normalizeLinks(field.scholarships),
      internships: normalizeLinks(field.internships),
      research_contacts: normalizeLinks(field.research_contacts),
    }));
  if (!fields.length) throw new Error("Career catalog does not contain any usable fields.");
  return { _meta: { ...(input._meta || {}) }, fields };
}

function normalizeLinks(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean).map((item) => ({ ...item, url: typeof item.url === "string" && item.url.trim() ? item.url.trim() : null }));
}

function linkMetrics() {
  const entries = catalog.fields.flatMap((field) => [
    ...field.notable_universities,
    ...field.learning_path.beginner,
    ...field.learning_path.intermediate,
    ...field.learning_path.advanced,
    ...field.scholarships,
    ...field.internships,
    ...field.research_contacts,
  ]);
  const verifiedLinks = entries.filter((item) => item.url).length;
  return { totalEntries: entries.length, verifiedLinks, linksNeedingVerification: entries.length - verifiedLinks };
}

export async function loadCareerCatalog(url = new URL("../data/pathwayos-career-catalog.json", import.meta.url)) {
  if (typeof fetch !== "function") return getCareerCatalogStatus();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Career catalog request failed with ${response.status}.`);
    catalog = normalizeCatalog(await response.json());
    catalogSource = "external-json";
    loadWarning = null;
  } catch (error) {
    catalog = normalizeCatalog(careerCatalogFallback);
    catalogSource = "embedded-fallback";
    loadWarning = error instanceof Error ? error.message : "Career catalog could not be loaded.";
  }
  return getCareerCatalogStatus();
}

export function getCareerCatalogStatus() {
  const metrics = linkMetrics();
  return {
    source: catalogSource,
    loaded: true,
    warning: loadWarning,
    asOf: catalog._meta.as_of || "Unknown",
    verificationStatus: catalog._meta.verification_status || "No verification note supplied.",
    schemaNotes: catalog._meta.schema_notes || "",
    sourcing: catalog._meta.sourcing || "",
    fieldCount: catalog.fields.length,
    roleCount: catalog.fields.reduce((total, field) => total + field.career_paths.length, 0),
    scholarshipCount: catalog.fields.reduce((total, field) => total + field.scholarships.length, 0),
    internshipCount: catalog.fields.reduce((total, field) => total + field.internships.length, 0),
    researchContactCount: catalog.fields.reduce((total, field) => total + field.research_contacts.length, 0),
    ...metrics,
  };
}

export function listCareerFields({ query = "" } = {}) {
  const search = normalize(query);
  return catalog.fields
    .filter((field) => !search || careerFieldText(field).includes(search))
    .map((field) => ({
      topic: field.topic,
      roles: field.career_paths.map((item) => item.role),
      typicalDegrees: field.typical_degree,
      learningResources: Object.values(field.learning_path).reduce((total, items) => total + items.length, 0),
      scholarshipCount: field.scholarships.length,
      internshipCount: field.internships.length,
      researchContactCount: field.research_contacts.length,
    }));
}

export function getCareerField(topic = "") {
  const target = normalize(topic);
  if (!target) return catalog.fields[0] || null;
  return catalog.fields.find((field) => normalize(field.topic) === target)
    || catalog.fields.find((field) => normalize(field.topic).includes(target) || target.includes(normalize(field.topic)))
    || catalog.fields.find((field) => field.career_paths.some((item) => normalize(item.role) === target || normalize(item.role).includes(target)))
    || null;
}

export function findCareerMatch(text = "") {
  const target = normalize(text);
  if (!target) return null;
  let best = null;

  const consider = (field, role, phrase, boost) => {
    const normalizedPhrase = normalize(phrase);
    if (!phraseMatches(target, normalizedPhrase)) return;
    const strength = normalizedPhrase.length + boost;
    if (!best || strength > best.strength) best = { topic: field.topic, role: role || field.career_paths[0]?.role || "", strength };
  };

  for (const field of catalog.fields) {
    consider(field, field.career_paths[0]?.role || "", field.topic, 35);
    for (const segment of field.topic.split(/[\/&()]/).map((item) => item.trim()).filter(Boolean)) consider(field, field.career_paths[0]?.role || "", segment, 20);
    for (const [alias, preferredRole] of CAREER_ALIASES[field.topic] || []) consider(field, preferredRole, alias, 80);
    for (const item of field.career_paths) consider(field, item.role, item.role, 100);
  }
  return best;
}

function phraseMatches(text, phrase) {
  if (!phrase) return false;
  if (/^[a-z0-9+#.]{1,3}$/.test(phrase)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase)}([^a-z0-9]|$)`, "i").test(text);
  }
  return text.includes(phrase);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function exploreCareerPath({ topic, role = "" } = {}) {
  const field = getCareerField(topic || role);
  if (!field) return { status: "not_found", query: topic || role || "", availableTopics: catalog.fields.map((item) => item.topic) };
  const selectedRole = role
    ? field.career_paths.find((item) => normalize(item.role) === normalize(role))?.role || field.career_paths[0]?.role || ""
    : field.career_paths[0]?.role || "";
  return {
    status: "ok",
    topic: field.topic,
    selectedRole,
    careerPaths: field.career_paths.map((item) => item.role),
    typicalDegrees: field.typical_degree,
    notableUniversities: field.notable_universities,
    learningPath: field.learning_path,
    scholarships: field.scholarships,
    internships: field.internships,
    researchContacts: field.research_contacts,
    note: field.note || "",
    source: getCareerCatalogStatus(),
  };
}

export function recommendCareerPaths({ degree = "", interests = [], skills = [], limit = 5 } = {}) {
  const supplied = unique([degree, ...asArray(interests), ...asArray(skills)]).join(" ");
  const queryWords = new Set(words(supplied));
  return catalog.fields
    .map((field) => {
      const tokens = words(careerFieldText(field));
      const matches = unique(tokens.filter((token) => queryWords.has(token)));
      const degreeFit = field.typical_degree.some((item) => normalize(degree).includes(normalize(item)) || normalize(item).includes(normalize(degree))) ? 28 : 0;
      const score = Math.min(98, 42 + degreeFit + Math.min(28, matches.length * 4));
      return { topic: field.topic, roles: field.career_paths.map((item) => item.role), matchScore: score, matchedTerms: matches.slice(0, 8), typicalDegrees: field.typical_degree };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.topic.localeCompare(b.topic))
    .slice(0, Math.max(1, Math.min(10, Number(limit) || 5)));
}

export function compareCareerPaths(topics = []) {
  return unique(asArray(topics)).slice(0, 5).map((topic) => {
    const result = exploreCareerPath({ topic });
    if (result.status !== "ok") return result;
    return {
      topic: result.topic,
      careerPaths: result.careerPaths,
      typicalDegrees: result.typicalDegrees,
      learningResources: Object.values(result.learningPath).reduce((total, items) => total + items.length, 0),
      scholarships: result.scholarships.length,
      internships: result.internships.length,
      researchContacts: result.researchContacts.length,
      verifiedLinks: [
        ...result.notableUniversities,
        ...Object.values(result.learningPath).flat(),
        ...result.scholarships,
        ...result.internships,
        ...result.researchContacts,
      ].filter((item) => item.url).length,
    };
  });
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function careerFieldText(field) {
  return normalize([
    field.topic,
    field.note,
    ...field.career_paths.map((item) => item.role),
    ...field.typical_degree,
    ...field.notable_universities.map((item) => item.name),
    ...Object.values(field.learning_path).flatMap((items) => items.flatMap((item) => [item.name, item.where])),
    ...field.scholarships.flatMap((item) => [item.name, item.note]),
    ...field.internships.flatMap((item) => [item.name, item.note]),
    ...field.research_contacts.flatMap((item) => [item.name, item.affiliation]),
  ].join(" "));
}

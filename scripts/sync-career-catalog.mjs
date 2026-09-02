import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export async function syncCareerCatalog({ root = resolve(".") } = {}) {
  const sourcePath = resolve(root, "data/careercompass-career-catalog.json");
  const outputPath = resolve(root, "src/career-catalog-data.js");
  const raw = await readFile(sourcePath, "utf8");
  const catalog = JSON.parse(raw);

  if (!catalog || !Array.isArray(catalog.fields) || !catalog.fields.length) {
    throw new Error("Career catalog must contain a non-empty fields array.");
  }

  const invalidField = catalog.fields.find((field) => !field || typeof field.topic !== "string" || !Array.isArray(field.career_paths));
  if (invalidField) throw new Error("Every career catalog field must include a topic and career_paths array.");

  const moduleSource = [
    "// Generated from data/careercompass-career-catalog.json. Do not edit manually.",
    `export const careerCatalogFallback = ${JSON.stringify(catalog, null, 2)};`,
    "",
  ].join("\n");
  await writeFile(outputPath, moduleSource, "utf8");

  const counts = {
    fields: catalog.fields.length,
    roles: catalog.fields.reduce((total, field) => total + field.career_paths.length, 0),
    scholarships: catalog.fields.reduce((total, field) => total + (field.scholarships?.length || 0), 0),
    internships: catalog.fields.reduce((total, field) => total + (field.internships?.length || 0), 0),
    researchContacts: catalog.fields.reduce((total, field) => total + (field.research_contacts?.length || 0), 0),
  };
  return { sourcePath, outputPath, counts };
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  const result = await syncCareerCatalog();
  console.log(`Synced career catalog fallback: ${result.counts.fields} fields, ${result.counts.roles} roles.`);
}

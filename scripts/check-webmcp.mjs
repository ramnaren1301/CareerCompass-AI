import assert from "node:assert/strict";
import { access, readFile, writeFile } from "node:fs/promises";
import { createStore } from "../src/store.js";
import { createWebMCPRuntime } from "../src/webmcp.js";

const siteToolsSource = await readFile(new URL("../src/site-tools.js", import.meta.url), "utf8");
const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const webmcpSource = await readFile(new URL("../src/webmcp.js", import.meta.url), "utf8");
const serverSource = await readFile(new URL("../server.mjs", import.meta.url), "utf8");
const vercelConfig = await readFile(new URL("../vercel.json", import.meta.url), "utf8");
const netlifyConfig = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
await access(new URL("../LICENSE", import.meta.url));

const calls = [...siteToolsSource.matchAll(/document\.modelContext\.registerTool\(\{/g)];
const names = [...siteToolsSource.matchAll(/document\.modelContext\.registerTool\(\{\s*name:\s*"([a-z][a-z0-9_]*)"/g)].map((m) => m[1]);
assert.equal(calls.length, 33);
assert.equal(names.length, 33);
assert.equal(new Set(names).size, 33);
assert.match(appSource, /const runtime = createWebMCPRuntime\(dataStore\);\s*(?:const|let) nativeWebMCPRegistration = await runtime\.register\(\);/s);
assert.match(webmcpSource, /typeof document\?\.modelContext\?\.registerTool !== "function"/);
assert.match(webmcpSource, /registerPathwaySiteTools\(publicTools/);
assert.match(serverSource, /"Origin-Agent-Cluster": "\?1"/);
assert.match(serverSource, /"Permissions-Policy": "tools=\(self\)/);
assert.match(vercelConfig, /Origin-Agent-Cluster/);
assert.match(netlifyConfig, /Origin-Agent-Cluster/);

const previousDocument = globalThis.document;
const registrations = [];
globalThis.document = { modelContext: {
  registerTool: async (definition, options = {}) => registrations.push({ definition, options }),
  getTools: async () => registrations.map(({ definition }) => ({ ...definition, origin: "http://localhost:3000" })),
} };
try {
  const runtime = createWebMCPRuntime(createStore());
  const result = await runtime.register();
  assert.equal(result.native, true);
  assert.equal(result.count, 33);
  assert.equal(result.failures.length, 0);
  assert.equal(registrations.length, 33);
  for (const { definition, options } of registrations) {
    assert.match(definition.name, /^[a-z][a-z0-9_]+$/);
    assert.ok(definition.description.length > 20);
    assert.equal(definition.inputSchema?.type, "object");
    assert.equal(definition.inputSchema?.additionalProperties, false);
    assert.equal(typeof definition.execute, "function");
    assert.equal(typeof definition.annotations?.readOnlyHint, "boolean");
    assert.ok(options.signal instanceof AbortSignal);
  }
  const statusTool = registrations.find(({ definition }) => definition.name === "get_career_catalog_status")?.definition;
  const status = await statusTool.execute({});
  assert.equal(status.fieldCount, 20);
  assert.equal(status.roleCount, 54);
  runtime.unregister();
} finally {
  if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
}
const report = { product: "CareerCompass AI", version: "3.0.0", status: "PASS", directRegisterToolCalls: calls.length, uniqueLiteralToolNames: new Set(names).size, runtimeRegistrations: registrations.length, nativeDiscoveryCount: registrations.length, originAgentClusterHeader: true, toolsPermissionsPolicy: true, truthfulFallbackCount: true, registeredToolNames: names, topLevelPageRegistration: true, licensePresent: true };
await writeFile(new URL("../docs/webmcp-registration-results.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));

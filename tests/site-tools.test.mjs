import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createStore } from "../src/store.js";
import { createWebMCPRuntime } from "../src/webmcp.js";

test("repository contains 33 direct imperative document.modelContext.registerTool calls", async () => {
  const source = await readFile(new URL("../src/site-tools.js", import.meta.url), "utf8");
  const calls = [...source.matchAll(/document\.modelContext\.registerTool\(\{/g)];
  const names = [...source.matchAll(/document\.modelContext\.registerTool\(\{\s*name:\s*"([a-z][a-z0-9_]*)"/g)].map((m) => m[1]);
  assert.equal(calls.length, 33);
  assert.equal(names.length, 33);
  assert.equal(new Set(names).size, 33);
  assert.ok(names.includes("list_career_fields"));
  assert.ok(names.includes("simulate_degree_plan"));
  assert.ok(names.includes("find_internships"));
  assert.ok(names.includes("build_personalized_pathway"));
});

test("native registration sends complete executable tool objects to document.modelContext", async () => {
  const previousDocument = globalThis.document;
  const registrations = [];
  globalThis.document = { modelContext: {
    registerTool: async (definition, options) => registrations.push({ definition, options }),
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
      assert.equal(typeof definition.name, "string");
      assert.equal(typeof definition.description, "string");
      assert.equal(definition.inputSchema.type, "object");
      assert.equal(typeof definition.execute, "function");
      assert.ok(options.signal instanceof AbortSignal);
    }
    const statusTool = registrations.find(({ definition }) => definition.name === "get_career_catalog_status")?.definition;
    const invocationController = new AbortController();
    const status = await statusTool.execute({}, { signal: invocationController.signal });
    assert.equal(status.fieldCount, 20);
    assert.equal(status.roleCount, 54);
    runtime.unregister();
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});

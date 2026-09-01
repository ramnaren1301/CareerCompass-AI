import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createStore } from "../src/store.js";
import { createWebMCPRuntime } from "../src/webmcp.js";

test("hosting opts the document into an origin-keyed agent cluster and tools permission", async () => {
  const server = await readFile(new URL("../server.mjs", import.meta.url), "utf8");
  const headers = await readFile(new URL("../_headers", import.meta.url), "utf8");
  assert.match(server, /Origin-Agent-Cluster/);
  assert.match(server, /tools=\(self\)/);
  assert.match(headers, /Origin-Agent-Cluster: \?1/);
  assert.match(headers, /Permissions-Policy: tools=\(self\)/);
});

test("non-WebMCP browsers truthfully report zero native tools", async () => {
  const previousDocument = globalThis.document;
  globalThis.document = {};
  try {
    const store = createStore();
    const runtime = createWebMCPRuntime(store);
    const result = await runtime.register();
    assert.equal(result.native, false);
    assert.equal(result.status, "api_unavailable");
    assert.equal(result.count, 0);
    assert.equal(store.getState().registeredToolCount, 0);
    assert.equal(store.getState().webMCPStatus, "api_unavailable");
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});

test("native registration is only green after getTools discovers all 33 tools", async () => {
  const previousDocument = globalThis.document;
  const registrations = [];
  globalThis.document = { modelContext: {
    registerTool: async (definition) => registrations.push(definition),
    getTools: async () => registrations.map((definition) => ({ ...definition, origin: "http://localhost:3000" })),
  } };
  try {
    const store = createStore();
    const runtime = createWebMCPRuntime(store);
    const result = await runtime.register();
    assert.equal(result.native, true);
    assert.equal(result.count, 33);
    assert.equal(result.discovered.length, 33);
    assert.equal(store.getState().webMCPStatus, "registered");
    assert.equal(store.getState().registeredToolCount, 33);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});

test("registration succeeds but missing Chrome discovery is reported as partial", async () => {
  const previousDocument = globalThis.document;
  const registrations = [];
  globalThis.document = { modelContext: {
    registerTool: async (definition) => registrations.push(definition),
    getTools: async () => [],
  } };
  try {
    const store = createStore();
    const runtime = createWebMCPRuntime(store);
    const result = await runtime.register();
    assert.equal(result.native, false);
    assert.equal(result.status, "partial");
    assert.equal(result.count, 0);
    assert.match(result.failures.at(-1).error, /discovered 0 of 33/i);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
  }
});

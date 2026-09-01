import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createStore } from "../src/store.js";

test("the production entry point is the continuous career-buddy journey", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(app, /from "\.\/buddy-journey\.js"/);
  assert.match(app, /class="conversation-workspace"/);
  assert.match(app, /class="journey-trail"/);
  assert.match(app, /Future steps stay hidden until your current choice makes them relevant/);
  assert.match(app, /One decision at a time/);
  assert.match(app, /data-action="choose-career-group"/);
  assert.match(app, /class="selection-footer"/);
  assert.doesNotMatch(app, /id="buddy-input"/);
  assert.doesNotMatch(app, /id="buddy-form"/);
  assert.doesNotMatch(html, /Become a Machine Learning Engineer by graduation/);
  assert.match(html, /PathwayOS — Your Career Buddy/);
});

test("the journey progressively reveals one active step and keeps agent activity secondary", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(app, /switch \(journey\.currentStep\)/);
  assert.match(app, /renderActiveStep\(\)/);
  assert.match(app, /data-action="toggle-activity"/);
  assert.match(app, /Future steps stay hidden/);
  assert.match(app, /Browse all \$\{counts\.fields\} supported fields/);
  assert.doesNotMatch(app, /root\.addEventListener\("submit"/);
  assert.doesNotMatch(app, /renderOverview\(state/);
});

test("old dashboard state does not force a default ML career", () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    matchMedia: () => ({ matches: true }),
    localStorage: {
      getItem: (key) => key === "pathwayos-demo-state-v5" ? JSON.stringify({ profileGoal: "ML Engineer", profileCareerTopic: "AI/ML" }) : null,
      setItem: () => {},
      removeItem: () => {},
    },
  };
  try {
    const store = createStore();
    assert.equal(store.getState().profileGoal, "");
    assert.equal(store.getState().profileCareerTopic, "");
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("offline caching uses the continuous career-buddy assets", async () => {
  const serviceWorker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");
  assert.match(serviceWorker, /pathwayos-v7-selection-first-career-buddy/);
  assert.match(serviceWorker, /\/src\/buddy-journey\.js/);
  assert.doesNotMatch(serviceWorker, /\/src\/chat-intents\.js/);
});

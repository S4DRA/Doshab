import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import postcss from "postcss";
import { interactionModule } from "./helpers/interaction-module.mjs";

const raw = JSON.parse(readFileSync("lib/interaction/tokens.json", "utf8"));
const { validateInteractionTokens } = interactionModule("lib/interaction/validation.ts");
const recipes = interactionModule("lib/interaction/recipes.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

test("canonical values carry units and provenance; all five families resolve thirteen semantic properties", () => {
  const tokens = validateInteractionTokens(raw);
  for (const [name, family] of Object.entries(tokens.material)) {
    assert.equal(Object.keys(family.properties).length, 13);
    assert.equal(family.properties.mass, name);
    assert.equal(family.properties.soundRole, "none");
    assert.equal(family.properties.hapticRole, "none");
  }
  assert.notEqual(tokens.values["motion.response.dashboardState"].value, tokens.values["motion.response.sharedState"].value);
});

test("invalid units, values, status, extra fields, missing properties and bad inheritance fail closed", () => {
  const cases = [
    (data) => { data.values["motion.response.dashboardState"].unit = "seconds"; },
    (data) => { data.values["motion.response.dashboardState"].value = -1; },
    (data) => { data.values["motion.response.dashboardState"].value = Infinity; },
    (data) => { data.values["motion.response.dashboardState"].value = "150"; },
    (data) => { data.values["motion.response.dashboardState"].status = "APPROVED"; },
    (data) => { data.values["motion.response.dashboardState"].source = ""; },
    (data) => { data.values["motion.response.dashboardState"].extra = true; },
    (data) => { delete data.material.STANDARD.properties.snap; },
    (data) => { data.material.LIGHT.properties.mass = "HEAVY"; },
    (data) => { data.material.LIGHT.properties.friction = "timer-delay"; },
    (data) => { data.material.LIGHT.extends = "LIGHT"; },
    (data) => { data.material.STANDARD.extends = "STANDARD"; },
    (data) => { delete data.material.HEAVY; },
    (data) => { data.feedback.soundRole.value = ["play-every-tap"]; },
  ];
  for (const mutate of cases) {
    const data = structuredClone(raw);
    mutate(data);
    assert.throws(() => validateInteractionTokens(data));
  }
});

test("inheritance preserves defaults while consequence-specific policies stay distinct", () => {
  const light = recipes.resolveMaterial("LIGHT");
  const critical = recipes.resolveMaterial("CRITICAL");
  assert.equal(light.properties.friction, "minimal");
  assert.equal(light.properties.activationThreshold, "native-click");
  assert.equal(critical.properties.activationThreshold, "explicit-confirmation");
  assert.equal(critical.properties.momentum, "none");
  light.properties.friction = "confirm";
  assert.equal(recipes.resolveMaterial("LIGHT").properties.friction, "minimal");
});

test("standard press/release resolve the exact dashboard baseline; future recipes do not invent timings", () => {
  for (const name of ["control.standard", "state.press", "state.release"]) {
    const recipe = recipes.resolveRecipe(name);
    assert.equal(recipe.response.duration.value, raw.values["motion.response.dashboardState"].value);
    assert.equal(recipe.response.easing.value, raw.values["motion.response.controlEasing"].value);
    assert.equal(recipe.activation, "native-click");
    assert.equal(recipe.reducedMotion, null);
  }
  for (const name of ["control.light", "surface.structural"]) {
    assert.equal(recipes.resolveRecipe(name).response, null);
    assert.equal(recipes.resolveRecipe(name).status, "PROPOSED_UNCALIBRATED");
  }
});

test("reduced alternatives preserve action meaning and make explicit JS scrolling immediate", () => {
  const reduced = recipes.resolveRecipe("control.standard", { reducedMotion: true });
  assert.equal(reduced.activation, "native-click");
  assert.equal(reduced.reducedMotion.transition, "none");
  assert.equal(reduced.reducedMotion.transform, "none");
  assert.equal(reduced.reducedMotion.directManipulation, "track");
  assert.equal(recipes.resolveInteractionScrollBehavior({ reducedMotion: true }, "smooth"), "auto");
  assert.equal(recipes.resolveInteractionScrollBehavior({ reducedMotion: false }, "smooth"), "smooth");
  assert.equal(recipes.resolveInteractionScrollBehavior({ reducedMotion: false }, "instant"), "instant");
});

test("CSS bridge uses canonical units; proposed response values cannot silently ship", () => {
  const style = recipes.getControlInteractionStyle("control.standard");
  assert.equal(style["--interaction-state-duration"], `${raw.values["motion.response.dashboardState"].value}ms`);
  assert.equal(style["--interaction-state-easing"], raw.values["motion.response.controlEasing"].value);
  for (const name of ["motion.response.dashboardState", "motion.response.controlEasing"]) {
    const proposed = structuredClone(raw);
    proposed.values[name].status = "PROPOSED_UNCALIBRATED";
    const isolated = interactionModule("lib/interaction/recipes.ts", { mocks: { "./tokens.json": proposed } });
    assert.throws(() => isolated.getControlInteractionStyle("control.standard"));
  }
});

test("preferences are SSR-safe and subscriptions report live changes then clean up", () => {
  const server = interactionModule("lib/interaction/preferences.ts");
  assert.equal(server.readInteractionPreferences().reducedMotion, false);
  assert.doesNotThrow(server.subscribeInteractionPreferences(() => assert.fail("No browser callback")));
  const listeners = new Set();
  const media = { matches: false, addEventListener: (type, fn) => { assert.equal(type, "change"); listeners.add(fn); }, removeEventListener: (type, fn) => listeners.delete(fn) };
  const client = interactionModule("lib/interaction/preferences.ts", { globals: { window: { matchMedia: (query) => { assert.equal(query, "(prefers-reduced-motion: reduce)"); return media; } } } });
  const changes = [];
  const unsubscribe = client.subscribeInteractionPreferences((value) => changes.push(value.reducedMotion));
  assert.equal(client.readInteractionPreferences().reducedMotion, false);
  media.matches = true;
  for (const listener of listeners) listener();
  assert.equal(client.readInteractionPreferences().reducedMotion, true);
  media.matches = false;
  for (const listener of listeners) listener();
  unsubscribe();
  assert.deepEqual(changes, [true, false]);
  assert.equal(listeners.size, 0);
});

test("feedback is safe without platform APIs and never reads, mutates or retains event data", () => {
  const { emitInteractionFeedback } = interactionModule("lib/interaction/feedback.ts", { globals: {
    console: { log: () => assert.fail("No logging") }, setTimeout: () => assert.fail("No scheduling"),
  } });
  const event = new Proxy({}, { get: () => assert.fail("No event data reads"), set: () => assert.fail("No event mutation") });
  assert.equal(emitInteractionFeedback(event), undefined);
  assert.equal(emitInteractionFeedback(event), undefined);
});

test("only the Start message button opts in; its native click updates local chooser state immediately", () => {
  const updates = [];
  let hook = 0;
  const { MessagesPageClient } = interactionModule("components/messages/messages-page-client.tsx", { mocks: {
    react: { useState: (initial) => { const slot = hook++; return [initial, (value) => updates.push({ slot, value })]; }, useCallback: (fn) => fn, useDeferredValue: (value) => value, useMemo: (fn) => fn(), useEffect: () => {} },
    "@/components/layout/val-page-hero": { ValPageHero: "test-hero" }, "next/link": "a",
    "@/components/ui/avatar-initials": {}, "@/lib/e2ee-message.client": {}, "@/lib/e2ee-message": {}, "@/lib/utils": {},
    "@/components/ui/dialog-surface": {}, "@/lib/interaction/recipes": recipes, "@/app/interaction-physics.css": {},
  } });
  const tree = MessagesPageClient({ friends: [], threads: [] });
  const elements = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object" || !node.props) return;
    elements.push(node); walk(node.props.children); walk(node.props.actions);
  }
  walk(tree);
  const migrated = elements.filter((node) => node.props["data-interaction-recipe"]);
  assert.equal(migrated.length, 1);
  const button = migrated[0];
  assert.equal(button.type, "button");
  assert.equal(button.props.type, "button");
  assert.equal(button.props.className, "app-button-primary val-action");
  assert.equal(button.props.children, "Start message +");
  assert.equal(button.props.disabled, undefined);
  assert.equal(button.props.onPointerDown, undefined);
  assert.equal(button.props.onKeyDown, undefined);
  assert.deepEqual(plain(button.props.style), plain(recipes.getControlInteractionStyle("control.standard")));
  button.props.onClick();
  assert.deepEqual(updates, [{ slot: 0, value: true }]);
});

test("stylesheet is imported once and every rule is opt-in, with no new layout or visual declarations", () => {
  const consumer = readFileSync("components/messages/messages-page-client.tsx", "utf8");
  assert.equal(consumer.split('import "@/app/interaction-physics.css"').length - 1, 1);
  const css = postcss.parse(readFileSync("app/interaction-physics.css", "utf8"));
  css.walkRules((rule) => assert.match(rule.selector, /button\.app-button-primary\[data-interaction-recipe="control.standard"\]/));
  css.walkDecls((decl) => {
    assert.ok(["transition", "transition-duration", "transition-timing-function", "transform"].includes(decl.prop));
    assert.match(decl.value, /^var\(--interaction-/);
    assert.equal(decl.important, true);
    if (decl.prop === "transform" || decl.prop === "transition") assert.equal(decl.parent.parent.params, "(prefers-reduced-motion: reduce)");
  });
});

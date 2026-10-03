import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../lib/chat-presentation.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(code, { exports, URL });
const viewportCode = ts.transpileModule(readFileSync(new URL("../lib/viewport.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(viewportCode, { exports });
const segments = (value) => JSON.parse(JSON.stringify(exports.messageSegments(value)));

test("explicit web links preserve complete query strings and the surrounding text", () => {
  const source = "Try https://example.com/meet?room=a&next=%2Fchat then http://example.org:3000/";
  const result = segments(source);
  assert.equal(result.map(({ text }) => text).join(""), source);
  assert.deepEqual(result.filter(({ href }) => href).map(({ href }) => href), ["https://example.com/meet?room=a&next=%2Fchat", "http://example.org:3000/"]);
});
test("sentence punctuation is outside the link while balanced parentheses stay in it", () => {
  const source = "(https://example.com/a_(b)). See https://example.com/end!";
  const result = segments(source);
  assert.equal(result.map(({ text }) => text).join(""), source);
  assert.deepEqual(result.filter(({ href }) => href).map(({ text }) => text), ["https://example.com/a_(b)", "https://example.com/end"]);
});
test("unsafe schemes, credentials and malformed addresses remain inert text", () => {
  for (const source of ["javascript:alert(1)", "data:text/html,hi", "https://user:password@example.com/", "https://", "ordinary text"]) {
    const result = segments(source);
    assert.equal(result.map(({ text }) => text).join(""), source);
    assert.ok(result.every(({ href }) => !href));
  }
});

const phone = { width: 390, layoutHeight: 844, visibleHeight: 844, offsetTop: 0, scale: 1, editing: false, baseline: null };
test("iOS visual viewport keyboard and Android resized content both hide navigation", () => {
  const { baseline } = exports.resolveViewport(phone);
  const ios = exports.resolveViewport({ ...phone, baseline, editing: true, visibleHeight: 500, offsetTop: 24 });
  assert.equal(ios.keyboard, true);
  assert.equal(ios.top, 24);
  const android = exports.resolveViewport({ ...phone, baseline, editing: true, layoutHeight: 500, visibleHeight: 500 });
  assert.equal(android.keyboard, true);
  assert.equal(android.height, 500);
});
test("rotation resets the baseline and returning from a keyboard restores navigation", () => {
  const { baseline } = exports.resolveViewport(phone);
  const rotated = exports.resolveViewport({ ...phone, baseline, editing: true, width: 844, layoutHeight: 390, visibleHeight: 390 });
  assert.equal(rotated.keyboard, false);
  assert.equal(rotated.baseline.height, 390);
  const restored = exports.resolveViewport({ ...phone, baseline, editing: true });
  assert.equal(restored.keyboard, false);
  assert.equal(restored.height, 844);
});
test("pinch zoom leaves the application geometry under user control", () => {
  assert.equal(exports.resolveViewport({ ...phone, scale: 1.5, visibleHeight: 562 }), null);
});

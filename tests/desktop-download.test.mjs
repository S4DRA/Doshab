import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";

const require = createRequire(path.resolve(process.env.VAL_TEST_DEPENDENCIES || ".", "package.json"));
const ts = require("typescript");
function load(file, globals = {}, mocks = {}) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, URL, Response, AbortSignal, ...globals, require: name => mocks[name] || require(name) });
  return loadedModule.exports;
}
function release(overrides = {}) {
  return { draft: false, prerelease: false, tag_name: "v0.1.6", assets: ["VAL-Setup-0.1.6.exe", "VAL-Setup-0.1.6.exe.blockmap", "latest.yml"].map((name) => ({ name, state: "uploaded", size: 114017989, browser_download_url: `https://github.com/S4DRA/Doshab/releases/download/v0.1.6/${name}` })), ...overrides };
}
const { parseWindowsRelease } = load("lib/desktop-download.ts");

test("published stable installer resolves to the versioned VAL release asset", () => {
  const parsed = parseWindowsRelease(release());
  assert.equal(parsed.version, "0.1.6");
  assert.equal(parsed.size, 114017989);
  assert.equal(parsed.downloadUrl, release().assets[0].browser_download_url);
});

test("drafts, prereleases and unrecognized tags cannot become public downloads", () => {
  for (const value of [null, {}, release({ draft: true }), release({ prerelease: true }), release({ tag_name: "v0.1.6-beta.1" }), release({ tag_name: "v0.1.6/../../other" }), release({ tag_name: "something" })]) assert.equal(parseWindowsRelease(value), null);
});

test("only complete assets with an exact repository, version, filename and HTTPS URL are accepted", () => {
  for (const changes of [{ size: 0 }, { size: -1 }, { size: "114" }, { size: Infinity }, { state: "new" }, { name: "other.exe" }, { browser_download_url: "https://example.com/VAL.exe" }, { browser_download_url: "http://github.com/S4DRA/Doshab/releases/download/v0.1.6/VAL-Setup-0.1.6.exe" }, { browser_download_url: "https://github.com/other/Doshab/releases/download/v0.1.6/VAL-Setup-0.1.6.exe" }, { browser_download_url: release().assets[0].browser_download_url + "?redirect=evil" }]) {
    assert.equal(parseWindowsRelease(release({ assets: [{ ...release().assets[0], ...changes }] })), null);
  }
  assert.equal(parseWindowsRelease(release({ assets: [] })), null);
});

test("lookup uses a bounded request and cached public metadata without authentication", async () => {
  const { getWindowsRelease } = load("lib/desktop-download.ts", { fetch: async (url, options) => {
    assert.equal(url, "https://api.github.com/repos/S4DRA/Doshab/releases/latest");
    assert.equal(options.next.revalidate, 300);
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.Authorization, undefined);
    return Response.json(release());
  } });
  assert.equal((await getWindowsRelease()).version, "0.1.6");
});

test("missing releases, rate limits, invalid JSON and network failures remain usable unavailable states", async () => {
  for (const fetch of [async () => new Response(null, { status: 404 }), async () => new Response(null, { status: 403 }), async () => new Response("not json"), async () => { throw new Error("offline"); }]) {
    assert.equal(await load("lib/desktop-download.ts", { fetch }).getWindowsRelease(), null);
  }
});

test("download redirects use the current asset and recover gracefully when it disappears", async () => {
  for (const available of [true, false]) {
    const { GET } = load("app/download/windows/route.ts", {}, { "@/lib/desktop-download": { getWindowsRelease: async (fresh) => { assert.equal(fresh, true); return available ? parseWindowsRelease(release()) : null; } } });
    const response = await GET(new Request("https://doshab.vercel.app/download/windows"));
    assert.equal(response.status, available ? 307 : 303);
    assert.equal(response.headers.get("Location"), available ? release().assets[0].browser_download_url : "https://doshab.vercel.app/download?unavailable=1");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
});

test("partial releases cannot replace the website installer link", () => {
  for (const name of ["latest.yml", "VAL-Setup-0.1.6.exe.blockmap"]) {
    assert.equal(parseWindowsRelease(release({ assets: release().assets.filter((asset) => asset.name !== name) })), null);
  }
});

test("download clicks bypass the displayed release metadata cache", async () => {
  const { getWindowsRelease } = load("lib/desktop-download.ts", { fetch: async (_url, options) => {
    assert.equal(options.cache, "no-store"); assert.equal(options.next, undefined); return Response.json(release());
  } });
  assert.equal((await getWindowsRelease(true)).version, "0.1.6");
});

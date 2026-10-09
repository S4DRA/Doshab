import assert from "node:assert/strict";
import { test } from "node:test";
import { interactionModule } from "./helpers/interaction-module.mjs";

const artwork = interactionModule("lib/sidebar-artwork.ts", { globals: { URL } });

test("personal artwork accepts images and rejects executable, transient or credential-bearing URLs", () => {
  for (const source of ["javascript:alert(1)", "data:text/html;base64,PHNjcmlwdD4=", "blob:temporary", "//another-site/image.png", "/\\another-site/image.png", "https://user:password@example.test/image.png"]) {
    assert.equal(artwork.normalizeSidebarArtworkImage(source), undefined);
  }
  assert.equal(artwork.normalizeSidebarArtworkImage(" https://example.test/image.png "), "https://example.test/image.png");
  assert.equal(artwork.normalizeSidebarArtworkImage("/brand/val-lunar.webp"), "/brand/val-lunar.webp");
  assert.equal(artwork.normalizeSidebarArtworkImage("data:image/png;base64,YQ=="), "data:image/png;base64,YQ==");
  assert.equal(artwork.normalizeSidebarArtworkImage("data:image/png;base64," + "YQ==".repeat(100000)), undefined);
});

test("corrupt saved artwork reports an error while preserving the other valid personal image", () => {
  const read = artwork.readSidebarArtwork(JSON.stringify({ navigation: "javascript:alert(1)", people: "/brand/val-lunar.webp", space: "not-a-personal-preference" }));
  assert.ok(read.error);
  assert.equal(read.images.navigation, null);
  assert.equal(read.images.people, "/brand/val-lunar.webp");
  assert.equal(Object.hasOwn(read.images, "space"), false);
  assert.ok(artwork.readSidebarArtwork("{broken").error);
  assert.equal(artwork.readSidebarArtwork(null).error, null);
});

function preferencesHarness() {
  const saved = new Map();
  const changes = [];
  let account = "first-account";
  let failWrite = false;
  const window = {
    localStorage: {
      getItem: key => saved.get(key) ?? null,
      setItem(key, value) {
        if (failWrite) throw new Error("Quota exceeded");
        saved.set(key, value);
      },
    },
    dispatchEvent: event => changes.push(event),
  };
  const moduleExports = interactionModule("components/profile/sidebar-artwork-preferences.tsx", {
    globals: { window, URL, CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail; } } },
    mocks: {
      react: { useCallback: callback => callback, useMemo: calculate => calculate(), useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() },
      "@/components/layout/dashboard-people-provider": { useDashboardPeople: () => ({ currentUserId: account }) },
      "@/lib/sidebar-artwork": artwork,
    },
  });
  return { saved, changes, preferences: moduleExports.useSidebarArtworkPreferences, setAccount: value => { account = value; }, failWrites: () => { failWrite = true; } };
}

test("changing one personal image preserves the newest other image and restoring is independent", () => {
  const harness = preferencesHarness();
  const firstView = harness.preferences();
  const secondView = harness.preferences();
  assert.equal(firstView.update("navigation", "/first.png"), null);
  assert.equal(secondView.update("people", "/second.png"), null);
  assert.equal(harness.preferences().images.navigation, "/first.png");
  assert.equal(harness.preferences().images.people, "/second.png");
  assert.equal(firstView.update("navigation", null), null);
  assert.equal(harness.preferences().images.navigation, null);
  assert.equal(harness.preferences().images.people, "/second.png");
});

test("personal image preferences are isolated by authenticated account", () => {
  const harness = preferencesHarness();
  harness.preferences().update("people", "/first-account.png");
  harness.setAccount("second-account");
  assert.equal(harness.preferences().images.people, null);
  harness.preferences().update("people", "/second-account.png");
  harness.setAccount("first-account");
  assert.equal(harness.preferences().images.people, "/first-account.png");
});

test("failed storage preserves the saved image and does not announce a successful change", () => {
  const harness = preferencesHarness();
  harness.preferences().update("navigation", "/saved.png");
  const changeCount = harness.changes.length;
  harness.failWrites();
  assert.match(harness.preferences().update("navigation", "/unsaved.png"), /could not save/);
  assert.equal(harness.preferences().images.navigation, "/saved.png");
  assert.equal(harness.changes.length, changeCount);
});

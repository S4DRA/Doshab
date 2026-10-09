import assert from "node:assert/strict";
import { test } from "node:test";
import { interactionModule } from "./helpers/interaction-module.mjs";

const uploads = interactionModule("lib/image-upload.ts");
const adjustment = interactionModule("lib/image-adjustment.ts");
const themes = interactionModule("lib/themes.ts");

test("settings images accept exactly 2 MB and reject larger or non-image files", () => {
  assert.equal(uploads.settingsImageError({ size: 2 * 1024 * 1024, type: "image/png" }), null);
  assert.match(uploads.settingsImageError({ size: 2 * 1024 * 1024 + 1, type: "image/png" }), /2 MB/);
  assert.ok(uploads.settingsImageError({ size: 100, type: "text/html" }));
  assert.ok(uploads.settingsImageError({ size: 0, type: "image/png" }));
});

test("crop positions and zoom stay inside wide and tall source images", () => {
  for (const [width, height] of [[1600, 900], [900, 1600]]) {
    for (const ratio of [1, 16 / 9, width / height]) {
      for (const position of [{ zoom: 1, x: 50, y: 50 }, { zoom: 3, x: 100, y: 0 }, { zoom: 9, x: -50, y: 200 }]) {
        const crop = adjustment.imageCrop(width, height, ratio, position);
        assert.ok(crop.x >= 0 && crop.y >= 0);
        assert.ok(crop.x + crop.width <= width + 0.001 && crop.y + crop.height <= height + 0.001);
        assert.ok(Math.abs(crop.width / crop.height - ratio) < 0.001);
      }
    }
  }
  const centered = adjustment.imageCrop(1600, 900, 1, { zoom: 1, x: 50, y: 50 });
  assert.equal(centered.x, 350);
  assert.equal(centered.width, 900);
});

test("adjusted encoding reduces oversized output and never returns an oversized blob", async () => {
  let attempts = 0;
  const drawn = [];
  const context = { clearRect() {}, drawImage: (...args) => drawn.push(args) };
  const canvas = { getContext: () => context, toBlob: callback => callback({ size: ++attempts === 1 ? 500000 : 100000 }) };
  const subject = interactionModule("lib/image-adjustment.ts", { globals: { document: { createElement: () => canvas } } });
  const output = await subject.renderAdjustedImage({ naturalWidth: 1600, naturalHeight: 900 }, 1, { zoom: 2, x: 100, y: 100 }, 256 * 1024);
  assert.equal(output.size, 100000);
  assert.equal(attempts, 2);
  assert.ok(drawn[1][7] < drawn[0][7]);
  canvas.toBlob = callback => callback({ size: 500000 });
  await assert.rejects(subject.renderAdjustedImage({ naturalWidth: 1600, naturalHeight: 900 }, 1, { zoom: 1, x: 50, y: 50 }, 256 * 1024), /size limit/);
});

function luminance(hex) {
  const c = hex.slice(1).match(/.{2}/g).map(h => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}

test("ten distinct palettes retain both modes and readable action text", () => {
  assert.equal(themes.DOSHAB_PALETTES.length, 10);
  assert.equal(new Set(themes.DOSHAB_PALETTES.map(p => p.id)).size, 10);
  assert.equal(new Set(themes.DOSHAB_PALETTES.map(p => themes.getValThemeAccent(`${p.id}-dark`).accent)).size, 10);
  for (const theme of themes.DOSHAB_THEMES) {
    const { accent, text } = themes.getValThemeAccent(theme.id);
    const a = luminance(accent), b = luminance(text);
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5, theme.id);
    assert.equal(themes.resolveDoshabThemeId(theme.id), theme.id);
  }
  assert.equal(themes.getValThemeAccent("signal-orange-dark").accent, "#ff5a1f");
});

test("fullscreen starts through the user-selected element and only exits its own view", async () => {
  let requests = 0, exits = 0;
  const container = { requestFullscreen: async () => { requests++; } };
  const document = { fullscreenEnabled: true, fullscreenElement: null, exitFullscreen: async () => { exits++; } };
  const fullscreen = interactionModule("lib/media/fullscreen.ts", { globals: { document } });
  await fullscreen.enterMediaFullscreen(container, null);
  assert.equal(requests, 1);
  document.fullscreenElement = {};
  await fullscreen.exitMediaFullscreen(container);
  assert.equal(exits, 0);
  document.fullscreenElement = container;
  await fullscreen.exitMediaFullscreen(container);
  assert.equal(exits, 1);
  document.fullscreenEnabled = false;
  let native = 0;
  await fullscreen.enterMediaFullscreen(container, { webkitEnterFullscreen: () => { native++; } });
  assert.equal(native, 1);
  await assert.rejects(fullscreen.enterMediaFullscreen(container, null), /unavailable/);
});

test("profile endpoint enforces the 2 MB boundary before writing", async () => {
  const writes = [];
  const route = interactionModule("app/api/profile/route.ts", {
    globals: { File, Buffer, URL },
    mocks: {
      "next/server": { NextResponse: { redirect: url => ({ url: String(url) }) } },
      "@/lib/auth": { getCurrentUser: async () => ({ id: "qa-user", image: null }) },
      "@/lib/prisma": { prisma: { user: { update: async data => writes.push(data) } } },
      "@/lib/image-upload": uploads,
    },
  });
  async function submit(size) {
    const data = new FormData();
    data.set("name", "QA User"); data.set("status", "ONLINE");
    data.set("profileImage", new File([new Uint8Array(size)], "qa.png", { type: "image/png" }));
    return route.POST({ url: "https://val.example/api/profile", formData: async () => data });
  }
  assert.match((await submit(2 * 1024 * 1024 + 1)).url, /error=/);
  assert.equal(writes.length, 0);
  assert.match((await submit(2 * 1024 * 1024)).url, /message=/);
  assert.equal(writes.length, 1);
  assert.match(writes[0].data.image, /^data:image\/png;base64,/);
});

test("Space images use durable existing storage and retain server role enforcement", async () => {
  const writes = [];
  let allowed = true;
  const route = interactionModule("app/api/groups/[groupId]/settings/route.ts", {
    globals: { File, Buffer, URL },
    mocks: {
      "next/server": { NextResponse: { redirect: url => ({ url: String(url) }) } },
      "@/lib/image-upload": uploads,
      "@/lib/prisma": { prisma: { group: { update: async data => writes.push(data) } } },
      "@/lib/security/permissions": {
        requireAuth: async () => ({ id: "qa-user" }),
        requireGroupRole: async () => { if (!allowed) throw new Error("Denied"); return { group: { isDirectMessage: false } }; },
        auditSecurityEvent: async () => {}, SecurityError: class extends Error {},
      },
    },
  });
  const data = new FormData();
  data.set("name", "QA Space"); data.set("image", "");
  data.set("imageUpload", new File(["qa-image"], "qa.png", { type: "image/png" }));
  const request = { url: "https://val.example/api/groups/qa-space/settings", formData: async () => data };
  const params = { params: Promise.resolve({ groupId: "qa-space" }) };
  await route.POST(request, params);
  assert.equal(writes.length, 1);
  assert.match(writes[0].data.image, /^data:image\/png;base64,/);
  data.delete("imageUpload"); data.set("image", writes[0].data.image);
  await route.POST(request, params);
  assert.equal(writes.length, 2);
  allowed = false;
  assert.match((await route.POST(request, params)).url, /error=/);
  assert.equal(writes.length, 2);
});

test("camera and screen clicks each open their own enlarged view and closing preserves media", () => {
  const state = [];
  let cursor = 0;
  let stops = 0;
  const local = ["camera", "screen"].map(source => ({ kind: "video", source, track: { id: source, stop: () => { stops++; } } }));
  const views = interactionModule("lib/media/call-view.ts");
  const subject = interactionModule("components/calls/call-workspace.tsx", {
    mocks: {
      react: {
        useState(initial) { const index = cursor++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }]; },
        useMemo: compute => compute(), useRef: value => ({ current: value }), useEffect() {},
      },
      "next/link": { default: () => null },
      "@/components/music/music-button": {}, "@/components/ui/avatar-initials": {},
      "./persistent-call-provider": {}, "./use-push-to-talk": {},
      "./use-call-activity": { useCallActivity: () => ({ speakingIds: [], unavailable: false }) },
      "@/components/mobile/mobile-shell": { useMobileLayout: () => false },
      "@/components/ui/dialog-surface": {}, "@/lib/media/fullscreen": {}, "@/lib/media/call-view": views,
    },
  });
  const call = { activeCall: { id: "qa-room", participant: { id: "qa", name: "QA" }, kind: "group", title: "QA room" }, snapshot: { state: "connected", local, remote: [], participants: [], micMuted: true } };
  function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
  }
  function render() { cursor = 0; return elements(subject.CallWorkspace({ call })); }
  let tree = render();
  tree.find(e => e.type === "button" && e.props.children === "gallery").props.onClick();
  for (const source of ["camera", "screen"]) {
    tree = render();
    tree.find(e => e.props?.item?.source === source && e.props.onExpand).props.onExpand();
    const viewer = render().find(e => e.type?.name === "ExpandedMediaViewer");
    assert.equal(viewer.props.item.source, source);
    viewer.props.onClose();
    assert.equal(render().some(e => e.type?.name === "ExpandedMediaViewer"), false);
  }
  assert.equal(stops, 0);
  assert.equal(call.snapshot.local, local);
  render().find(e => e.props?.item?.source === "camera" && e.props.onExpand).props.onExpand();
  call.activeCall = { ...call.activeCall, id: "another-room" };
  assert.equal(render().some(e => e.type?.name === "ExpandedMediaViewer"), false);
  call.activeCall = { ...call.activeCall, id: "qa-room" };
  call.snapshot.local = local.map(item => ({ ...item, track: { id: `replacement-${item.source}` } }));
  assert.equal(render().some(e => e.type?.name === "ExpandedMediaViewer"), false);
});

test("reviewing and cancelling a replacement preserves the prepared native-form image", async () => {
  const hooks = [];
  let cursor = 0;
  const ImageAdjustmentDialog = () => null;
  const input = { files: [], form: { addEventListener() {}, removeEventListener() {} } };
  const subject = interactionModule("components/profile/settings-image-field.tsx", {
    globals: { File, DataTransfer: class { files = []; items = { add: file => this.files.push(file) }; } },
    mocks: {
      react: {
        useState(initial) { const index = cursor++; if (!(index in hooks)) hooks[index] = initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; },
        useRef(initial) { const index = cursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; }, useEffect() {},
      },
      "@/components/ui/image-adjustment-dialog": { ImageAdjustmentDialog },
      "@/lib/image-upload": uploads,
      "@/lib/image-adjustment": { imageDataUrl: async blob => `data:${blob.type};base64,cWE=` },
    },
  });
  function elements(node) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(elements);
    return [node, ...elements(node.props?.children)];
  }
  function render() {
    cursor = 0;
    const tree = elements(subject.SettingsImageField({ name: "profileImage", label: "Profile photo", currentImage: "/existing.png", square: true }));
    tree.find(e => e.props?.name === "profileImage").props.ref.current = input;
    return tree;
  }
  async function choose(file) {
    render().find(e => e.type === "input" && e.props.type === "file" && e.props.onChange).props.onChange({ target: { files: [file], value: file.name } });
    await new Promise(setImmediate);
  }
  await choose(new File(["first"], "first.png", { type: "image/png" }));
  assert.equal(input.files.length, 0);
  await render().find(e => e.type === ImageAdjustmentDialog).props.onApply(new Blob(["crop"], { type: "image/webp" }));
  const prepared = input.files[0];
  assert.equal(prepared.type, "image/webp");
  await choose(new File(["replacement"], "replacement.png", { type: "image/png" }));
  render().find(e => e.type === ImageAdjustmentDialog).props.onCancel();
  assert.equal(input.files[0], prepared);
  assert.equal(render().some(e => e.type === ImageAdjustmentDialog), false);
  await choose(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "oversized.png", { type: "image/png" }));
  assert.equal(input.files[0], prepared);
  assert.equal(render().some(e => e.type === ImageAdjustmentDialog), false);
});

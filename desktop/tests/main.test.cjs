const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function boot() {
  const windows = [];
  const handlers = new Map();
  const ipcListeners = new Map();
  const ses = new EventEmitter();
  ses.setPermissionCheckHandler = (fn) => { ses.check = fn; };
  ses.setPermissionRequestHandler = (fn) => { ses.permission = fn; };
  ses.setDisplayMediaRequestHandler = (fn) => { ses.capture = fn; };
  class Window extends EventEmitter {
    constructor(options) {
      super(); this.options = options; this.visible = false; this.destroyed = false;
      this.webContents = new EventEmitter();
      this.webContents.mainFrame = {};
      this.webContents.getURL = () => this.url;
      this.webContents.loadURL = (url) => this.loadURL(url);
      this.webContents.loadFile = (file) => this.loadFile(file);
      this.webContents.isDestroyed = () => this.destroyed;
      this.webContents.send = (channel, value) => { this.lastMessage = { channel, value }; };
      this.webContents.insertCSS = async (css) => { this.insertedCSS = css; };
      this.webContents.setWindowOpenHandler = (fn) => { this.webContents.open = fn; };
      this.contentView = { addChildView() {} };
      windows.push(this);
    }
    async loadURL(url) { this.url = url; this.webContents.mainFrame.url = url; }
    async loadFile(file) { this.url = `file://${file}`; }
    isDestroyed() { return this.destroyed; }
    show() { this.visible = true; }
    hide() { this.visible = false; }
    isMinimized() { return false; }
    isFullScreen() { return false; }
    isMaximized() { return !!this.maximized; }
    maximize() { this.maximized = true; this.emit('maximize'); }
    unmaximize() { this.maximized = false; this.emit('unmaximize'); }
    minimize() { this.minimized = true; }
    setFullScreen(value) { this.fullscreen = value; }
    getContentSize() { return [1280, 840]; }
    restore() {}
    focus() {}
    getMediaSourceId() { return 'window:picker'; }
    close() { this.destroyed = true; this.emit('closed'); }
  }
  const app = Object.assign(new EventEmitter(), { setAppUserModelId() {}, requestSingleInstanceLock: () => true, whenReady: async () => {}, getPath: () => '/tmp', quit() {}, isPackaged: true });
  const dialog = { response: 1, prompts: 0, async showMessageBox() { this.prompts++; return { response: this.response }; }, showErrorBox() {} };
  class Tray { setToolTip() {} setContextMenu() {} on() {} displayBalloon() {} }
  const external = [];
  const electron = {
    app, BrowserWindow: Window, Tray, dialog, Menu: { buildFromTemplate: (x) => x, setApplicationMenu(value) { this.value = value; } },
    shell: { openExternal: async (url) => external.push(url) }, session: { fromPartition: () => ses },
    desktopCapturer: { getSources: async () => [{ id: 'screen:1', name: '<untrusted title>', thumbnail: { toDataURL: () => 'data:image/png;base64,abc' } }] },
    ipcMain: { handle: (name, fn) => handlers.set(name, fn), removeHandler: (name) => handlers.delete(name), on: (name, fn) => ipcListeners.set(name, fn) }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../main.cjs'), 'utf8'), {
    require: (name) => {
      if (name === 'electron') return electron;
      if (name === './policy.cjs') return require('../policy.cjs');
      if (name === './persistent-login.cjs') return { createPersistentLogin: () => ({ restore: async () => ({ expired: false }), touch: async () => {}, flush: async () => {} }) };
      if (name === 'electron-updater') return { autoUpdater: {} };
      if (name === './updates.cjs') return { createUpdateController: () => ({ start() {}, stop() {} }) };
      return require(name);
    },
    __dirname: path.join(__dirname, '..'), process: { env: {}, versions: {} }, console, URL, setTimeout, clearTimeout
  });
  await new Promise(setImmediate);
  return { windows, page: windows[0].webContents, ses, dialog, handlers, external, menu: electron.Menu };
}

test('remote content uses an isolated control preload with sandboxing and background throttling', async () => {
  const { windows } = await boot();
  const prefs = windows[0].options.webPreferences;
  assert.equal(prefs.nodeIntegration, false);
  assert.equal(prefs.contextIsolation, true);
  assert.equal(prefs.sandbox, true);
  assert.equal(prefs.backgroundThrottling, true);
  assert.equal(prefs.v8CacheOptions, 'bypassHeatCheck');
  assert.equal(path.basename(prefs.preload), 'window-preload.cjs');
  assert.equal(prefs.devTools, false);
});
test('permission denied for other origins, other contents, and subframes', async () => {
  const { page, ses } = await boot();
  for (const details of [{ requestingUrl: 'https://evil.example', isMainFrame: true }, { requestingUrl: page.getURL(), isMainFrame: false }]) {
    let allowed;
    await ses.permission(page, 'media', (result) => { allowed = result; }, details);
    assert.equal(allowed, false);
  }
  assert.equal(ses.check({}, 'media', page.getURL()), false);
  assert.equal(ses.check(page, 'geolocation', page.getURL()), false);
});
test('microphone approval does not silently approve camera', async () => {
  const { page, ses, dialog } = await boot();
  const request = async (type) => {
    let allowed;
    await ses.permission(page, 'media', (result) => { allowed = result; }, { requestingUrl: page.getURL(), isMainFrame: true, mediaTypes: [type] });
    return allowed;
  };
  dialog.response = 0;
  assert.equal(await request('audio'), true);
  assert.equal(await request('audio'), true);
  assert.equal(dialog.prompts, 1);
  dialog.response = 1;
  assert.equal(await request('video'), false);
  assert.equal(dialog.prompts, 2);
});
test('capture requires a gesture and never silently selects the first screen', async () => {
  const { page, ses } = await boot();
  let result;
  ses.capture({ userGesture: false, frame: { url: page.getURL() } }, (value) => { result = value; });
  assert.equal(Object.keys(result).length, 0);
});
test('capture source IPC is restricted to the picker and audio is opt-in', async () => {
  const { windows, page, ses, handlers } = await boot();
  let result;
  ses.capture({ userGesture: true, frame: { url: page.getURL() }, audioRequested: true }, (value) => { result = value; });
  const picker = windows[1];
  try {
    await assert.rejects(handlers.get('val:share-sources')({ sender: windows[0].webContents }));
    const event = { sender: picker.webContents, senderFrame: picker.webContents.mainFrame };
    await handlers.get('val:share-sources')(event);
    assert.equal(result, undefined);
    handlers.get('val:share-select')(event, { id: 'screen:1', audio: false });
    assert.equal(result.video.id, 'screen:1');
    assert.equal(result.audio, undefined);
    assert.equal(handlers.has('val:share-select'), false);
    assert.equal(handlers.has('val:share-sources'), false);
  } finally { if (!picker.destroyed) picker.close(); }
});
test('closing the capture picker cancels exactly once and cleans handlers', async () => {
  const { windows, page, ses, handlers } = await boot();
  let calls = 0;
  ses.capture({ userGesture: true, frame: { url: page.getURL() } }, () => { calls++; });
  windows[1].close();
  assert.equal(calls, 1);
  assert.equal(handlers.has('val:share-select'), false);
  assert.equal(handlers.has('val:share-sources'), false);
});
test('navigation to a local protocol is blocked', async () => {
  const { page, external } = await boot();
  let prevented = false;
  page.emit('will-navigate', { preventDefault() { prevented = true; } }, 'file:///C:/test');
  assert.equal(prevented, true);
  assert.equal(external.length, 0);
});

test('frameless window uses the whole viewport with no extra title layer', async () => {
  const { windows: [window], menu } = await boot();
  assert.equal(window.options.frame, false);
  assert.equal(window.options.titleBarOverlay, undefined);
  assert.equal(menu.value, null);
});

test('custom window controls only accept the trusted main frame and known actions', async () => {
  const { windows: [window], page, handlers } = await boot();
  const action = handlers.get('val:window-action');
  const event = { sender: page, senderFrame: page.mainFrame };
  assert.throws(() => action({ sender: {}, senderFrame: page.mainFrame }, 'close'));
  assert.throws(() => action({ sender: page, senderFrame: { url: page.getURL() } }, 'close'));
  assert.throws(() => action(event, 'exec'));
  assert.equal(action(event, 'state').maximized, false);
  action(event, 'minimize');
  assert.equal(window.minimized, true);
  action(event, 'toggle-maximize');
  assert.equal(window.maximized, true);
  assert.equal(window.lastMessage.value.maximized, true);
  action(event, 'toggle-maximize');
  assert.equal(window.maximized, false);
  page.mainFrame.url = 'https://evil.example';
  assert.throws(() => action(event, 'close'));
});

test('F11 works without native menu and does not repeat while held', async () => {
  const { windows: [window], page } = await boot();
  let prevented = false;
  page.emit('before-input-event', { preventDefault() { prevented = true; } }, { type: 'keyDown', key: 'F11', isAutoRepeat: false });
  assert.equal(prevented, true);
  assert.equal(window.fullscreen, true);
});

test('desktop effects are applied to VAL after load without changing media elements', async () => {
  const { windows: [window], page } = await boot();
  page.emit('did-finish-load');
  for (let i = 0; i < 15 && !window.insertedCSS; i++) await new Promise(setImmediate);
  assert.match(window.insertedCSS, /data-val-desktop-performance/);
  assert.match(window.insertedCSS, /animation-play-state: paused/);
  assert.doesNotMatch(window.insertedCSS, /\b(?:video|audio)\b/);
});

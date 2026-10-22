const { app, BrowserWindow, Menu, Tray, dialog, shell, session, desktopCapturer, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { desktopUrl, sameOrigin, externalUrl, permissionAllowed } = require('./policy.cjs');
const { createPersistentLogin } = require('./persistent-login.cjs');

app.setAppUserModelId('com.rootonset.val');
const startUrl = desktopUrl(app.isPackaged, process.env.VAL_DESKTOP_URL);
const origin = new URL(startUrl).origin;
const dashboardUrl = new URL('/dashboard', startUrl).href;
let window;
let page;
let tray;
let quitting = false;
let picker;
let closeNoticeShown = false;
let persistentLogin;
let updateController;
let flushedForQuit = false;
const grants = new Set();
const offlineUrl = pathToFileURL(path.join(__dirname, 'offline.html')).href;

function showWindow() {
  if (!window || window.isDestroyed()) return;
  window.show();
  if (window.isMinimized()) window.restore();
  window.focus();
}

function trusted(contents, url) {
  return window && !window.isDestroyed() && contents === page && sameOrigin(contents.getURL(), origin) && sameOrigin(url, origin);
}

async function openExternal(url) {
  if (!externalUrl(url)) return;
  try { await shell.openExternal(url); } catch (error) { console.error('Could not open external link:', error.message); }
}

function selectCapture(request, callback) {
  if (picker || !request.userGesture || !trusted(page, request.frame?.url)) { callback({}); return; }
  let completed = false;
  let sources = [];
  const captureWindow = new BrowserWindow({
    parent: window, modal: true, width: 760, height: 580, show: false,
    title: 'Share your screen — VAL', backgroundColor: '#171717', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'picker/preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, devTools: !app.isPackaged }
  });
  picker = captureWindow;
  const finish = (selection) => {
    if (completed) return;
    completed = true;
    clearTimeout(timeout);
    ipcMain.removeHandler('val:share-sources');
    ipcMain.removeHandler('val:share-select');
    picker = null;
    try { callback(selection); } catch (error) { console.error('Capture request ended:', error.message); }
    if (!captureWindow.isDestroyed()) captureWindow.close();
  };
  const timeout = setTimeout(() => finish({}), 90_000);
  const isPicker = (event) => event.sender === captureWindow.webContents && event.senderFrame === captureWindow.webContents.mainFrame;
  ipcMain.handle('val:share-sources', async (event) => {
    if (!isPicker(event)) throw new Error('Untrusted picker');
    sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 300, height: 180 }, fetchWindowIcons: false });
    sources = sources.filter((source) => source.id !== captureWindow.getMediaSourceId());
    return { audioRequested: request.audioRequested, sources: sources.map((source) => ({ id: source.id, name: source.name, thumbnail: source.thumbnail.toDataURL() })) };
  });
  ipcMain.handle('val:share-select', (event, selection) => {
    if (!isPicker(event)) throw new Error('Untrusted picker');
    const source = sources.find((item) => item.id === selection?.id);
    if (!source || !trusted(page, request.frame?.url)) { finish({}); return; }
    finish({ video: source, ...(request.audioRequested && selection.audio === true ? { audio: 'loopback' } : {}) });
  });
  captureWindow.on('closed', () => finish({}));
  captureWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  captureWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  captureWindow.once('ready-to-show', () => captureWindow.show());
  void captureWindow.loadFile(path.join(__dirname, 'picker/index.html')).catch(() => finish({}));
}

function configureSession(ses) {
  ses.setPermissionCheckHandler((contents, permission, requestingOrigin) => {
    if (!trusted(contents, requestingOrigin) || !permissionAllowed(permission)) return false;
    if (permission === 'media') return false; // Route every new device request through the explicit permission dialog.
    return ['display-capture', 'fullscreen', 'clipboard-sanitized-write'].includes(permission) || grants.has(permission);
  });
  ses.setPermissionRequestHandler(async (contents, permission, callback, details) => {
    if (!trusted(contents, details.requestingUrl) || details.isMainFrame === false || !permissionAllowed(permission)) { callback(false); return; }
    const key = permission === 'media' ? `media:${[...(details.mediaTypes || ['audio', 'video'])].sort().join(',')}` : permission;
    if (['display-capture', 'fullscreen', 'clipboard-sanitized-write'].includes(permission) || grants.has(key)) { callback(true); return; }
    try {
      const media = details.mediaTypes?.join(' and ') || 'microphone and camera';
      const result = await dialog.showMessageBox(window, {
        type: 'question', title: 'VAL permission',
        message: permission === 'media' ? `Allow VAL to use your ${media}?` : 'Allow VAL to show desktop notifications?',
        detail: 'This permission lasts until VAL quits. You can reset permissions from the VAL tray menu.',
        buttons: ['Allow', 'Block'], defaultId: 1, cancelId: 1, noLink: true
      });
      if (result.response === 0 && trusted(contents, details.requestingUrl)) { grants.add(key); callback(true); }
      else callback(false);
    } catch { callback(false); }
  });
  ses.setDisplayMediaRequestHandler(selectCapture);
  ses.on('will-download', async (event, item) => {
    item.pause();
    try {
      const filename = item.getFilename();
      const result = await dialog.showSaveDialog(window, { title: 'Save file from VAL', defaultPath: path.join(app.getPath('downloads'), path.basename(filename)) });
      if (result.canceled || !result.filePath) item.cancel();
      else { item.setSavePath(result.filePath); item.resume(); }
    } catch { item.cancel(); }
  });
}

async function saveDiagnostics() {
  const result = await dialog.showSaveDialog(window, { title: 'Save performance snapshot', defaultPath: 'VAL-performance.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (result.canceled || !result.filePath) return;
  const renderer = await page.executeJavaScript(`(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    return {
      navigation: entry ? {
        serverWaitMs: Math.round(entry.responseStart - entry.requestStart),
        domInteractiveMs: Math.round(entry.domInteractive),
        loadMs: Math.round(entry.loadEventEnd), type: entry.type
      } : null,
      resourceCount: performance.getEntriesByType('resource').length,
      domNodes: document.getElementsByTagName('*').length,
      hidden: document.hidden
    };
  })()`).catch(() => null);
  const snapshot = {
    capturedAt: new Date().toISOString(), version: app.getVersion(), electron: process.versions.electron,
    windowVisible: window.isVisible(), windowMinimized: window.isMinimized(),
    processes: app.getAppMetrics().map(({ type, cpu, memory }) => ({ type, cpu, memory })),
    gpu: app.getGPUFeatureStatus(), renderer
  };
  await fs.writeFile(result.filePath, JSON.stringify(snapshot, null, 2));
}

function createWindow() {
  const ses = session.fromPartition('persist:val');
  persistentLogin = createPersistentLogin({ session: ses, origin, statePath: path.join(app.getPath('userData'), 'desktop-session.json') });
  window = new BrowserWindow({
    width: 1280, height: 840, minWidth: 800, minHeight: 560,
    title: 'VAL', icon: path.join(__dirname, 'assets/val.ico'), backgroundColor: '#151515', show: false,
    frame: false,
    webPreferences: { session: ses, nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false, backgroundThrottling: true,
      v8CacheOptions: 'bypassHeatCheck',
      navigateOnDragDrop: false, devTools: !app.isPackaged,
      preload: path.join(__dirname, 'window-preload.cjs'), additionalArguments: [`--val-origin=${origin}`] }
  });
  page = window.webContents;
  const recordActivity = () => {
    void persistentLogin.touch().then((result) => {
      if (result?.expired) return page.loadURL(new URL('/login?reason=inactive', startUrl).href);
    }).catch(console.warn);
  };
  window.on('focus', recordActivity);
  ipcMain.on('val:activity', (event) => {
    if (event.sender === page && event.senderFrame === page.mainFrame && trusted(page, event.senderFrame.url)) {
      recordActivity();
    }
  });
  const effectsCSS = fs.readFile(path.join(__dirname, 'desktop-effects.css'), 'utf8')
    .catch((error) => { console.warn('Desktop visual optimizations unavailable:', error.message); return ''; });
  page.on('did-finish-load', () => {
    if (trusted(page, page.getURL())) void effectsCSS.then((css) => page.insertCSS(css))
      .catch((error) => console.warn('Desktop visual optimizations unavailable:', error.message));
  });
  const windowState = () => ({ maximized: window.isMaximized(), fullscreen: window.isFullScreen() });
  const sendWindowState = () => { if (!page.isDestroyed()) page.send('val:window-state', windowState()); };
  ipcMain.handle('val:window-action', (event, action) => {
    if (event.sender !== page || event.senderFrame !== page.mainFrame ||
        !(trusted(page, event.senderFrame.url) || page.getURL() === offlineUrl)) throw new Error('Untrusted window control');
    switch (action) {
      case 'state': break;
      case 'minimize': window.minimize(); break;
      case 'toggle-maximize':
        if (window.isFullScreen()) window.setFullScreen(false);
        else if (window.isMaximized()) window.unmaximize();
        else window.maximize();
        break;
      case 'close': window.close(); break;
      default: throw new Error('Unsupported window action');
    }
    return windowState();
  });
  for (const event of ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) window.on(event, sendWindowState);
  page.on('did-finish-load', sendWindowState);
  // F11 remains available without an application menu or native title bar.
  page.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11' && !input.isAutoRepeat) {
      event.preventDefault();
      window.setFullScreen(!window.isFullScreen());
    }
  });
  window.on('closed', () => {
    ipcMain.removeHandler('val:window-action');
  });
  configureSession(ses);
  page.setWindowOpenHandler(({ url }) => {
    if (sameOrigin(url, origin)) { showWindow(); void page.loadURL(url); }
    else void openExternal(url);
    return { action: 'deny' };
  });
  const navigation = (event, url) => {
    if (!sameOrigin(url, origin)) { event.preventDefault(); void openExternal(url); }
  };
  page.on('will-navigate', navigation);
  page.on('will-redirect', navigation);
  page.on('will-attach-webview', (event) => event.preventDefault());
  page.on('page-title-updated', (event) => event.preventDefault());
  page.on('did-fail-load', (_event, code, _description, url, mainFrame) => {
    if (mainFrame && code !== -3 && sameOrigin(url, origin)) void page.loadFile(path.join(__dirname, 'offline.html'));
  });
  page.on('render-process-gone', () => {
    showWindow();
    void dialog.showMessageBox(window, { type: 'error', message: 'VAL needs to reload.', detail: 'The app process stopped. Any active call was interrupted.', buttons: ['Reload', 'Quit'] }).then(({ response }) => {
      if (response === 0) void page.loadURL(dashboardUrl); else { quitting = true; app.quit(); }
    });
  });
  window.once('ready-to-show', showWindow);
  window.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    window.hide();
    if (!closeNoticeShown) {
      closeNoticeShown = true;
      tray.displayBalloon({ title: 'VAL is still running', content: 'Calls stay connected. Right-click the VAL tray icon to quit.' });
    }
  });
  const menu = Menu.buildFromTemplate([
    { label: 'VAL', submenu: [
      { label: 'Open VAL', click: showWindow },
      { label: 'Reconnect / reload (ends active calls)', click: async () => {
        const { response } = await dialog.showMessageBox(window, { type: 'question', message: 'Reload VAL?', detail: 'Any active call will disconnect.', buttons: ['Cancel', 'Reload'], defaultId: 0, cancelId: 0 });
        if (response === 1) void page.loadURL(dashboardUrl);
      } },
      { label: 'Reset permissions', click: () => grants.clear() },
      { type: 'separator' },
      { label: 'Quit VAL (ends calls)', accelerator: 'Alt+F4', click: () => { quitting = true; app.quit(); } }
    ] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] },
    { label: 'Help', submenu: [
      { id: 'val-check-update', label: 'Check for updates', click: () => void updateController?.check(true) },
      { id: 'val-install-update', label: 'Restart to install update', enabled: false, click: () => void updateController?.installNow() },
      { label: 'Save performance snapshot', click: () => void saveDiagnostics().catch((error) => dialog.showErrorBox('Could not save snapshot', error.message)) },
      { label: 'About VAL', click: () => void dialog.showMessageBox(window, { title: 'VAL', message: `VAL for Windows ${app.getVersion()}`, detail: 'Powered by Rootonset. Close to tray; right-click the tray icon for app controls, diagnostics, and Quit. Push-to-talk currently requires VAL to have keyboard focus.' }) }] }
  ]);
  Menu.setApplicationMenu(null);
  tray = new Tray(path.join(__dirname, 'assets/val.ico'));
  tray.setToolTip('VAL — right-click to open or quit');
  tray.setContextMenu(menu);
  tray.on('double-click', showWindow);
  if (app.isPackaged) {
    try {
      const { autoUpdater } = require('electron-updater');
      const { createUpdateController } = require('./updates.cjs');
      updateController = createUpdateController({ app, updater: autoUpdater, dialog, getWindow: () => window,
        beforeInstall: () => persistentLogin.flush(),
        notify: (title, content) => tray.displayBalloon({ title, content }),
        onState: ({ downloaded }) => { const item = menu.getMenuItemById('val-install-update'); if (item) item.enabled = downloaded; }
      });
      updateController.start();
    } catch (error) { console.warn('Desktop updater unavailable:', error.message); }
  }
  void persistentLogin.restore().then(({ expired }) => page.loadURL(expired ? new URL('/login?reason=inactive', startUrl).href : dashboardUrl))
    .catch((error) => { dialog.showErrorBox('VAL could not restore your session', error.message); quitting = true; app.quit(); });
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', showWindow);
  app.on('before-quit', (event) => {
    quitting = true;
    if (persistentLogin && !flushedForQuit) {
      event.preventDefault();
      void persistentLogin.flush().catch(console.warn).finally(() => { flushedForQuit = true; app.quit(); });
    }
  });
  app.on('quit', () => updateController?.stop());
  app.on('window-all-closed', () => { if (quitting) app.quit(); });
  app.whenReady().then(createWindow).catch((error) => { dialog.showErrorBox('VAL could not start', error.message); app.quit(); });
}

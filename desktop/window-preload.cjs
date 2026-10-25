// Runs in Electron's isolated, sandboxed preload world. Nothing is exposed to
// website JavaScript: only the three controls below can invoke window actions.
const { ipcRenderer } = require('electron');

if (process.isMainFrame) {
  const expectedOrigin = process.argv.find((value) => value.startsWith('--val-origin='))?.slice('--val-origin='.length);
  const isOffline = location.protocol === 'file:' && ['/offline.html', '/startup.html'].some((file) => location.pathname.endsWith(file));
  if (location.origin === expectedOrigin || isOffline) {
    window.addEventListener('DOMContentLoaded', installControls, { once: true });
  }
}

function installControls() {
  if (location.protocol === 'file:' && location.pathname.endsWith('/startup.html')) {
    ipcRenderer.on('val:startup-update', (_event, state) => {
      const status = document.getElementById('update-status');
      const progress = document.getElementById('update-progress');
      const labels = { checking: 'Checking for updates…', downloading: 'Downloading the latest VAL…', installing: 'Installing. VAL will reopen automatically.', error: 'Waiting to retry the update.' };
      if (status) status.textContent = labels[state?.stage] || labels.checking;
      if (progress) { if (state?.stage === 'downloading' && Number.isFinite(state.percent)) progress.value = state.percent; else progress.removeAttribute('value'); }
    });
  }
  // Capture trusted user activity at most once a minute; never store credentials.
  let lastActivitySent = 0;
  const activity = (event) => {
    if (!event.isTrusted || Date.now() - lastActivitySent < 60_000) return;
    lastActivitySent = Date.now();
    ipcRenderer.send('val:activity');
  };
  document.addEventListener('pointerdown', activity, { capture: true, passive: true });
  document.addEventListener('keydown', activity, { capture: true, passive: true });
  document.documentElement.setAttribute('data-val-desktop-performance', '');
  const host = document.createElement('span');
  host.id = 'val-desktop-controls';
  host.setAttribute('role', 'group');
  host.setAttribute('aria-label', 'VAL window controls');
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host{display:inline-flex!important;align-items:center;gap:6px;flex:0 0 auto!important;margin-left:auto;vertical-align:middle;
      width:132px!important;max-width:none!important;padding:0!important;align-self:center;white-space:nowrap;
      color:#cdd0d5;font:12px system-ui,sans-serif;line-height:1;letter-spacing:normal;text-transform:none;}
    :host([data-floating]){position:fixed;right:12px;top:12px;z-index:2147483647;width:260px!important;}
    :host([data-floating]) .grip{flex:1;}
    :host([data-fullscreen]){display:none!important;}
    .grip{width:18px;height:30px;display:grid;place-items:center;app-region:drag;-webkit-app-region:drag;
      user-select:none;opacity:.45;cursor:move;}
    .grip::before{content:'';display:block;width:2px;height:2px;background:currentColor;
      box-shadow:5px 0 currentColor,0 5px currentColor,5px 5px currentColor,0 -5px currentColor,5px -5px currentColor;}
    button{box-sizing:border-box;display:grid;place-items:center;width:32px;height:30px;padding:0;cursor:pointer;
      app-region:no-drag;-webkit-app-region:no-drag;color:#cdd0d5;background:#171a1f;
      border:1px solid var(--border-soft,var(--val-rule,#555));border-radius:3px;box-shadow:none;overflow:hidden;}
    button:hover{color:#e2e4e8;background:#30343c;border-color:#666c77;}
    button:active{transform:translateY(1px);}
    button:focus-visible{outline:2px solid var(--control,var(--accent,#f55105));outline-offset:3px;}
    button[data-action=close]:hover{background:#a62d24;border-color:#a62d24;color:#e2e4e8;}
    .icon{box-sizing:border-box;display:block;width:12px;height:12px;position:relative;pointer-events:none;}
    .minimize::before{content:'';position:absolute;left:0;right:0;top:6px;height:2px;background:currentColor;}
    .maximize{border:2px solid currentColor;}
    .restore::before,.restore::after{content:'';position:absolute;width:8px;height:8px;border:1.5px solid currentColor;}
    .restore::before{top:0;right:0;border-left:0;border-bottom:0;}
    .restore::after{left:0;bottom:0;}
    .close::before,.close::after{content:'';position:absolute;left:5px;top:-1px;width:2px;height:14px;background:currentColor;}
    .close::before{transform:rotate(45deg);}.close::after{transform:rotate(-45deg);}
  `;
  root.append(style);
  const grip = document.createElement('span');
  grip.className = 'grip';
  grip.title = 'Drag to move VAL; double-click to maximize';
  grip.setAttribute('aria-hidden', 'true');
  root.append(grip);
  let maximize;
  let maximizeIcon;
  let previousMaximized;
  let previousFullscreen;
  const updateState = (state) => {
    if (!state || typeof state.maximized !== 'boolean') return;
    if (previousFullscreen !== state.fullscreen) {
      previousFullscreen = state.fullscreen;
      host.toggleAttribute('data-fullscreen', state.fullscreen === true);
    }
    if (previousMaximized === state.maximized) return;
    previousMaximized = state.maximized;
    maximize.title = state.maximized ? 'Restore window' : 'Maximize window';
    maximize.setAttribute('aria-label', maximize.title);
    maximizeIcon.className = `icon ${state.maximized ? 'restore' : 'maximize'}`;
  };
  for (const [action, label] of [['minimize', 'Minimize window'], ['toggle-maximize', 'Maximize window'], ['close', 'Close VAL to tray']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    button.title = label;
    button.setAttribute('aria-label', label);
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.className = `icon ${action === 'toggle-maximize' ? 'maximize' : action}`;
    button.append(icon);
    button.addEventListener('click', (event) => {
      if (!event.isTrusted) return;
      void ipcRenderer.invoke('val:window-action', action).then(updateState).catch(console.warn);
    });
    if (action === 'toggle-maximize') { maximize = button; maximizeIcon = icon; }
    root.append(button);
  }
  ipcRenderer.on('val:window-state', (_event, state) => updateState(state));
  void ipcRenderer.invoke('val:window-action', 'state').then(updateState).catch(console.warn);

  // Mount inside VAL's existing header, never in a second title-bar layer.
  // The floating fallback keeps controls reachable during login/offline pages.
  let frame = 0;
  let currentHeader = null;
  const headerSelector = '.dashboard-shell-header, .val-hero-overline';
  const findHeader = () => [...document.querySelectorAll(headerSelector)]
    .find((element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
  const place = () => {
    frame = 0;
    const header = findHeader();
    currentHeader = header;
    host.toggleAttribute('data-floating', !header);
    (header || document.body).append(host);
  };
  const queuePlacement = () => { if (!frame) frame = requestAnimationFrame(place); };
  const observer = new MutationObserver((records) => {
    if (document.hidden) return;
    if (!host.isConnected || currentHeader && !currentHeader.isConnected) { queuePlacement(); return; }
    if (currentHeader) return;
    // During login/loading, inspect only newly added elements. Chat text updates
    // must not trigger a whole-document selector/layout read.
    if (records.some((record) => [...record.addedNodes].some((node) => node.nodeType === 1 &&
      (node.matches(headerSelector) || node.querySelector(headerSelector))))) queuePlacement();
  });
  const observe = () => observer.observe(document.body, { childList: true, subtree: true });
  const visibilityChanged = () => {
    document.documentElement.toggleAttribute('data-val-desktop-hidden', document.hidden);
    if (document.hidden) {
      observer.disconnect();
      cancelAnimationFrame(frame);
      frame = 0;
    } else { observe(); queuePlacement(); }
  };
  document.addEventListener('visibilitychange', visibilityChanged);
  document.documentElement.toggleAttribute('data-val-desktop-hidden', document.hidden);
  if (!document.hidden) observe();
  window.addEventListener('resize', queuePlacement);
  window.addEventListener('pagehide', () => {
    observer.disconnect(); cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', visibilityChanged);
    document.removeEventListener('pointerdown', activity, true);
    document.removeEventListener('keydown', activity, true);
  }, { once: true });
  place();
}

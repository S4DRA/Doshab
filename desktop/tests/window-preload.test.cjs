const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ isMainFrame = true, origin = 'https://doshab.vercel.app', withHeader = true } = {}) {
  class Element {
    constructor(tag) { this.tag = tag; this.nodeType = 1; this.children = []; this.dataset = {}; this.attributes = new Map(); this.events = {}; }
    setAttribute(key, value) { this.attributes.set(key, value); }
    toggleAttribute(key, value) { if (value) this.attributes.set(key, ''); else this.attributes.delete(key); }
    get isConnected() { return this === document.body || !!this.parent?.isConnected; }
    append(child) {
      if (child.parent) child.parent.children = child.parent.children.filter((item) => item !== child);
      child.parent = this; this.children.push(child);
    }
    attachShadow() { this.shadow = new Element('shadow'); return this.shadow; }
    addEventListener(name, handler) { this.events[name] = handler; }
    getClientRects() { return [{}]; }
    matches() { return this.tag === 'header'; }
    querySelector() { return this.children.find((item) => item.tag === 'header'); }
  }
  const documentEvents = {};
  let queries = 0;
  let observations = 0;
  let disconnections = 0;
  const document = { body: new Element('body'), documentElement: new Element('html'), hidden: false,
    createElement: (tag) => new Element(tag),
    addEventListener: (name, fn) => { documentEvents[name] = fn; }, removeEventListener: (name) => { delete documentEvents[name]; } };
  const header = new Element('header');
  if (withHeader) document.body.append(header);
  document.querySelectorAll = () => { queries++; return header.isConnected ? [header] : []; };
  const events = {};
  const calls = [];
  const listeners = {};
  const frames = [];
  let observer;
  const window = { addEventListener(name, fn) { events[name] = fn; } };
  const ipcRenderer = {
    on(name, fn) { listeners[name] = fn; },
    send(channel) { calls.push({ channel }); },
    invoke(channel, action) { calls.push({ channel, action }); return Promise.resolve({ maximized: false, fullscreen: false }); }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../window-preload.cjs'), 'utf8'), {
    require: () => ({ ipcRenderer }), process: { isMainFrame, argv: ['--val-origin=https://doshab.vercel.app'] },
    location: { origin, protocol: 'https:', pathname: '/dashboard' }, window, document, console,
    getComputedStyle: () => ({ visibility: 'visible' }),
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; }, cancelAnimationFrame() {},
    MutationObserver: class { constructor(fn) { observer = fn; } observe() { observations++; } disconnect() { disconnections++; } }
  });
  events.DOMContentLoaded?.();
  const host = [...header.children, ...document.body.children].find((item) => item.id === 'val-desktop-controls');
  return { document, header, events, documentEvents, calls, listeners, host,
    stats: () => ({ queries, observations, disconnections }),
    mutate: (addedNodes = [header]) => { observer([{ addedNodes }]); while (frames.length) frames.shift()(); } };
}

test('controls attach to the existing app header and ignore synthetic clicks', () => {
  const { header, host, calls } = setup();
  assert.equal(host.parent, header);
  const buttons = host.shadow.children.filter((item) => item.tag === 'button');
  assert.equal(buttons.length, 3);
  const before = calls.length;
  buttons[0].events.click({ isTrusted: false });
  assert.equal(calls.length, before);
  buttons[0].events.click({ isTrusted: true });
  assert.equal(calls.at(-1).channel, 'val:window-action');
  assert.equal(calls.at(-1).action, 'minimize');
});

test('login fallback moves into the app header when a route loads', () => {
  const { document, header, host, mutate } = setup({ withHeader: false });
  assert.equal(host.parent, document.body);
  assert.equal(host.attributes.has('data-floating'), true);
  document.body.append(header);
  mutate();
  assert.equal(host.parent, header);
  assert.equal(host.attributes.has('data-floating'), false);
  const replacement = document.createElement('header');
  // Simulate React removing the old header, then the route remounting it.
  header.parent = null;
  mutate();
  assert.equal(host.parent, document.body);
  document.body.append(header);
  mutate();
  assert.equal(host.parent, header);
  assert.equal(replacement.children.length, 0);
});

test('window state updates restore label and hides controls in fullscreen', () => {
  const { host, listeners } = setup();
  const maximize = host.shadow.children.find((item) => item.dataset.action === 'toggle-maximize');
  listeners['val:window-state']({}, { maximized: true, fullscreen: false });
  assert.equal(maximize.title, 'Restore window');
  listeners['val:window-state']({}, { maximized: false, fullscreen: true });
  assert.equal(host.attributes.has('data-fullscreen'), true);
});

test('no window controls are injected into subframes or other origins', () => {
  assert.equal(setup({ isMainFrame: false }).host, undefined);
  assert.equal(setup({ origin: 'https://evil.example' }).host, undefined);
});

test('window buttons use explicit CSS line icons without SVG parsing or rebuilding', () => {
  const { host, listeners } = setup();
  const buttons = host.shadow.children.filter((item) => item.tag === 'button');
  assert.equal(buttons[0].children[0].className, 'icon minimize');
  assert.equal(buttons[1].children[0].className, 'icon maximize');
  assert.equal(buttons[2].children[0].className, 'icon close');
  const icon = buttons[1].children[0];
  listeners['val:window-state']({}, { maximized: true, fullscreen: false });
  assert.equal(buttons[1].children[0], icon);
  assert.equal(icon.className, 'icon restore');
});

test('unrelated mutations do not scan the document during login or normal chat', () => {
  for (const withHeader of [true, false]) {
    const { stats, mutate } = setup({ withHeader });
    const before = stats().queries;
    for (let i = 0; i < 1000; i++) mutate([{ nodeType: 3 }]);
    assert.equal(stats().queries - before, 0);
  }
});

test('hidden window disconnects control observer and resumes on visibility', () => {
  const { document, documentEvents, stats, mutate } = setup();
  const before = stats();
  document.hidden = true;
  documentEvents.visibilitychange();
  assert.equal(stats().disconnections, before.disconnections + 1);
  assert.equal(document.documentElement.attributes.has('data-val-desktop-hidden'), true);
  document.hidden = false;
  documentEvents.visibilitychange();
  assert.equal(stats().observations, before.observations + 1);
  assert.equal(document.documentElement.attributes.has('data-val-desktop-hidden'), false);
  mutate([]);
});

test('only real user input emits throttled activity without sending credentials', () => {
  const { documentEvents, calls } = setup();
  documentEvents.pointerdown({ isTrusted: false });
  assert.equal(calls.filter(({ channel }) => channel === 'val:activity').length, 0);
  documentEvents.pointerdown({ isTrusted: true });
  documentEvents.keydown({ isTrusted: true });
  const activityCalls = calls.filter(({ channel }) => channel === 'val:activity');
  assert.equal(activityCalls.length, 1);
  assert.deepEqual(activityCalls[0], { channel: 'val:activity' });
});

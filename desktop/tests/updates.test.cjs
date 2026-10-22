const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdateController } = require('../updates.cjs');

function setup(packaged = true) {
  const updater = new EventEmitter();
  let checks = 0;
  let installs = 0;
  let flushed = false;
  let response = 0;
  const messages = [];
  const notices = [];
  const timers = [];
  updater.checkForUpdates = async () => { checks++; return { updateInfo: { version: '0.1.4' } }; };
  updater.quitAndInstall = () => { assert.equal(flushed, true); installs++; };
  const controller = createUpdateController({ app: { isPackaged: packaged, getVersion: () => '0.1.4' }, updater,
    getWindow: () => ({}), notify: (...args) => notices.push(args),
    beforeInstall: async () => { flushed = true; },
    dialog: { showMessageBox: async (_win, options) => { messages.push(options); return { response }; } },
    schedule: (fn, delay) => { timers.push({ fn, delay }); return { unref() {} }; },
    repeat: (fn, delay) => { timers.push({ fn, delay }); return { unref() {} }; }
  });
  return { controller, updater, messages, notices, timers, setResponse: (value) => { response = value; }, stats: () => ({ checks, installs }) };
}

test('automatic checks wait 30 seconds and repeat every six hours', () => {
  const { controller, timers, updater } = setup();
  controller.start();
  assert.deepEqual(timers.map(({ delay }) => delay), [30000, 21600000]);
  assert.equal(updater.autoDownload, true);
  assert.equal(updater.autoInstallOnAppQuit, true);
  assert.equal(updater.allowDowngrade, false);
});
test('development builds do not check for updates', async () => {
  const { controller, timers, stats } = setup(false);
  controller.start(); await controller.check(true);
  assert.equal(timers.length, 0); assert.equal(stats().checks, 0);
});
test('a downloaded update does not restart an ongoing app or duplicate a download', async () => {
  const { controller, updater, stats, notices } = setup();
  updater.emit('update-available');
  await controller.check();
  assert.equal(stats().checks, 0);
  updater.emit('update-downloaded');
  assert.equal(controller.getState().downloaded, true);
  assert.equal(stats().installs, 0);
  assert.equal(notices.length, 1);
});
test('install-now waits for confirmation and session flush', async () => {
  const { controller, updater, stats, setResponse } = setup();
  updater.emit('update-downloaded');
  await controller.installNow();
  assert.equal(stats().installs, 0);
  setResponse(1);
  await controller.installNow();
  assert.equal(stats().installs, 1);
});
test('failed background checks remain quiet and permit later retry', async () => {
  const { controller, updater, messages } = setup();
  updater.checkForUpdates = async () => { throw new Error('offline'); };
  await controller.check();
  assert.equal(messages.length, 0);
  assert.equal(controller.getState().checking, false);
  assert.equal(controller.getState().lastError, 'offline');
  await controller.check(true);
  assert.equal(messages.length, 1);
});
test('concurrent update checks coalesce', async () => {
  const { controller, updater } = setup();
  let finish;
  let checks = 0;
  updater.checkForUpdates = () => { checks++; return new Promise((resolve) => { finish = resolve; }); };
  const pending = controller.check();
  await controller.check();
  assert.equal(checks, 1);
  finish({ updateInfo: { version: '0.1.4' } }); await pending;
});

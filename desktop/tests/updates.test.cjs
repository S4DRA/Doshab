const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdateController } = require('../updates.cjs');

function setup(packaged = true) {
  const updater = new EventEmitter();
  let checks = 0;
  let installs = 0;
  let quits = 0;
  let flushed = false;
  let response = 0;
  const messages = [];
  const notices = [];
  const timers = [];
  updater.checkForUpdates = async () => { checks++; return { updateInfo: { version: '0.1.4' } }; };
  updater.quitAndInstall = () => { assert.equal(flushed, true); installs++; };
  const controller = createUpdateController({ app: { isPackaged: packaged, getVersion: () => '0.1.4', quit: () => { quits++; } }, updater,
    getWindow: () => ({}), notify: (...args) => notices.push(args),
    beforeInstall: async () => { flushed = true; },
    dialog: { showMessageBox: async (_win, options) => { messages.push(options); return { response }; } },
    schedule: (fn, delay) => { timers.push({ fn, delay }); return { unref() {} }; },
    repeat: (fn, delay) => { timers.push({ fn, delay }); return { unref() {} }; }
  });
  return { controller, updater, messages, notices, timers, setResponse: (value) => { response = value; }, stats: () => ({ checks, installs, quits }) };
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

test('startup checks before opening and does not schedule a duplicate initial background check', async () => {
  const {controller, updater, timers, stats} = setup();
  updater.checkForUpdates = async () => ({isUpdateAvailable:false});
  assert.equal(await controller.prepareStartup(),true);controller.start();
  assert.deepEqual(timers.map(item=>item.delay),[21600000]);assert.equal(stats().installs,0);
});

test('a startup update waits for download and flushes sign-in before automatically installing', async () => {
  const {controller, updater, stats, notices} = setup();let finish;
  updater.checkForUpdates=async()=>({isUpdateAvailable:true,downloadPromise:new Promise(resolve=>{finish=()=>{updater.emit('update-downloaded');resolve(['installer']);};})});
  const opening=controller.prepareStartup();await new Promise(setImmediate);
  assert.equal(stats().installs,0);assert.equal(controller.prepareStartup(),opening);
  finish();assert.equal(await opening,false);assert.equal(stats().installs,1);assert.equal(notices.length,0);
});

test('startup service failure offers retry or quit and never opens an outdated platform', async () => {
  const {controller,updater,setResponse,stats,messages}=setup();setResponse(1);
  updater.checkForUpdates=async()=>{throw new Error('offline');};
  assert.equal(await controller.prepareStartup(),false);assert.equal(stats().quits,1);assert.equal(stats().installs,0);
  assert.deepEqual(messages[0].buttons,['Retry','Quit VAL']);
});

test('failed download can retry successfully without opening the platform between attempts', async () => {
  const {controller,updater,stats}=setup();let attempts=0;let cancellations=0;
  updater.checkForUpdates=async()=>({isUpdateAvailable:true,cancellationToken:{cancel(){cancellations++;}},downloadPromise:Promise.resolve().then(()=>{if(++attempts===1)throw new Error('interrupted');updater.emit('update-downloaded');return ['installer'];})});
  assert.equal(await controller.prepareStartup(),false);assert.equal(attempts,2);assert.equal(cancellations,1);assert.equal(stats().installs,1);
});

test('development startup bypasses the release service', async () => {
  const {controller,stats}=setup(false);assert.equal(await controller.prepareStartup(),true);assert.equal(stats().checks,0);
});

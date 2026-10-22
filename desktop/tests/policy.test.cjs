const { test } = require('node:test');
const assert = require('node:assert/strict');
const { desktopUrl, sameOrigin, externalUrl, permissionAllowed, PRODUCTION_URL } = require('../policy.cjs');

test('packaged app cannot be redirected by an environment variable', () => {
  assert.equal(desktopUrl(true, 'https://attacker.example'), PRODUCTION_URL);
});
test('development permits loopback only', () => {
  assert.equal(desktopUrl(false, 'http://localhost:3000/login'), 'http://localhost:3000');
  assert.equal(desktopUrl(false, 'http://127.0.0.1:3000'), 'http://127.0.0.1:3000');
  for (const url of ['https://attacker.example', 'http://localhost.attacker.example', 'file:///C:/test', 'javascript:alert(1)', 'http://user:pass@localhost']) assert.throws(() => desktopUrl(false, url));
});
test('only the exact VAL origin is trusted', () => {
  assert.equal(sameOrigin(`${PRODUCTION_URL}/dashboard`, PRODUCTION_URL), true);
  for (const url of ['https://doshab.vercel.app.attacker.example', 'https://doshab.vercel.app@attacker.example', 'http://doshab.vercel.app', 'https://doshab.vercel.app:444', 'data:text/html,hi', 'garbage']) assert.equal(sameOrigin(url, PRODUCTION_URL), false);
});
test('external links cannot launch arbitrary local protocols', () => {
  for (const url of ['https://example.com', 'http://example.com', 'mailto:hello@example.com']) assert.equal(externalUrl(url), true);
  for (const url of ['file:///C:/Windows/system32/cmd.exe', 'javascript:alert(1)', 'powershell:payload', 'ms-settings:privacy', 'https://user:password@example.com']) assert.equal(externalUrl(url), false);
});
test('unneeded permissions are denied', () => {
  for (const permission of ['media', 'notifications', 'display-capture']) assert.equal(permissionAllowed(permission), true);
  for (const permission of ['geolocation', 'midiSysex', 'serial', 'usb', 'clipboard-read', 'unknown']) assert.equal(permissionAllowed(permission), false);
});

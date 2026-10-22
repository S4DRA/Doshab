const PRODUCTION_URL = 'https://doshab.vercel.app';

function desktopUrl(packaged, override) {
  if (!override || packaged) return PRODUCTION_URL;
  const parsed = new URL(override);
  if (parsed.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.username || parsed.password) {
    throw new Error('Development URL must be an HTTP loopback URL.');
  }
  return parsed.origin;
}

function sameOrigin(candidate, origin) {
  try { return new URL(candidate).origin === origin; } catch { return false; }
}

function externalUrl(candidate) {
  try {
    const parsed = new URL(candidate);
    return ['https:', 'http:', 'mailto:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch { return false; }
}

function permissionAllowed(permission) {
  return ['media', 'notifications', 'clipboard-sanitized-write', 'fullscreen', 'display-capture'].includes(permission);
}

module.exports = { PRODUCTION_URL, desktopUrl, sameOrigin, externalUrl, permissionAllowed };

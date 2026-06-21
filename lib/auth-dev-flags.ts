import "server-only";

<<<<<<< Updated upstream
<<<<<<< Updated upstream
function isEnabled(value: string | undefined) {
  return value === "true" || value === "1";
}

function isNonProductionRuntime() {
  return process.env.NODE_ENV !== "production";
}

export function isDevEmailAuthBypassEnabled() {
  // TODO: Re-enable email verification/reset before production.
  return isNonProductionRuntime() && isEnabled(process.env.ENABLE_DEV_EMAIL_AUTH_BYPASS);
}

export function isDevPasswordResetEnabled() {
  // TODO: Re-enable email verification/reset before production.
  return isNonProductionRuntime() && isEnabled(process.env.ENABLE_DEV_PASSWORD_RESET);
}

export function isLegacyEmailPasswordResetEnabled() {
  // TODO: Re-enable email verification/reset before production.
  return isNonProductionRuntime() && isEnabled(process.env.ENABLE_EMAIL_PASSWORD_RESET);
}
=======
=======
>>>>>>> Stashed changes
export function shouldBypassEmailVerificationForDev() {
  // TODO: Re-enable email verification/reset before production.
  return process.env.NODE_ENV !== "production";
}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

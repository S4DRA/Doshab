export const encryptedMessagePrefix = "e2ee:v1:";
export const deviceEncryptedMessagePrefix = "e2ee:v2:";

export function isEncryptedMessageContent(content: string) {
  return (
    content.startsWith(encryptedMessagePrefix) ||
    content.startsWith(deviceEncryptedMessagePrefix)
  );
}

export function isValidEncryptedMessageContent(content: string) {
  if (!isEncryptedMessageContent(content)) {
    return false;
  }

  try {
    if (content.startsWith(deviceEncryptedMessagePrefix)) {
      const envelope = JSON.parse(
        content.slice(deviceEncryptedMessagePrefix.length),
      ) as {
        algorithm?: unknown;
        ciphertext?: unknown;
        ephemeralPublicKey?: unknown;
        iv?: unknown;
        keys?: unknown;
      };

      return (
        envelope.algorithm === "ECDH-P256/AES-GCM" &&
        typeof envelope.ciphertext === "string" &&
        typeof envelope.ephemeralPublicKey === "string" &&
        typeof envelope.iv === "string" &&
        Array.isArray(envelope.keys)
      );
    }

    const envelope = JSON.parse(content.slice(encryptedMessagePrefix.length)) as {
      algorithm?: unknown;
      ciphertext?: unknown;
      iv?: unknown;
      salt?: unknown;
    };

    return (
      envelope.algorithm === "AES-GCM/PBKDF2-SHA-256" &&
      typeof envelope.ciphertext === "string" &&
      typeof envelope.iv === "string" &&
      typeof envelope.salt === "string"
    );
  } catch {
    return false;
  }
}

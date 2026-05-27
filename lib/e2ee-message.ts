export const encryptedMessagePrefix = "e2ee:v1:";

export function isEncryptedMessageContent(content: string) {
  return content.startsWith(encryptedMessagePrefix);
}

export function isValidEncryptedMessageContent(content: string) {
  if (!isEncryptedMessageContent(content)) {
    return false;
  }

  try {
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

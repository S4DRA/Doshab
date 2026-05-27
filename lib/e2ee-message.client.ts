"use client";

import { encryptedMessagePrefix } from "@/lib/e2ee-message";

type EncryptedEnvelope = {
  algorithm: "AES-GCM/PBKDF2-SHA-256";
  ciphertext: string;
  iv: string;
  salt: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function deriveMessageKey(passphrase: string, salt: BufferSource) {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      hash: "SHA-256",
      iterations: 210000,
      name: "PBKDF2",
      salt,
    },
    baseKey,
    {
      length: 256,
      name: "AES-GCM",
    },
    false,
    ["decrypt", "encrypt"],
  );
}

export async function encryptMessageContent(content: string, passphrase: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveMessageKey(passphrase, salt);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      iv,
      name: "AES-GCM",
    },
    key,
    encoder.encode(content),
  );
  const envelope: EncryptedEnvelope = {
    algorithm: "AES-GCM/PBKDF2-SHA-256",
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
  };

  return `${encryptedMessagePrefix}${JSON.stringify(envelope)}`;
}

export async function decryptMessageContent(content: string, passphrase: string) {
  if (!content.startsWith(encryptedMessagePrefix)) {
    return {
      encrypted: false,
      text: "Legacy unencrypted message. Ask everyone to use a chat key for E2EE.",
    };
  }

  try {
    const envelope = JSON.parse(
      content.slice(encryptedMessagePrefix.length),
    ) as EncryptedEnvelope;
    const key = await deriveMessageKey(passphrase, base64ToBytes(envelope.salt));
    const decrypted = await window.crypto.subtle.decrypt(
      {
        iv: base64ToBytes(envelope.iv),
        name: "AES-GCM",
      },
      key,
      base64ToBytes(envelope.ciphertext),
    );

    return {
      encrypted: true,
      text: decoder.decode(decrypted),
    };
  } catch {
    return {
      encrypted: true,
      text: "Could not decrypt this message. Check that this chat key matches.",
    };
  }
}

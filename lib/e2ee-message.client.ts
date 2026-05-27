"use client";

import {
  deviceEncryptedMessagePrefix,
  encryptedMessagePrefix,
} from "@/lib/e2ee-message";

type DeviceKey = {
  id: string;
  publicKey: string;
  userId: string;
};

type DeviceIdentity = {
  deviceId: string;
  privateKey: JsonWebKey;
  publicKey: string;
};

type WrappedMessageKey = {
  ciphertext: string;
  deviceId: string;
  iv: string;
  userId: string;
};

type DeviceEncryptedEnvelope = {
  algorithm: "ECDH-P256/AES-GCM";
  ciphertext: string;
  ephemeralPublicKey: string;
  iv: string;
  keys: WrappedMessageKey[];
};

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const identityStorageKey = "doshab-e2ee-device";

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

async function importPrivateKey(privateKey: JsonWebKey) {
  return window.crypto.subtle.importKey(
    "jwk",
    privateKey,
    {
      namedCurve: "P-256",
      name: "ECDH",
    },
    false,
    ["deriveKey"],
  );
}

async function importPublicKey(publicKey: string) {
  return window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(publicKey) as JsonWebKey,
    {
      namedCurve: "P-256",
      name: "ECDH",
    },
    false,
    [],
  );
}

async function deriveWrapKey(privateKey: CryptoKey, publicKey: CryptoKey) {
  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      length: 256,
      name: "AES-GCM",
    },
    false,
    ["decrypt", "encrypt"],
  );
}

export async function getOrCreateDeviceIdentity() {
  const storedIdentity = window.localStorage.getItem(identityStorageKey);

  if (storedIdentity) {
    return JSON.parse(storedIdentity) as DeviceIdentity;
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      namedCurve: "P-256",
      name: "ECDH",
    },
    true,
    ["deriveKey"],
  );
  const privateKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey,
  );
  const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const identity: DeviceIdentity = {
    deviceId: window.crypto.randomUUID(),
    privateKey,
    publicKey: JSON.stringify(publicKey),
  };

  window.localStorage.setItem(identityStorageKey, JSON.stringify(identity));

  return identity;
}

export async function registerDeviceKey() {
  const identity = await getOrCreateDeviceIdentity();

  await fetch("/api/e2ee/device-key", {
    body: JSON.stringify({
      deviceId: identity.deviceId,
      publicKey: identity.publicKey,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  return identity;
}

export async function fetchChannelDeviceKeys(channelId: string) {
  const response = await fetch(`/api/channels/${channelId}/device-keys`, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Could not load encryption recipients.");
  }

  return (await response.json()) as { devices: DeviceKey[] };
}

export async function encryptMessageContent(content: string, devices: DeviceKey[]) {
  const recipientDevices = dedupeDevices(devices);

  if (!recipientDevices.length) {
    throw new Error("No recipient devices are ready for encrypted chat.");
  }

  const ephemeralKeyPair = await window.crypto.subtle.generateKey(
    {
      namedCurve: "P-256",
      name: "ECDH",
    },
    true,
    ["deriveKey"],
  );
  const messageKey = await window.crypto.subtle.generateKey(
    {
      length: 256,
      name: "AES-GCM",
    },
    true,
    ["decrypt", "encrypt"],
  );
  const messageKeyBytes = new Uint8Array(
    await window.crypto.subtle.exportKey("raw", messageKey),
  );
  const messageIv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      iv: messageIv,
      name: "AES-GCM",
    },
    messageKey,
    encoder.encode(content),
  );
  const ephemeralPublicKey = JSON.stringify(
    await window.crypto.subtle.exportKey("jwk", ephemeralKeyPair.publicKey),
  );
  const wrappedKeys = await Promise.all(
    recipientDevices.map(async (device) => {
      const recipientPublicKey = await importPublicKey(device.publicKey);
      const wrapKey = await deriveWrapKey(
        ephemeralKeyPair.privateKey,
        recipientPublicKey,
      );
      const keyIv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedKey = await window.crypto.subtle.encrypt(
        {
          iv: keyIv,
          name: "AES-GCM",
        },
        wrapKey,
        messageKeyBytes,
      );

      return {
        ciphertext: bytesToBase64(new Uint8Array(encryptedKey)),
        deviceId: device.id,
        iv: bytesToBase64(keyIv),
        userId: device.userId,
      };
    }),
  );
  const envelope: DeviceEncryptedEnvelope = {
    algorithm: "ECDH-P256/AES-GCM",
    ciphertext: bytesToBase64(new Uint8Array(encryptedMessage)),
    ephemeralPublicKey,
    iv: bytesToBase64(messageIv),
    keys: wrappedKeys,
  };

  return `${deviceEncryptedMessagePrefix}${JSON.stringify(envelope)}`;
}

export async function decryptMessageContent(content: string) {
  if (content.startsWith(encryptedMessagePrefix)) {
    return {
      encrypted: true,
      text: "Old encrypted message. New messages no longer need a shared chat key.",
    };
  }

  if (!content.startsWith(deviceEncryptedMessagePrefix)) {
    return {
      encrypted: false,
      text: "Legacy unencrypted message.",
    };
  }

  try {
    const identity = await getOrCreateDeviceIdentity();
    const envelope = JSON.parse(
      content.slice(deviceEncryptedMessagePrefix.length),
    ) as DeviceEncryptedEnvelope;
    const wrappedKey = envelope.keys.find(
      (key) => key.deviceId === identity.deviceId,
    );

    if (!wrappedKey) {
      return {
        encrypted: true,
        text: "This message was encrypted before this device was added.",
      };
    }

    const privateKey = await importPrivateKey(identity.privateKey);
    const ephemeralPublicKey = await importPublicKey(envelope.ephemeralPublicKey);
    const wrapKey = await deriveWrapKey(privateKey, ephemeralPublicKey);
    const messageKeyBytes = await window.crypto.subtle.decrypt(
      {
        iv: base64ToBytes(wrappedKey.iv),
        name: "AES-GCM",
      },
      wrapKey,
      base64ToBytes(wrappedKey.ciphertext),
    );
    const messageKey = await window.crypto.subtle.importKey(
      "raw",
      messageKeyBytes,
      {
        name: "AES-GCM",
      },
      false,
      ["decrypt"],
    );
    const decrypted = await window.crypto.subtle.decrypt(
      {
        iv: base64ToBytes(envelope.iv),
        name: "AES-GCM",
      },
      messageKey,
      base64ToBytes(envelope.ciphertext),
    );

    return {
      encrypted: true,
      text: decoder.decode(decrypted),
    };
  } catch {
    return {
      encrypted: true,
      text: "Could not decrypt this message on this device.",
    };
  }
}

function dedupeDevices(devices: DeviceKey[]) {
  const devicesById = new Map<string, DeviceKey>();

  devices.forEach((device) => {
    devicesById.set(device.id, device);
  });

  return [...devicesById.values()];
}

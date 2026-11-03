/**
 * Web Crypto API based PBKDF2 + AES-GCM 256-bit encryption and PIN hashing
 */

// Simple SHA-256 for PIN comparison
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(pin + '_day2day_salt_pepper_v2');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt string with password using AES-256-GCM
export async function encryptData(plainText: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    enc.encode(plainText)
  );

  // Combine salt + iv + encrypted data into JSON payload
  const payload = {
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
    v: 1,
  };

  return btoa(JSON.stringify(payload));
}

// Decrypt base64 AES-GCM string with password
export async function decryptData(cipherBase64: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const payload = JSON.parse(atob(cipherBase64));
  const salt = new Uint8Array(payload.salt);
  const iv = new Uint8Array(payload.iv);
  const encrypted = new Uint8Array(payload.data);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encrypted
  );

  return dec.decode(decrypted);
}

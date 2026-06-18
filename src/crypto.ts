import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Key will be derived from environment variable or generated
let encryptionKey: Buffer | null = null;

export function setEncryptionKey(key: string): void {
  // Derive a proper key from the provided string
  const keyBuffer = Buffer.from(key, "utf-8");
  if (keyBuffer.length >= KEY_LENGTH) {
    encryptionKey = keyBuffer.slice(0, KEY_LENGTH);
  } else {
    // Pad with zeros or hash to get proper length
    encryptionKey = Buffer.alloc(KEY_LENGTH, 0);
    keyBuffer.copy(encryptionKey);
  }
}

export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}

export function encrypt(text: string): string {
  if (!encryptionKey) {
    throw new Error("Encryption key not set. Call setEncryptionKey() first.");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);

  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptionKey) {
    throw new Error("Encryption key not set. Call setEncryptionKey() first.");
  }

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
}

export function isEncrypted(text: string): boolean {
  // Check if text matches our encryption format
  const parts = text.split(":");
  return (
    parts.length === 3 &&
    parts[0].length === IV_LENGTH * 2 &&
    parts[1].length === AUTH_TAG_LENGTH * 2 &&
    /^[0-9a-f]+$/.test(parts[0]) &&
    /^[0-9a-f]+$/.test(parts[1])
  );
}

// Encrypt a memory file content
export function encryptMemoryContent(content: string): string {
  if (isEncrypted(content)) {
    return content; // Already encrypted
  }
  return encrypt(content);
}

// Decrypt a memory file content
export function decryptMemoryContent(encryptedContent: string): string {
  if (!isEncrypted(encryptedContent)) {
    return encryptedContent; // Not encrypted
  }
  return decrypt(encryptedContent);
}

// Initialize encryption from environment or config
export function initEncryption(): void {
  const envKey = process.env.OPENCODE_MEMORY_ENCRYPTION_KEY;
  if (envKey) {
    setEncryptionKey(envKey);
  }
}

// Auto-initialize on import
initEncryption();

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  encrypt,
  decrypt,
  isEncrypted,
  generateEncryptionKey,
  setEncryptionKey,
  encryptMemoryContent,
  decryptMemoryContent,
} from "../crypto.js";

describe("Crypto Module", () => {
  const testKey = generateEncryptionKey();

  it("should generate a valid encryption key", () => {
    assert.ok(testKey);
    assert.ok(testKey.length === 64); // 32 bytes = 64 hex chars
  });

  it("should encrypt and decrypt text", () => {
    setEncryptionKey(testKey);
    const original = "Hello, World! This is a test message.";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    assert.strictEqual(decrypted, original);
    assert.notStrictEqual(encrypted, original);
  });

  it("should detect encrypted text", () => {
    setEncryptionKey(testKey);
    const original = "Test content";
    const encrypted = encrypt(original);

    assert.ok(isEncrypted(encrypted));
    assert.ok(!isEncrypted(original));
  });

  it("should encrypt memory content", () => {
    setEncryptionKey(testKey);
    const content = "---\ntitle: Test\n---\nThis is test content.";
    const encrypted = encryptMemoryContent(content);

    assert.ok(isEncrypted(encrypted));
    assert.notStrictEqual(encrypted, content);
  });

  it("should decrypt memory content", () => {
    setEncryptionKey(testKey);
    const content = "---\ntitle: Test\n---\nThis is test content.";
    const encrypted = encryptMemoryContent(content);
    const decrypted = decryptMemoryContent(encrypted);

    assert.strictEqual(decrypted, content);
  });

  it("should not double-encrypt content", () => {
    setEncryptionKey(testKey);
    const content = "Test content";
    const encrypted1 = encryptMemoryContent(content);
    const encrypted2 = encryptMemoryContent(encrypted1);

    assert.strictEqual(encrypted1, encrypted2);
  });
});

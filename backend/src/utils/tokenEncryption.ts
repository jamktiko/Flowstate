import crypto from 'crypto';

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

// Algorithm used for encryption — AES-256-CBC is industry standard
const ALGORITHM = 'aes-256-cbc';

// KEY must be exactly 32 bytes — TOKEN_ENCRYPTION_KEY is 64 hex chars = 32 bytes
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY || '', 'hex');

// IV is always 16 bytes for AES-256-CBC
const IV_LENGTH = 16;

// ─────────────────────────────────────────────
// encrypt
// ─────────────────────────────────────────────

/**
 * Encrypts a plain text string using AES-256-CBC.
 * Generates a random IV for each encryption — same input gives different output each time.
 * Stores IV alongside encrypted data so decryption is possible: "iv:encryptedData"
 * @param text - Plain text to encrypt (e.g. raw OAuth access token)
 * @returns Encrypted string in format "iv:encryptedData" (both hex encoded)
 */
export function encrypt(text: string): string {
  // Generate a random IV for each encryption — prevents pattern analysis
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher with our key and the random IV
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  // Encrypt the text — update() processes the data, final() flushes remainder
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  // Store iv:encryptedData so we can decrypt later
  // Both converted to hex strings for safe storage in MongoDB
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// ─────────────────────────────────────────────
// decrypt
// ─────────────────────────────────────────────

/**
 * Decrypts a string that was encrypted with encrypt().
 * Splits the stored "iv:encryptedData" format to recover both parts.
 * @param text - Encrypted string in format "iv:encryptedData"
 * @returns The original plain text string (e.g. raw OAuth access token)
 * @throws If the encrypted string is malformed or key is wrong
 */
export function decrypt(text: string): string {
  // Split stored value back into iv and encrypted data
  const [ivHex, encryptedHex] = text.split(':');

  // Convert hex strings back to Buffers
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  // Create decipher with same key and the recovered IV
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

  // Decrypt — same pattern as encrypt but reversed
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

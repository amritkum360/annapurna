import crypto from 'crypto';

/**
 * Key derivation from JWT_SECRET or secure fallback
 */
const getEncryptionKey = () => {
  const secret = process.env.JWT_SECRET || 'annapurna_secure_fallback_secret_for_dev_mode';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt a plaintext string using AES-256-CBC
 * @param {string} text - Plain text (e.g. 6-digit confirmation code)
 * @returns {string} iv:ciphertext
 */
export const encryptCode = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt an AES-256-CBC encrypted payload
 * @param {string} payload - iv:ciphertext
 * @returns {string|null} Decrypted text
 */
export const decryptCode = (payload) => {
  if (!payload || typeof payload !== 'string' || !payload.includes(':')) {
    return null;
  }
  try {
    const [ivHex, cipherHex] = payload.split(':');
    if (!ivHex || !cipherHex) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('Decryption warning:', err.message);
    return null;
  }
};

/**
 * @fileoverview Utility module for AES-256-GCM encryption and decryption.
 * Uses a key derived from the ENCRYPTION_SECRET environment variable.
 */

const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_SECRET).digest();
const ivLength = 12;

/**
 * Encrypts a UTF-8 string using AES-256-GCM.
 *
 * @param {string} text - The plain text to encrypt.
 * @returns {string} The encrypted data, formatted as `iv:tag:ciphertext` in hex.
 */
function encrypt(text) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a string that was encrypted using `encrypt()`.
 *
 * @param {string} data - The encrypted string, formatted as `iv:tag:ciphertext` in hex.
 * @returns {string} The decrypted UTF-8 plain text.
 */
function decrypt(data) {
  const [ivHex, tagHex, encryptedHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };

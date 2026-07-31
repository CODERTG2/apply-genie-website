import crypto from 'crypto';

// The key must be a 32-byte hex string (64 characters)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY is required in production');
    }
    // Fallback for local dev if they forgot to add it (though they shouldn't)
    return Buffer.alloc(32, '0');
  }
  return Buffer.from(key, 'hex');
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM

/**
 * Encrypts a string and returns a base64 encoded string containing the IV, auth tag, and ciphertext.
 */
export function encrypt(text: string): string {
  if (text === null || text === undefined) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  // Format: iv.authTag.ciphertext
  return `${iv.toString('base64')}.${authTag}.${encrypted}`;
}

/**
 * Decrypts a base64 encoded string containing the IV, auth tag, and ciphertext.
 */
export function decrypt(hash: string): string {
  if (!hash || typeof hash !== 'string' || !hash.includes('.')) {
    // Return raw if it doesn't look like our ciphertext format
    return hash;
  }
  
  try {
    const parts = hash.split('.');
    if (parts.length !== 3) return hash;
    
    const [ivStr, authTagStr, encryptedStr] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivStr, 'base64');
    const authTag = Buffer.from(authTagStr, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedStr, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // If decryption fails (e.g. key change or corrupt data), return original
    // In production you might want to throw, but this is safer for migrations
    return hash;
  }
}

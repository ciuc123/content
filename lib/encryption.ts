import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  console.warn('⚠️  ENCRYPTION_KEY not set. Encryption will not work properly.')
}

const ALGORITHM = 'aes-256-cbc'

/**
 * Encrypt a string using Node.js crypto with AES-256-CBC
 */
export function encryptString(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // Generate a random IV
  const iv = crypto.randomBytes(16)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Return IV + encrypted data (both needed for decryption)
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt a string using Node.js crypto with AES-256-CBC
 */
export function decryptString(encrypted: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // Split IV and encrypted data
  const parts = encrypted.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const encryptedData = parts[1]

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  // Decrypt
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Derive a key using PBKDF2 for decrypting client-side encrypted data.
 * Uses the same algorithm as the client-side encryption.
 *
 * @param seed - The seed for key derivation (typically user ID)
 * @returns The derived key
 */
function deriveKeyForClientDecryption(seed: string): Buffer {
  const iterations = 100000
  const keyLength = 32 // 256 bits for AES-256

  const key = crypto.pbkdf2Sync(
    seed,
    'api-key-encryption',
    iterations,
    keyLength,
    'sha256'
  )

  return key
}

/**
 * Decrypt an API key that was encrypted on the client side using AES-GCM.
 *
 * @param encryptedJson - The JSON string with encrypted data and IV (base64 encoded)
 * @param seed - The seed for key derivation (typically user ID)
 * @returns The decrypted API key
 */
export function decryptClientEncryptedApiKey(encryptedJson: string, seed: string): string {
  try {
    const data = JSON.parse(encryptedJson)

    // Decode from base64
    const encrypted = Buffer.from(data.encrypted, 'base64')
    const iv = Buffer.from(data.iv, 'base64')

    // Derive the key
    const key = deriveKeyForClientDecryption(seed)

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)

    // Decrypt
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf-8')
  } catch (error: any) {
    throw new Error(`Failed to decrypt client-encrypted API key: ${error.message}`)
  }
}

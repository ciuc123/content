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



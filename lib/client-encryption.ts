/**
 * Client-side encryption for sensitive data in transit.
 * Uses Web Crypto API to encrypt data before sending to the server.
 * This adds an extra layer of security beyond HTTPS.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12

/**
 * Derive a encryption key from a seed string using PBKDF2.
 * The seed should be something like a user ID that's the same client-side and server-side.
 *
 * @param seed - A string to derive the key from (e.g., user ID)
 * @returns The derived crypto key
 */
async function deriveKey(seed: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const data = encoder.encode(seed)

  // Import the seed as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('api-key-encryption'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a string value using AES-GCM.
 *
 * @param plaintext - The text to encrypt
 * @param seed - The seed for key derivation (typically user ID)
 * @returns A JSON string with encrypted data and IV
 */
export async function encryptApiKeyForTransit(plaintext: string, seed: string): Promise<string> {
  try {
    const key = await deriveKey(seed)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const encoder = new TextEncoder()

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encoder.encode(plaintext)
    )

    // Return as base64-encoded JSON for easy transmission
    return JSON.stringify({
      encrypted: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encrypted)))),
      iv: btoa(String.fromCharCode.apply(null, Array.from(iv)))
    })
  } catch (error: any) {
    throw new Error(`Failed to encrypt API key: ${error.message}`)
  }
}

/**
 * Decrypt an encrypted string using AES-GCM.
 *
 * @param encryptedJson - The JSON string with encrypted data and IV
 * @param seed - The seed for key derivation (typically user ID)
 * @returns The decrypted plaintext
 */
export async function decryptApiKeyFromTransit(encryptedJson: string, seed: string): Promise<string> {
  try {
    const data = JSON.parse(encryptedJson)
    const key = await deriveKey(seed)

    // Decode from base64
    const encrypted = new Uint8Array(
      atob(data.encrypted)
        .split('')
        .map((c: string) => c.charCodeAt(0))
    )
    const iv = new Uint8Array(
      atob(data.iv)
        .split('')
        .map((c: string) => c.charCodeAt(0))
    )

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encrypted
    )

    return new TextDecoder().decode(decrypted)
  } catch (error: any) {
    throw new Error(`Failed to decrypt API key: ${error.message}`)
  }
}


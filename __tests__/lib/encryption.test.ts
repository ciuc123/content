import { encryptString, decryptString } from '../../lib/encryption'

describe('Encryption Module', () => {
  const testKey = 'test-key-123'

  // Set environment variable for tests
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = Buffer.from(testKey.padEnd(32, '0')).toString('hex')
  })

  describe('encryptString', () => {
    it('should encrypt a string and return a string with colon separator', () => {
      const plaintext = 'sk-1234567890abcdef'
      const encrypted = encryptString(plaintext)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
      expect(encrypted.includes(':')).toBe(true)
      expect(encrypted).not.toBe(plaintext)
    })

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const original = process.env.ENCRYPTION_KEY
      delete process.env.ENCRYPTION_KEY

      expect(() => encryptString('test')).toThrow('ENCRYPTION_KEY environment variable is not set')

      process.env.ENCRYPTION_KEY = original
    })

    it('should handle special characters', () => {
      const plaintext = 'sk-@#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = encryptString(plaintext)
      const decrypted = decryptString(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should handle unicode characters', () => {
      const plaintext = 'test-🔒-ñ-中文'
      const encrypted = encryptString(plaintext)
      const decrypted = decryptString(encrypted)

      expect(decrypted).toBe(plaintext)
    })
  })

  describe('decryptString', () => {
    it('should decrypt an encrypted string back to original', () => {
      const plaintext = 'sk-1234567890abcdef'
      const encrypted = encryptString(plaintext)
      const decrypted = decryptString(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const original = process.env.ENCRYPTION_KEY
      delete process.env.ENCRYPTION_KEY

      expect(() => decryptString('test:data')).toThrow('ENCRYPTION_KEY environment variable is not set')

      process.env.ENCRYPTION_KEY = original
    })

    it('should throw error for invalid encrypted data format', () => {
      expect(() => decryptString('invalid-no-colon')).toThrow('Invalid encrypted data format')
    })

    it('should throw error for tampered data', () => {
      const plaintext = 'sk-1234567890abcdef'
      const encrypted = encryptString(plaintext)
      const parts = encrypted.split(':')

      // Tamper with the encrypted part
      const tampered = parts[0] + ':' + parts[1].slice(0, -2) + 'XX'

      expect(() => decryptString(tampered)).toThrow()
    })
  })

  describe('Round-trip encryption', () => {
    const testCases = [
      'sk-proj-1234567890',
      'sk-ant-abcdefghij',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'a'.repeat(1000), // Long string
      '',               // Empty string
    ]

    testCases.forEach((testCase) => {
      it(`should round-trip: ${testCase.slice(0, 30)}${testCase.length > 30 ? '...' : ''}`, () => {
        const encrypted = encryptString(testCase)
        const decrypted = decryptString(encrypted)
        expect(decrypted).toBe(testCase)
      })
    })
  })
})


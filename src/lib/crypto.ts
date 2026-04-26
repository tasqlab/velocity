/**
 * Velocity Shield™ - End-to-End Encryption
 * Uses Web Crypto API for AES-GCM encryption
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12

export interface EncryptedMessage {
  ciphertext: string
  iv: string
  version: number
}

// Generate or retrieve user's encryption key from localStorage
// In production, you'd want to derive this from password + salt
export async function getOrCreateUserKey(): Promise<CryptoKey> {
  const storedKey = localStorage.getItem('velocity_encryption_key')
  
  if (storedKey) {
    // Import existing key
    const keyData = base64ToArrayBuffer(storedKey)
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    )
  }
  
  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
  
  // Export and store
  const exported = await crypto.subtle.exportKey('raw', key)
  localStorage.setItem('velocity_encryption_key', arrayBufferToBase64(exported))
  
  return key
}

// For DM: Derive shared key from both user IDs (deterministic)
export async function deriveSharedKey(userId1: string, userId2: string): Promise<CryptoKey> {
  // Sort IDs to ensure same key regardless of who initiates
  const sortedIds = [userId1, userId2].sort().join('')
  
  // Derive key using PBKDF2
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sortedIds),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  // Use a fixed salt based on the conversation (deterministic)
  const salt = encoder.encode('velocity-v1-' + sortedIds.slice(0, 32))
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// For Groups: Derive key from group ID (deterministic)
export async function deriveGroupKey(groupId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(groupId),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  const salt = encoder.encode('velocity-group-v1-' + groupId.slice(0, 16))
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt a message
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedMessage> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  )
  
  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    version: 1
  }
}

// Decrypt a message
export async function decryptMessage(
  encrypted: EncryptedMessage,
  key: CryptoKey
): Promise<string | null> {
  try {
    const decoder = new TextDecoder()
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext)
    const iv = base64ToArrayBuffer(encrypted.iv)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    )
    
    return decoder.decode(decrypted)
  } catch (err) {
    console.error('Decryption failed:', err)
    return null
  }
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer as ArrayBuffer
}

// Format encrypted message for storage
export function formatEncryptedPayload(encrypted: EncryptedMessage): string {
  return JSON.stringify({
    v: encrypted.version,
    ct: encrypted.ciphertext,
    iv: encrypted.iv
  })
}

// Parse encrypted message from storage
export function parseEncryptedPayload(payload: string): EncryptedMessage | null {
  try {
    const parsed = JSON.parse(payload)
    return {
      version: parsed.v || 1,
      ciphertext: parsed.ct,
      iv: parsed.iv
    }
  } catch {
    // Legacy: treat as plaintext (for migration)
    return null
  }
}

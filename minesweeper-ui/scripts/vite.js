import { webcrypto } from 'node:crypto'

// Ensure Web Crypto API is available before running Vite's CLI.
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto = webcrypto
}

await import('../node_modules/vite/bin/vite.js')

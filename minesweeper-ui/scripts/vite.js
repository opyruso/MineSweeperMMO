import { webcrypto, randomFillSync } from 'node:crypto'

// Ensure Web Crypto API is available before running Vite's CLI.
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
  if (webcrypto && typeof webcrypto.getRandomValues === 'function') {
    globalThis.crypto = webcrypto
  } else {
    globalThis.crypto = {
      getRandomValues: (typedArray) => randomFillSync(typedArray)
    }
  }
}

await import('../node_modules/vite/bin/vite.js')

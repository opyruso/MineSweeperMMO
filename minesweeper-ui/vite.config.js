import { webcrypto } from 'node:crypto'

// Polyfill Web Crypto API before importing Vite.
if (!globalThis.crypto?.getRandomValues) {
  globalThis.crypto = webcrypto
}

const { defineConfig } = await import('vite')
const { default: react } = await import('@vitejs/plugin-react')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})


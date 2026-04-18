// jest.polyfills.ts
// Polyfill Web API globals needed by next/server (NextRequest, NextResponse)
// in Jest's sandbox environment. These run before any test module is imported.
import { TextEncoder, TextDecoder } from 'util'

// TextEncoder/TextDecoder from Node util
Object.assign(global, { TextEncoder, TextDecoder })

// Fetch API globals — available on globalThis in Node 18+ but Jest sandbox
// may not expose them as 'global.*'. Copy them over explicitly.
const { Request, Response, Headers, fetch } = globalThis as typeof globalThis & {
  Request: typeof Request
  Response: typeof Response
  Headers: typeof Headers
  fetch: typeof fetch
}

if (Request) Object.assign(global, { Request, Response, Headers, fetch })

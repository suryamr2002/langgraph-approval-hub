// jest.environment.ts
// Custom Jest environment that extends node environment with Fetch API globals
// required by next/server (NextRequest, NextResponse).
import { TestEnvironment } from 'jest-environment-node'
import type { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment'

class NextApiEnvironment extends TestEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    // Expose Node 18+ fetch API globals into the VM sandbox
    const fetchGlobals: Record<string, unknown> = {}
    for (const key of ['fetch', 'Request', 'Response', 'Headers', 'FormData', 'ReadableStream', 'WritableStream', 'TransformStream', 'URL', 'URLSearchParams', 'TextEncoder', 'TextDecoder', 'AbortController', 'AbortSignal'] as const) {
      const val = (globalThis as Record<string, unknown>)[key]
      if (val !== undefined) fetchGlobals[key] = val
    }
    Object.assign(this.global, fetchGlobals)
  }
}

export default NextApiEnvironment

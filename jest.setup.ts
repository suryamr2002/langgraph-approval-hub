import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill Web API globals required by next/server in Jest's node environment
Object.assign(global, { TextEncoder, TextDecoder })

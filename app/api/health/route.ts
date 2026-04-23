// app/api/health/route.ts
// Diagnostic endpoint — shows which env vars are present (never their values)
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      API_SECRET_TOKEN: !!process.env.API_SECRET_TOKEN,
      API_SECRET_TOKEN_length: process.env.API_SECRET_TOKEN?.length ?? 0,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      SLACK_WEBHOOK_URL: !!process.env.SLACK_WEBHOOK_URL,
      NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? 'not set',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'not set',
    },
  })
}

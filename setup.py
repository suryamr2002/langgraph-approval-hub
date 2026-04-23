#!/usr/bin/env python3
"""
LangGraph Approval Hub — first-time setup script
Run this after filling in your .env.local file.
"""

import sys
import os
import subprocess
import urllib.request
import urllib.error
import json

REQUIRED_VARS = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_APP_URL",
    "API_SECRET_TOKEN",
]

OPTIONAL_VARS = [
    "RESEND_API_KEY",
    "RESEND_FROM",
    "SLACK_WEBHOOK_URL",
    "NEXT_PUBLIC_DEMO_MODE",
    "CRON_SECRET",
]


def load_env(path=".env.local"):
    """Load key=value pairs from an env file, ignoring comments."""
    env = {}
    if not os.path.exists(path):
        return env
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                env[key.strip()] = value.strip()
    return env


def check_env(env):
    print("\n📋  Checking environment variables...")
    missing = []
    for var in REQUIRED_VARS:
        val = env.get(var, "")
        placeholder = "your-" in val or val.endswith("-here") or val == ""
        if placeholder:
            print(f"  ❌  {var} — not set or still a placeholder")
            missing.append(var)
        else:
            print(f"  ✅  {var}")
    for var in OPTIONAL_VARS:
        val = env.get(var, "")
        if val and "your-" not in val and not val.endswith("-here"):
            print(f"  ✅  {var} (optional)")
        else:
            print(f"  ⚪  {var} (optional, not set)")
    return missing


def check_supabase(env):
    print("\n🔌  Testing Supabase connection...")
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        print("  ⚠️   Skipping — SUPABASE_URL or SERVICE_ROLE_KEY not set")
        return False
    try:
        req = urllib.request.Request(
            f"{url}/rest/v1/approvals?select=id&limit=1",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
            },
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp.read()
        print("  ✅  Connected to Supabase successfully")
        return True
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("  ❌  Table 'approvals' not found — did you run the schema SQL?")
        else:
            print(f"  ❌  HTTP {e.code}: {e.reason}")
        return False
    except Exception as e:
        print(f"  ❌  Connection failed: {e}")
        return False


def print_next_steps(env, supabase_ok):
    url = env.get("NEXT_PUBLIC_APP_URL", "your-app.vercel.app")
    print("\n" + "=" * 60)
    print("🚀  Next steps")
    print("=" * 60)
    if not supabase_ok:
        print("""
  1. Run the schema SQL in your Supabase SQL editor:
     → https://app.supabase.com → SQL Editor → paste supabase/schema.sql

  2. Enable Realtime for the approvals table:
     → Run in SQL Editor:
       alter publication supabase_realtime add table approvals;
""")
    print(f"""  3. Deploy to Vercel:
     → vercel env pull   (if you have Vercel CLI)
     → Or add all .env.local variables to your Vercel project settings:
       https://vercel.com/your-team/your-project/settings/environment-variables

  4. Test your deployment:
     pip install langgraph-approval-hub
     python -c "
from langgraph_approval_hub import request_approval
result = request_approval(
    hub_url='{url}',
    api_token='your-API_SECRET_TOKEN',
    agent_name='SetupBot',
    action_description='Testing my new LangGraph Approval Hub deployment',
    assignee='you@example.com',
)
print(result)
"

  5. Star the repo and share! ⭐
     https://github.com/suryamr2002/langgraph-approval-hub
""")


def main():
    print("🤖  LangGraph Approval Hub — Setup")
    print("=" * 60)

    # Find env file
    env_file = ".env.local"
    if not os.path.exists(env_file):
        if os.path.exists(".env.example"):
            print(f"\n⚠️   No {env_file} found.")
            print("  Copy .env.example → .env.local and fill in your values, then re-run this script.")
        else:
            print(f"\n❌  No {env_file} or .env.example found.")
            print("  Are you in the project root directory?")
        sys.exit(1)

    env = load_env(env_file)
    missing = check_env(env)

    if missing:
        print(f"\n❌  {len(missing)} required variable(s) missing. Fill them in {env_file} and re-run.")
        sys.exit(1)

    supabase_ok = check_supabase(env)
    print_next_steps(env, supabase_ok)

    if supabase_ok:
        print("✅  Setup looks good! Deploy to Vercel and you're live.\n")
    else:
        print("⚠️   Fix the issues above, then re-run: python setup.py\n")


if __name__ == "__main__":
    main()

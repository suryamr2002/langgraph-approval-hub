# ⚡ LangGraph Approval Hub

> The missing piece in LangGraph production deployments.

LangGraph's `interrupt()` pauses your agent — but sends no notification, shows no UI, and provides no audit trail. This project fixes that.

**LangGraph Approval Hub** is a free, open-source dashboard that gives enterprise teams:
- Real-time view of all pending agent approvals
- Slack + email notifications when an agent is waiting
- Escalation if no one responds within your timeout
- Full audit log for compliance teams
- One-command deploy — forever free

## Live Demo

👉 **[langgraph-approval-hub.vercel.app](https://langgraph-approval-hub.vercel.app)** — try it with mock agents, no signup needed.

## Deploy Your Own (Free)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/suryamr2002/langgraph-approval-hub&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,RESEND_API_KEY,SLACK_WEBHOOK_URL,API_SECRET_TOKEN)

1. Click the button above
2. Create a free [Supabase](https://supabase.com) project and run `supabase/schema.sql`
3. Fill in the environment variables
4. Done — your private instance is live

## Integrate in 3 Lines

```bash
pip install langgraph-approval-hub
```

```python
from langgraph_approval_hub import request_approval

decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Finance Agent",
    action_description="Process $4,200 refund batch for 12 customers",
    assignee="finance-team",    # team name or email address
    assignee_type="team",
)

if decision == "approved":
    process_refunds()
```

## What Gets Built

| Gap in LangGraph | What We Provide |
|---|---|
| No notification when agent interrupts | Slack + email sent instantly |
| No UI to approve/reject | Clean web dashboard |
| No escalation if nobody responds | Configurable timeout + escalation chain |
| No audit trail | Full append-only decision history with CSV export |
| No team routing | Assign to a person or a named team |

## Stack (100% Free)

- **Next.js 14** on Vercel (free tier)
- **Supabase** PostgreSQL (free tier)
- **Resend** email (free — 100/day)
- **Slack Incoming Webhooks** (free)

## License

MIT

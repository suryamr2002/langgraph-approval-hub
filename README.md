# ⚡ LangGraph Approval Hub

> Your agent is about to wire $50,000. Who approves it?

You built a LangGraph agent that does something consequential — moves money, sends bulk emails, modifies production data. You wired up `interrupt()` to pause before the irreversible action. Now what?

**Who gets notified?** Nobody. **Where do they decide?** Nowhere. **What if they don't respond?** The agent waits forever.

LangGraph's `interrupt()` is the pause. **Approval Hub is everything that happens next.**

And you're not alone — [85% of teams building AI agents](https://www.gartner.com/en/newsroom/press-releases/2025-09-30-gartner-survey-finds-just-15-percent-of-it-application-leaders-are-considering-piloting-or-deploying-fully-autonomous-ai-agents) say human oversight is non-negotiable (Gartner, 2025).

---

## What LangGraph gives you vs what you still need

| | LangGraph | + Approval Hub |
|---|---|---|
| Pause agent execution | ✅ `interrupt()` | ✅ |
| Notify the approver | ❌ | ✅ Email + Slack |
| Dashboard to decide | ❌ | ✅ Ready-made UI |
| Escalate if no response | ❌ | ✅ Configurable timeout |
| Audit trail | ❌ | ✅ Append-only log |
| Route to a team | ❌ | ✅ Team routing |

---

## Live Demo

👉 **[langgraph-approval-hub.vercel.app](https://langgraph-approval-hub.vercel.app)** — live with mock agents, no signup needed.

---

## Deploy Your Own (Free, 5 minutes)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/suryamr2002/langgraph-approval-hub&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,RESEND_API_KEY,SLACK_WEBHOOK_URL,API_SECRET_TOKEN)

1. Click **Deploy to Vercel** above
2. Create a free [Supabase](https://supabase.com) project and run `supabase/schema.sql`
3. Fill in the environment variables in Vercel
4. Done — your private instance is live

Full setup guide → [your-hub.vercel.app/docs](https://langgraph-approval-hub.vercel.app/docs)

---

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
    action_description="Wire $50,000 to vendor ACME-001",
    assignee="finance-team",      # email address or team name
    assignee_type="team",
    escalate_to="cfo@acme.com",   # notified if no response
    timeout_minutes=30,
)

if decision == "approved":
    execute_wire_transfer()
```

The SDK blocks until a human decides. The moment they click Approve or Reject in the dashboard, your agent resumes.

---

## Real-world scenarios

**💸 Finance Agent** — *"Wire $50,000 to a new vendor account"*
Agent verified the details. One human needs to confirm. Without Approval Hub: nobody knows it's waiting.

**🗂 HR Agent** — *"Send rejection emails to 40 candidates"*
Pipeline ran overnight. Before firing 40 emails, someone should review the shortlist. `interrupt()` paused it — but who got pinged?

**🔧 Data Agent** — *"Drop and recreate the events_staging table"*
30-minute downtime window. The data team needs to approve before the pipeline runs.

---

## Interactive Demo Notebook

Try the full flow — agent → approval → decision — without deploying anything.

→ **[Open in Google Colab](https://colab.research.google.com/github/suryamr2002/langgraph-approval-hub/blob/main/demo.ipynb)**

---

## Stack (100% Free Tier)

| Service | What it does | Cost |
|---|---|---|
| Vercel | Hosts the Next.js dashboard | Free |
| Supabase | PostgreSQL database | Free |
| Resend | Email notifications | Free up to 100/day |
| Slack Webhooks | Slack notifications | Free |

---

## License

MIT — free to use, modify, and self-host.

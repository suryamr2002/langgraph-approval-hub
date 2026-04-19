# langgraph-approval-hub

Python SDK for [LangGraph Approval Hub](https://github.com/suryamr2002/langgraph-approval-hub) — add human-in-the-loop approval workflows to your LangGraph agents in 3 lines.

## Install

```bash
pip install langgraph-approval-hub
```

## Usage

```python
from langgraph_approval_hub import request_approval

decision = request_approval(
    hub_url="https://your-hub.vercel.app",
    api_token="your-api-secret-token",
    agent_name="Finance Agent",
    action_description="Process $4,200 refund batch for 12 customers",
    assignee="finance-team",
    assignee_type="team",
)

if decision == "approved":
    process_refunds()
```

`request_approval()` blocks until a human approves or rejects via the dashboard, then returns `"approved"` or `"rejected"`.

## Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `hub_url` | str | ✅ | — | Your Approval Hub URL |
| `api_token` | str | ✅ | — | Your `API_SECRET_TOKEN` env var value |
| `agent_name` | str | ✅ | — | Name shown in the dashboard |
| `action_description` | str | ✅ | — | Plain-English description of what the agent wants to do |
| `assignee` | str | ✅ | — | Email address or team name |
| `assignee_type` | str | ✅ | — | `"person"` or `"team"` |
| `agent_reasoning` | str | ❌ | None | Step-by-step reasoning shown to approver |
| `escalate_to` | str | ❌ | None | Email to escalate to if timeout exceeded |
| `timeout_minutes` | int | ❌ | 60 | Minutes before escalation |
| `poll_interval` | int | ❌ | 10 | Seconds between status polls |

## Links

- [Live Demo](https://langgraph-approval-hub.vercel.app)
- [GitHub](https://github.com/suryamr2002/langgraph-approval-hub)
- [Deploy Your Own (Free)](https://vercel.com/new/clone?repository-url=https://github.com/suryamr2002/langgraph-approval-hub)

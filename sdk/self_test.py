import sys, time, threading, requests

sys.path.insert(0, r'C:\Users\surya\OneDrive\Desktop\DS\Learn_claudeCode\langgraph-approval-hub\sdk')
from langgraph_approval_hub.client import request_approval

HUB_URL = "https://langgraph-approval-hub.vercel.app"
API_TOKEN = "hub-secret-2026-surya"
HEADERS = {"Authorization": f"Bearer {API_TOKEN}", "Content-Type": "application/json"}

def auto_approve():
    time.sleep(6)
    r = requests.get(f"{HUB_URL}/api/approvals", headers={"Authorization": f"Bearer {API_TOKEN}"})
    approvals = r.json()["approvals"]
    pending = [a for a in approvals if a["status"] == "pending" and a["agent_name"] == "SDK Self-Test"]
    if not pending:
        print(f"[auto-approve] No pending found. All statuses: {[a['status'] for a in approvals]}", flush=True)
        return
    aid = pending[0]["id"]
    print(f"[auto-approve] Approving {aid}", flush=True)
    d = requests.post(
        f"{HUB_URL}/api/approvals/{aid}/decide",
        headers=HEADERS,
        json={"decision": "approved", "decided_by": "auto-test", "note": "self-test"},
    )
    print(f"[auto-approve] Decide: {d.status_code} {d.json()}", flush=True)

t = threading.Thread(target=auto_approve, daemon=True)
t.start()

print("Calling request_approval (poll_interval=3s)...", flush=True)
start = time.time()
decision = request_approval(
    hub_url=HUB_URL,
    api_token=API_TOKEN,
    agent_name="SDK Self-Test",
    action_description="Testing full blocking flow",
    assignee="test@test.com",
    assignee_type="person",
    timeout_minutes=2,
    poll_interval=3,
)
elapsed = round(time.time() - start, 1)
print(f"Decision: {decision} (took {elapsed}s)", flush=True)

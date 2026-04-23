import time
import requests
from typing import Literal, Optional


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _post_approval(
    hub_url: str,
    api_token: str,
    agent_name: str,
    action_description: str,
    assignee: str,
    assignee_type: Literal["person", "team"],
    agent_reasoning: Optional[str],
    escalate_to: Optional[str],
    timeout_minutes: int,
) -> str:
    """Create an approval request and return the approval_id."""
    try:
        response = requests.post(
            f"{hub_url}/api/interrupt",
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
            json={
                "agent_name": agent_name,
                "action_description": action_description,
                "agent_reasoning": agent_reasoning,
                "assignee": assignee,
                "assignee_type": assignee_type,
                "escalate_to": escalate_to,
                "timeout_minutes": timeout_minutes,
            },
            timeout=30,
        )
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Network error contacting approval hub: {exc}") from exc

    if response.status_code != 201:
        raise RuntimeError(f"Failed to create approval: {response.text}")

    return response.json()["approval_id"]


def _poll_status(hub_url: str, api_token: str, approval_id: str) -> dict:
    """Fetch the current status dict for an approval."""
    try:
        resp = requests.get(
            f"{hub_url}/api/approvals/{approval_id}",
            headers={"Authorization": f"Bearer {api_token}"},
            timeout=30,
        )
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Network error polling approval hub: {exc}") from exc
    return resp.json()


def _fetch_pending(hub_url: str, api_token: str) -> list:
    """Fetch all pending approvals from the hub."""
    try:
        resp = requests.get(
            f"{hub_url}/api/approvals",
            headers={"Authorization": f"Bearer {api_token}"},
            params={"status": "pending"},
            timeout=30,
        )
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Network error fetching pending approvals: {exc}") from exc

    if resp.status_code != 200:
        raise RuntimeError(f"Failed to fetch pending approvals: {resp.text}")

    return resp.json().get("approvals", [])


# ---------------------------------------------------------------------------
# Sync / blocking API
# ---------------------------------------------------------------------------

def request_approval(
    hub_url: str,
    api_token: str,
    agent_name: str,
    action_description: str,
    assignee: str,
    assignee_type: Literal["person", "team"],
    agent_reasoning: Optional[str] = None,
    escalate_to: Optional[str] = None,
    timeout_minutes: int = 60,
    poll_interval: int = 10,
) -> Literal["approved", "rejected"]:
    """
    Submit an approval request and BLOCK until a human decides.

    Returns "approved" or "rejected".
    Raises RuntimeError on network / hub errors.
    Raises TimeoutError if no decision within timeout_minutes.

    Use this for simple sequential workflows where you want the agent to pause
    and wait for a human response before continuing.

    Example::

        result = request_approval(
            hub_url=HUB_URL,
            api_token=API_TOKEN,
            agent_name="data-pipeline",
            action_description="Delete 500 rows from production DB",
            assignee="ops@example.com",
            assignee_type="person",
        )
        if result == "approved":
            delete_rows()
    """
    approval_id = _post_approval(
        hub_url, api_token, agent_name, action_description,
        assignee, assignee_type, agent_reasoning, escalate_to, timeout_minutes,
    )
    deadline = time.monotonic() + timeout_minutes * 60

    while True:
        if time.monotonic() >= deadline:
            raise TimeoutError(
                f"No decision received for approval {approval_id} within {timeout_minutes} minutes"
            )

        data = _poll_status(hub_url, api_token, approval_id)
        status = data.get("status")

        if status in ("approved", "rejected", "expired"):
            return "approved" if status == "approved" else "rejected"

        time.sleep(poll_interval)


# ---------------------------------------------------------------------------
# Async / non-blocking API
# ---------------------------------------------------------------------------

def submit_approval(
    hub_url: str,
    api_token: str,
    agent_name: str,
    action_description: str,
    assignee: str,
    assignee_type: Literal["person", "team"],
    agent_reasoning: Optional[str] = None,
    escalate_to: Optional[str] = None,
    timeout_minutes: int = 60,
) -> str:
    """
    Submit an approval request and return immediately with the approval_id.

    Use this when you don't want to block — submit many approvals in one shot,
    let humans review them in the dashboard, then check results later with
    get_decision() or get_pending().

    Example::

        # Fire-and-forget: queue up tasks for human review
        id1 = submit_approval(hub_url, api_token, agent_name="bot",
                              action_description="Send newsletter",
                              assignee="team@example.com", assignee_type="team")
        id2 = submit_approval(hub_url, api_token, agent_name="bot",
                              action_description="Archive old records",
                              assignee="team@example.com", assignee_type="team")

        # ... do other work ...

        # Check results at end of day
        r1 = get_decision(hub_url, api_token, id1)
        r2 = get_decision(hub_url, api_token, id2)
    """
    return _post_approval(
        hub_url, api_token, agent_name, action_description,
        assignee, assignee_type, agent_reasoning, escalate_to, timeout_minutes,
    )


def get_decision(
    hub_url: str,
    api_token: str,
    approval_id: str,
) -> Optional[Literal["approved", "rejected", "expired", "pending", "escalated"]]:
    """
    Check the current decision for a previously submitted approval.

    Returns the status string — one of:
        "pending"    — still waiting for a human decision
        "escalated"  — escalated to a secondary reviewer
        "approved"   — approved by a human
        "rejected"   — rejected by a human
        "expired"    — timed out with no decision

    Does NOT block. Call repeatedly or call once at end of batch.

    Example::

        status = get_decision(hub_url, api_token, approval_id)
        if status == "approved":
            run_task()
        elif status == "pending":
            print("Still waiting...")
    """
    data = _poll_status(hub_url, api_token, approval_id)
    return data.get("status")


def get_pending(
    hub_url: str,
    api_token: str,
) -> list:
    """
    Return all approvals that are currently pending (awaiting human decision).

    Each item in the list is a dict with keys:
        id, agent_name, action_description, agent_reasoning,
        assignee, assignee_type, status, created_at, expires_at

    Use this to give users a summary of what still needs review, or to
    build batch workflows where you submit many tasks and check at intervals.

    Example::

        pending = get_pending(hub_url, api_token)
        print(f"{len(pending)} tasks still awaiting approval:")
        for task in pending:
            print(f"  - [{task['agent_name']}] {task['action_description']}")
    """
    return _fetch_pending(hub_url, api_token)

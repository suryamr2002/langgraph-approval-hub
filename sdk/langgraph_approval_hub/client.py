import time
import requests
from typing import Literal, Optional


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
    Post an approval request to the hub, then block until a human decides.

    Returns "approved" or "rejected".
    Raises RuntimeError if the hub rejects the request or a network error occurs.
    Raises TimeoutError if no decision is made within timeout_minutes.
    """
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

    approval_id = response.json()["approval_id"]
    deadline = time.monotonic() + timeout_minutes * 60

    while True:
        if time.monotonic() >= deadline:
            raise TimeoutError(
                f"No decision received for approval {approval_id} within {timeout_minutes} minutes"
            )

        try:
            poll = requests.get(
                f"{hub_url}/api/approvals/{approval_id}",
                headers={"Authorization": f"Bearer {api_token}"},
                timeout=30,
            )
        except requests.exceptions.RequestException as exc:
            raise RuntimeError(f"Network error polling approval hub: {exc}") from exc

        data = poll.json()
        status = data.get("status")

        if status in ("approved", "rejected", "expired"):
            return "approved" if status == "approved" else "rejected"

        time.sleep(poll_interval)

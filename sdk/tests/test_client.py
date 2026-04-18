import pytest
from unittest.mock import patch, MagicMock, call
from langgraph_approval_hub.client import request_approval


def _mock_post(approval_id: str):
    mock = MagicMock()
    mock.status_code = 201
    mock.json.return_value = {"approval_id": approval_id}
    return mock


def _mock_get(status: str):
    mock = MagicMock()
    mock.status_code = 200
    mock.json.return_value = {"status": status}
    return mock


def test_request_approval_returns_approved():
    with patch("requests.post", return_value=_mock_post("test-id")) as mock_post, \
         patch("requests.get", return_value=_mock_get("approved")) as mock_get:

        result = request_approval(
            hub_url="http://localhost:3000",
            api_token="test-token",
            agent_name="Test Agent",
            action_description="Do something",
            assignee="team-a",
            assignee_type="team",
            poll_interval=0,
        )

        assert result == "approved"
        mock_post.assert_called_once()
        mock_get.assert_called_once()


def test_request_approval_returns_rejected():
    with patch("requests.post", return_value=_mock_post("test-id")), \
         patch("requests.get", return_value=_mock_get("rejected")):

        result = request_approval(
            hub_url="http://localhost:3000",
            api_token="test-token",
            agent_name="Test Agent",
            action_description="Do something",
            assignee="priya@example.com",
            assignee_type="person",
            poll_interval=0,
        )
        assert result == "rejected"


def test_request_approval_raises_on_server_error():
    mock = MagicMock()
    mock.status_code = 500
    mock.text = "Internal Server Error"

    with patch("requests.post", return_value=mock):
        with pytest.raises(RuntimeError, match="Failed to create approval"):
            request_approval(
                hub_url="http://localhost:3000",
                api_token="test-token",
                agent_name="Test Agent",
                action_description="Do something",
                assignee="priya@example.com",
                assignee_type="person",
                poll_interval=0,
            )


def test_request_approval_polls_until_decided():
    """First poll returns pending, second returns approved."""
    pending = _mock_get("pending")
    approved = _mock_get("approved")

    with patch("requests.post", return_value=_mock_post("test-id")), \
         patch("requests.get", side_effect=[pending, approved]):

        result = request_approval(
            hub_url="http://localhost:3000",
            api_token="test-token",
            agent_name="Test Agent",
            action_description="Do something",
            assignee="team-a",
            assignee_type="team",
            poll_interval=0,
        )

        assert result == "approved"


def test_request_approval_raises_on_timeout():
    """Client-side timeout raises TimeoutError when deadline passes."""
    with patch("requests.post", return_value=_mock_post("test-id")), \
         patch("requests.get", return_value=_mock_get("pending")), \
         patch("time.monotonic", side_effect=[0.0, 0.0, 9999.0]):

        with pytest.raises(TimeoutError):
            request_approval(
                hub_url="http://localhost:3000",
                api_token="test-token",
                agent_name="Test Agent",
                action_description="Do something",
                assignee="team-a",
                assignee_type="team",
                timeout_minutes=1,
                poll_interval=0,
            )

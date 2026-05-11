import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class ZoomIntegrationError(Exception):
    """Raised when Zoom integration fails."""


def get_zoom_access_token() -> str:
    """Request a Zoom Server-to-Server OAuth access token.

    Uses the account_credentials grant type and returns the Bearer token.
    """
    account_id = getattr(settings, "ZOOM_ACCOUNT_ID", None)
    client_id = getattr(settings, "ZOOM_CLIENT_ID", None)
    client_secret = getattr(settings, "ZOOM_CLIENT_SECRET", None)

    if not account_id or not client_id or not client_secret:
        raise ZoomIntegrationError(
            "Zoom credentials are not configured."
            " Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET."
        )

    token_url = "https://zoom.us/oauth/token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "grant_type": "account_credentials",
        "account_id": account_id,
    }

    try:
        response = requests.post(
            token_url,
            headers=headers,
            data=data,
            auth=(client_id, client_secret),
            timeout=15,
        )
    except requests.RequestException as exc:
        logger.exception("Zoom access token request failed: %s", exc)
        raise ZoomIntegrationError("Unable to reach Zoom OAuth server.") from exc

    if response.status_code != 200:
        logger.error(
            "Zoom access token request returned %s: %s",
            response.status_code,
            response.text,
        )
        raise ZoomIntegrationError(
            f"Zoom token request failed ({response.status_code})."
        )

    try:
        payload = response.json()
    except ValueError as exc:
        logger.exception("Zoom access token response JSON parse failed: %s", exc)
        raise ZoomIntegrationError("Invalid Zoom token response.") from exc

    access_token = payload.get("access_token")
    if not access_token:
        raise ZoomIntegrationError("Zoom did not return an access token.")

    return access_token


def _normalize_start_time(start_time: Any) -> str:
    if isinstance(start_time, str):
        return start_time

    if isinstance(start_time, datetime):
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        start_time = start_time.astimezone(timezone.utc)
        return start_time.isoformat().replace("+00:00", "Z")

    raise ZoomIntegrationError(
        "start_time must be a datetime or ISO-formatted string."
    )


def create_zoom_meeting(
    topic: str,
    start_time: Any,
    duration: int,
    host_email: str,
    timezone_name: str = None,
) -> Dict[str, Optional[str]]:
    """Create a Zoom meeting for the given host email.

    The host user must exist in the Zoom account and be authorized to create meetings.
    """
    access_token = get_zoom_access_token()
    start_time_value = _normalize_start_time(start_time)

    meeting_url = f"https://api.zoom.us/v2/users/{host_email}/meetings"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    if timezone_name is None:
        timezone_name = getattr(settings, "TIME_ZONE", "Asia/Karachi")

    payload = {
        "topic": topic,
        "type": 2,
        "start_time": start_time_value,
        "duration": int(duration),
        "timezone": timezone_name,
        "settings": {
            "join_before_host": True,
            "approval_type": 0,
            "waiting_room": False,
        },
    }

    try:
        response = requests.post(
            meeting_url,
            headers=headers,
            json=payload,
            timeout=15,
        )
    except requests.RequestException as exc:
        logger.exception("Zoom meeting creation request failed: %s", exc)
        raise ZoomIntegrationError("Unable to reach Zoom meeting API.") from exc

    if response.status_code not in (201, 200):
        logger.error(
            "Zoom meeting creation failed %s: %s",
            response.status_code,
            response.text,
        )
        raise ZoomIntegrationError(
            f"Zoom meeting creation failed ({response.status_code})."
        )

    try:
        data = response.json()
    except ValueError as exc:
        logger.exception("Zoom meeting creation response JSON parse failed: %s", exc)
        raise ZoomIntegrationError("Invalid Zoom meeting creation response.") from exc

    meeting_id = data.get("id")
    join_url = data.get("join_url")
    if not meeting_id or not join_url:
        logger.error("Zoom meeting response missing id or join_url: %s", data)
        raise ZoomIntegrationError("Zoom meeting response did not include meeting details.")

    return {
        "id": meeting_id,
        "join_url": join_url,
    }

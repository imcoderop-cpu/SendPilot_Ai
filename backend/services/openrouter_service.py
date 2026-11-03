"""OpenRouter client lifecycle and structured SpendPilot AI generation."""

import json
import logging
import os
import threading
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

from backend.services.prompts import SYSTEM_INSTRUCTION, TASK_PROMPTS

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[2]
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/"
DEFAULT_MODEL = "nvidia/nemotron-3.5-super-vl:free"
_client: httpx.Client | None = None
_client_lock = threading.Lock()


class OpenRouterUnavailableError(Exception):
    """Raised when OpenRouter cannot produce a usable answer."""


def _load_environment() -> None:
    for candidate in (
        ROOT_DIR / ".env",
        ROOT_DIR / "frontend" / ".env",
        ROOT_DIR / "frontend" / ".env" / ".env",
        ROOT_DIR / "frontend" / ".env" / "Untitled",
    ):
        if candidate.is_file():
            load_dotenv(candidate, override=False)


def _get_client() -> httpx.Client:
    global _client
    if _client is not None:
        return _client

    with _client_lock:
        if _client is None:
            _load_environment()
            api_key = os.getenv("OPENROUTER_API_KEY")
            if not api_key:
                raise OpenRouterUnavailableError(
                    "OpenRouter is not configured. Set OPENROUTER_API_KEY in the backend environment."
                )
            _client = httpx.Client(
                base_url=OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "SpendPilot AI",
                },
                timeout=httpx.Timeout(20.0, connect=8.0),
            )
    return _client


def reset_client_for_tests() -> None:
    """Close and clear the shared client so tests can change environment."""
    global _client
    with _client_lock:
        if _client is not None:
            _client.close()
            _client = None


def _provider_error(response: httpx.Response) -> OpenRouterUnavailableError:
    if response.status_code in (401, 403):
        return OpenRouterUnavailableError(
            "OpenRouter rejected the configured API key. Replace OPENROUTER_API_KEY with an active OpenRouter key, then restart the backend."
        )
    if response.status_code == 402:
        return OpenRouterUnavailableError(
            "OpenRouter could not fulfill this request. Check the key's account status and free-model availability."
        )
    if response.status_code == 429:
        return OpenRouterUnavailableError(
            "The free AI model is busy or its request limit was reached. Please wait a moment and retry."
        )
    logger.warning("OpenRouter request returned HTTP %s", response.status_code)
    return OpenRouterUnavailableError(
        "The AI service is temporarily unavailable. Please try again."
    )


def generate_feature_response(
    feature: str,
    *,
    message: str | None = None,
    context: dict[str, Any],
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Generate and validate the structured response consumed by the API."""
    if feature not in TASK_PROMPTS:
        raise ValueError(f"Unsupported AI feature: {feature}")

    prompt_content: dict[str, Any] = {"business_data": context}
    if message:
        prompt_content["user_message"] = message

    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": (
                f"{SYSTEM_INSTRUCTION}\n\nFeature task: {TASK_PROMPTS[feature]}"
            ),
        }
    ]
    messages.extend(history or [])
    messages.append(
        {
            "role": "user",
            "content": json.dumps(
                prompt_content,
                ensure_ascii=False,
                separators=(",", ":"),
            ),
        }
    )

    try:
        response = _get_client().post(
            "chat/completions",
            json={
                "model": os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL),
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 1_800,
                "reasoning": {"effort": "none"},
                "response_format": {"type": "json_object"},
            },
        )
        if not response.is_success:
            raise _provider_error(response)

        payload = response.json()
        choices = payload.get("choices")
        choice = (
            choices[0]
            if isinstance(choices, list) and choices and isinstance(choices[0], dict)
            else {}
        )
        content = (
            choice.get("message", {}).get("content")
            if isinstance(choice.get("message"), dict)
            else None
        )
        if not isinstance(content, str) or not content.strip():
            if choice.get("finish_reason") == "length":
                raise OpenRouterUnavailableError(
                    "The AI response exceeded its output limit. Please retry."
                )
            raise OpenRouterUnavailableError(
                "The AI response was empty. Please retry."
            )
        parsed = json.loads(content)
        if (
            not isinstance(parsed, dict)
            or not isinstance(parsed.get("message"), str)
            or not parsed["message"].strip()
            or not isinstance(parsed.get("data", {}), dict)
        ):
            raise OpenRouterUnavailableError(
                "The AI response could not be processed. Please retry."
            )
        return {"message": parsed["message"].strip(), "data": parsed.get("data", {})}
    except OpenRouterUnavailableError:
        raise
    except (httpx.TimeoutException, httpx.NetworkError) as error:
        logger.warning("OpenRouter request failed (%s)", type(error).__name__)
        raise OpenRouterUnavailableError(
            "The AI service did not respond in time. Please try again."
        ) from error
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        logger.warning("OpenRouter returned an unusable response for %s", feature)
        raise OpenRouterUnavailableError(
            "The AI response could not be processed. Please retry."
        ) from error
    except Exception as error:
        logger.error(
            "OpenRouter request failed for %s (%s)",
            feature,
            type(error).__name__,
        )
        raise OpenRouterUnavailableError(
            "The AI service is temporarily unavailable. Please try again."
        ) from error

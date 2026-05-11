"""
AI provider integration (Ollama local + Groq + Gemini + OpenAI fallback).

The API layer calls ``get_ai_response(messages)`` and does not care which provider
is behind it — switching is controlled via settings.USE_LOCAL_AI / USE_GROQ / USE_GEMINI.
"""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
import requests
from openai import OpenAI

logger = logging.getLogger(__name__)

SAFE_FALLBACK_MESSAGE = 'Sorry, I am having trouble responding right now.'
REQUEST_TIMEOUT_S = 60


def ollama_response(messages: list[dict[str, Any]]) -> str:
    """
    Call Ollama's chat endpoint and return the assistant's plain-text reply.

    Expected endpoint: settings.OLLAMA_URL (default http://localhost:11434/api/chat)
    Body:
      {
        "model": "llama3",
        "messages": [...],
        "stream": false
      }
    """
    url = getattr(settings, 'OLLAMA_URL', 'http://localhost:11434/api/chat')
    model = getattr(settings, 'OLLAMA_MODEL', 'llama3')

    logger.info('AI provider=ollama model=%s', model)
    timeout_s = int(getattr(settings, 'OLLAMA_TIMEOUT_S', 15))
    resp = requests.post(
        url,
        json={
            "model": model,
            "messages": messages,
            "stream": False
        },
        timeout=timeout_s
    )
    resp.raise_for_status()
    data = resp.json()
    text = ((data.get('message') or {}).get('content') or '').strip()
    if not text:
        raise ValueError('Empty completion from Ollama.')
    return text


def openai_response(messages: list[dict[str, Any]]) -> str:
    """
    Call OpenAI chat completions and return the assistant's plain-text reply.

    ``messages`` must follow the OpenAI chat shape, e.g.:
      [{"role":"system","content":"..."},{"role":"user","content":"..."}]
    """
    api_key = (getattr(settings, 'OPENAI_API_KEY', None) or '').strip()
    if not api_key:
        raise ValueError('OPENAI_API_KEY is not configured.')

    # Client is lightweight; constructing per request avoids stale settings in tests.
    client = OpenAI(api_key=api_key, timeout=REQUEST_TIMEOUT_S)
    model = getattr(settings, 'OPENAI_CHAT_MODEL', 'gpt-4o-mini')
    logger.info('AI provider=openai model=%s', model)

    completion = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.4,
        max_tokens=400,
    )

    choice = completion.choices[0].message
    text = (choice.content or '').strip()
    if not text:
        raise ValueError('Empty completion from OpenAI.')
    return text


def groq_response(messages: list[dict[str, Any]]) -> str:
    api_key = (getattr(settings, 'GROQ_API_KEY', None) or '').strip()
    if not api_key:
        raise ValueError('GROQ_API_KEY is not configured.')

    client = OpenAI(
        api_key=api_key,
        base_url='https://api.groq.com/openai/v1',
        timeout=REQUEST_TIMEOUT_S,
    )
    model = getattr(settings, 'GROQ_MODEL', 'llama3-8b-8192')
    logger.info('AI provider=groq model=%s', model)

    completion = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.4,
        max_tokens=400,
    )

    choice = completion.choices[0].message
    text = (choice.content or '').strip()
    if not text:
        raise ValueError('Empty completion from Groq.')
    return text


def _merge_messages(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for row in messages:
        role = (row.get('role') or 'user').strip()
        content = (row.get('content') or '').strip()
        if not content:
            continue
        prefix = role.capitalize()
        lines.append(f"{prefix}: {content}")
    return '\n'.join(lines).strip()


def gemini_response(messages: list[dict[str, Any]]) -> str:
    api_key = (getattr(settings, 'GEMINI_API_KEY', None) or '').strip()
    if not api_key:
        raise ValueError('GEMINI_API_KEY is not configured.')

    merged_text = _merge_messages(messages)
    if not merged_text:
        raise ValueError('Empty prompt for Gemini.')

    url = (
        'https://generativelanguage.googleapis.com/v1beta/models/'
        'gemini-flash-latest:generateContent'
    )
    payload = {
        'contents': [
            {
                'parts': [
                    {'text': merged_text}
                ]
            }
        ]
    }

    resp = requests.post(
        url,
        json=payload,
        headers={
            'Content-Type': 'application/json',
            'X-goog-api-key': api_key,
        },
        timeout=REQUEST_TIMEOUT_S,
    )
    resp.raise_for_status()
    data = resp.json()

    candidates = data.get('candidates') or []
    if not candidates:
        raise ValueError('Empty completion from Gemini.')

    content = (candidates[0].get('content') or {})
    parts = content.get('parts') or []
    if not parts:
        raise ValueError('Empty completion from Gemini.')

    text = (parts[0].get('text') or '').strip()
    if not text:
        raise ValueError('Empty completion from Gemini.')
    return text


def get_ai_response(messages: list[dict[str, Any]]) -> str:
    """
    Provider priority:
      1) USE_LOCAL_AI -> Ollama
      2) USE_GROQ -> Groq
      3) USE_GEMINI -> Gemini
      4) OpenAI fallback
    """
    use_local = bool(getattr(settings, 'USE_LOCAL_AI', False))
    use_groq = bool(getattr(settings, 'USE_GROQ', False))
    use_gemini = bool(getattr(settings, 'USE_GEMINI', False))
    openai_key = (getattr(settings, 'OPENAI_API_KEY', None) or '').strip()
    groq_key = (getattr(settings, 'GROQ_API_KEY', None) or '').strip()
    gemini_key = (getattr(settings, 'GEMINI_API_KEY', None) or '').strip()

    providers: list[tuple[str, callable]] = []
    if use_local:
        providers.append(('ollama', ollama_response))
    if use_groq and groq_key:
        providers.append(('groq', groq_response))
    if use_gemini and gemini_key:
        providers.append(('gemini', gemini_response))
    if openai_key:
        providers.append(('openai', openai_response))
    if not use_local:
        providers.append(('ollama', ollama_response))

    for name, handler in providers:
        try:
            return handler(messages)
        except Exception:
            logger.exception('AI provider failed: %s', name)

    return SAFE_FALLBACK_MESSAGE

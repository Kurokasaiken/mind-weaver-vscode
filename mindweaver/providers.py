"""Provider adapters for official AI APIs."""
import os
import httpx
from .config import Config
from .models import Message


class ProviderError(Exception):
    pass


OPENAI_COMPATIBLE = {"openai", "groq", "openrouter"}

BASE_URLS = {
    "openai": "https://api.openai.com/v1",
    "groq": "https://api.groq.com/openai/v1",
    "openrouter": "https://openrouter.ai/api/v1",
    "anthropic": "https://api.anthropic.com/v1",
}

DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "groq": "llama-3.3-70b-versatile",
    "openrouter": "openai/gpt-4o-mini",
    "anthropic": "claude-3-5-sonnet-20241022",
}


async def chat(provider: str, messages: list[Message], api_key: str | None = None, model: str | None = None, **kwargs) -> str:
    """Call a single provider with a list of messages."""
    cfg = Config()
    provider_cfg = cfg.providers().get(provider, {})

    key = api_key or provider_cfg.get("api_key") or os.environ.get(f"{provider.upper()}_API_KEY")
    if not key:
        raise ProviderError(f"Missing API key for {provider}")

    selected_model = model or provider_cfg.get("model") or DEFAULT_MODELS.get(provider)
    if not selected_model:
        raise ProviderError(f"No model configured for {provider}")

    base_url = provider_cfg.get("base_url") or BASE_URLS.get(provider)
    if not base_url:
        raise ProviderError(f"Unknown provider {provider}")

    if provider in OPENAI_COMPATIBLE:
        return await _openai_chat(base_url, key, selected_model, messages, **kwargs)
    if provider == "anthropic":
        return await _anthropic_chat(base_url, key, selected_model, messages, **kwargs)

    raise ProviderError(f"Provider {provider} not yet implemented")


async def _openai_chat(base_url: str, api_key: str, model: str, messages: list[Message], **kwargs) -> str:
    payload = {
        "model": model,
        "messages": [{"role": m.role, "content": m.content} for m in messages],
        **kwargs,
    }
    async with httpx.AsyncClient(
        base_url=base_url,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        timeout=60.0,
    ) as client:
        r = await client.post("/chat/completions", json=payload)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"]


async def _anthropic_chat(base_url: str, api_key: str, model: str, messages: list[Message], **kwargs) -> str:
    system: str | None = None
    msgs: list[dict] = []
    for m in messages:
        if m.role == "system" and system is None:
            system = m.content
        else:
            msgs.append({"role": m.role, "content": m.content})

    payload: dict = {
        "model": model,
        "max_tokens": 1024,
        "messages": msgs,
        **kwargs,
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(
        base_url=base_url,
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
        timeout=60.0,
    ) as client:
        r = await client.post("/messages", json=payload)
        r.raise_for_status()
        data = r.json()
        return data["content"][0]["text"]
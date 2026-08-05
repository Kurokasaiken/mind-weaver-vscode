"""Multi-AI deliberation engine."""
import asyncio
from .models import DeliberationRequest, DeliberationResponse, Message
from .providers import chat, ProviderError
from .config import Config
from .prompt_enhancers import BASE_PROMPTS, apply_hat, auto_hat


def _configured_providers() -> list[str]:
    """Return list of provider names from config, or default to openai."""
    cfg = Config()
    names = list(cfg.providers().keys())
    return names if names else ["openai"]


async def _run(request: DeliberationRequest, method: str) -> DeliberationResponse:
    """Run a multi-AI request with the base enhancer for the method and chosen hat."""
    providers = request.providers or _configured_providers()
    base_prompt = BASE_PROMPTS.get(method, BASE_PROMPTS["explore"])

    hat = request.hat or auto_hat(request.prompt + "\n" + (request.file_content or ""))
    system_prompt = apply_hat(base_prompt, hat)

    messages = [
        Message(role="system", content=system_prompt),
        Message(role="user", content=_build_user_prompt(request)),
    ]

    tasks = [chat(p, messages) for p in providers]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    output: list[str] = []
    log: list[str] = []
    for provider, result in zip(providers, results):
        if isinstance(result, ProviderError):
            log.append(f"{provider}: ERROR - {result}")
            output.append(f"**{provider}**: _errore nella chiamata API_")
        elif isinstance(result, Exception):
            log.append(f"{provider}: ERROR - {type(result).__name__}: {result}")
            output.append(f"**{provider}**: _errore nella chiamata API_")
        else:
            log.append(f"{provider}: OK ({len(result)} chars)")
            output.append(f"**{provider}**\n{result}")

    return DeliberationResponse(
        result="\n\n---\n\n".join(output),
        log=log,
    )


async def critique(request: DeliberationRequest) -> DeliberationResponse:
    """Run multi-AI critique on a file or selection."""
    return await _run(request, "critique")


async def explore(request: DeliberationRequest) -> DeliberationResponse:
    """Run multi-AI exploration of an idea."""
    return await _run(request, "explore")


async def plan(request: DeliberationRequest) -> DeliberationResponse:
    """Run multi-AI plan generation for a goal."""
    return await _run(request, "plan")


def _build_user_prompt(request: DeliberationRequest) -> str:
    parts = [f"Richiesta: {request.prompt}"]
    if request.file_path:
        scope = "Selezione" if request.is_selection else "File"
        parts.append(f"{scope}: {request.file_path}")
    if request.file_content:
        parts.append("---\n" + request.file_content)
    return "\n\n".join(parts)
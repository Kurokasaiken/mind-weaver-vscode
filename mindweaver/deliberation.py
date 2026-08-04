"""Multi-AI deliberation engine."""
import asyncio
from .models import DeliberationRequest, DeliberationResponse, Message
from .providers import chat, ProviderError


SYSTEM_PROMPT = """Sei un ingegnere senior. Il tuo compito è criticare il contenuto fornito, evidenziare:
- assunzioni nascoste o non dichiarate
- omissioni o rischi
- contraddizioni interne
- problemi di manutenibilità, sicurezza o prestazioni

Sii conciso ma costruttivo."""


async def critique(request: DeliberationRequest) -> DeliberationResponse:
    """Run multi-AI critique on a file."""
    providers = request.providers or ["openai"]

    messages = [
        Message(role="system", content=SYSTEM_PROMPT),
        Message(
            role="user",
            content=_build_user_prompt(request),
        ),
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


def _build_user_prompt(request: DeliberationRequest) -> str:
    parts = [f"Richiesta: {request.prompt}"]
    if request.file_path:
        parts.append(f"File: {request.file_path}")
    if request.file_content:
        parts.append("---\n" + request.file_content)
    return "\n\n".join(parts)
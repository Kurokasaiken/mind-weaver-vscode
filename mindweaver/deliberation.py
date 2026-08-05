"""Multi-AI deliberation engine."""
import asyncio
from .models import DeliberationRequest, DeliberationResponse, Message
from .providers import chat, ProviderError
from .config import Config


CRITIQUE_PROMPT = """Sei un ingegnere senior. Il tuo compito è criticare il contenuto fornito, evidenziare:
- assunzioni nascoste o non dichiarate
- omissioni o rischi
- contraddizioni interne
- problemi di manutenibilità, sicurezza o prestazioni

Sii conciso ma costruttivo."""

EXPLORE_PROMPT = """Sei un consulente senior. Esplora l'idea fornita da più angolazioni.
Restituisci:
- opzioni concrete
- pro e contro di ogni opzione
- rischi principali
- raccomandazione finale

Sii conciso e utile."""

PLAN_PROMPT = """Sei un product manager senior. Crea un piano verificabile e concreto per il goal fornito.
Scomponi in step numerati. Per ogni step indica:
- descrizione
- criterio di successo
- strumenti/risorse necessari
- dipendenze

Sii realista e sintetico."""


HAT_INSTRUCTIONS = {
    "ruthless_critique": "Adotta una prospettiva spietata: smonta ogni assunzione, evidenzia ogni debolezza e non cercare di compiacere.",
    "system_design": "Adotta una prospettiva di system design: architettura, scalabilità, accoppiamenti, interfacce e vincoli.",
    "software_engineer": "Adotta una prospettiva di ingegnere software: implementabilità, edge case, test, leggibilità e manutenibilità.",
}


def _apply_hat(base_prompt: str, hat: Optional[str]) -> str:
    if not hat or hat not in HAT_INSTRUCTIONS:
        return base_prompt
    return base_prompt + "\n\n" + HAT_INSTRUCTIONS[hat]


def _configured_providers() -> list[str]:
    """Return list of provider names from config, or default to openai."""
    cfg = Config()
    names = list(cfg.providers().keys())
    return names if names else ["openai"]


async def _run(request: DeliberationRequest, system_prompt: str) -> DeliberationResponse:
    """Run a multi-AI request with the given system prompt."""
    providers = request.providers or _configured_providers()

    messages = [
        Message(role="system", content=_apply_hat(system_prompt, request.hat)),
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
    """Run multi-AI critique on a file."""
    return await _run(request, CRITIQUE_PROMPT)


async def explore(request: DeliberationRequest) -> DeliberationResponse:
    """Run multi-AI exploration of an idea."""
    return await _run(request, EXPLORE_PROMPT)


async def plan(request: DeliberationRequest) -> DeliberationResponse:
    """Run multi-AI plan generation for a goal."""
    return await _run(request, PLAN_PROMPT)


def _build_user_prompt(request: DeliberationRequest) -> str:
    parts = [f"Richiesta: {request.prompt}"]
    if request.file_path:
        scope = "Selezione" if request.is_selection else "File"
        parts.append(f"{scope}: {request.file_path}")
    if request.file_content:
        parts.append("---\n" + request.file_content)
    return "\n\n".join(parts)
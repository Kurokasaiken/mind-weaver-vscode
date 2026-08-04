"""JSON-RPC server over stdio for Mind Weaver core."""
import json
import sys
import asyncio
from . import __version__
from .deliberation import critique
from .models import DeliberationRequest


async def serve() -> None:
    """Read JSON-RPC requests from stdin and write responses to stdout."""
    print(f"Mind Weaver core {__version__} listening on stdio", file=sys.stderr)
    while True:
        line = await asyncio.get_event_loop().run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            _write({"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}})
            continue
        response = await _handle_request(req)
        _write(response)


async def _handle_request(req: dict) -> dict:
    req_id = req.get("id")
    method = req.get("method")
    params = req.get("params", {})

    if method == "critique":
        try:
            request = DeliberationRequest(**params)
            result = await critique(request)
            return {"jsonrpc": "2.0", "id": req_id, "result": result.model_dump()}
        except Exception as exc:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32603, "message": f"Internal error: {exc}"},
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def _write(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()


def main() -> None:
    asyncio.run(serve())
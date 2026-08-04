"""CLI entrypoint for Mind Weaver core."""
import argparse
import asyncio
import sys
from pathlib import Path

from .models import DeliberationRequest
from .deliberation import critique


def main() -> None:
    parser = argparse.ArgumentParser(description="Mind Weaver CLI")
    sub = parser.add_subparsers(dest="command")
    crit = sub.add_parser("critique", help="Critica un file")
    crit.add_argument("file")
    args = parser.parse_args()
    if args.command == "critique":
        path = Path(args.file)
        if not path.exists():
            print(f"File non trovato: {args.file}", file=sys.stderr)
            sys.exit(1)
        content = path.read_text(encoding="utf-8")
        request = DeliberationRequest(
            prompt="Critica il file seguente.",
            file_path=args.file,
            file_content=content,
        )
        response = asyncio.run(critique(request))
        print(response.result)
    else:
        parser.print_help()
        sys.exit(1)
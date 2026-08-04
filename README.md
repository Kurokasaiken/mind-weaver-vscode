# Mind Weaver — an AI team of experts at your wish

A VS Code extension that turns your AI models into a deliberative team. Explore ideas, create plans, and validate with multiple AI experts — before the first line of code.

## Why

Vibe coding is huge, but only 29% of developers trust AI-generated code. Mind Weaver does not write code for you. It helps you think before the AI writes, so your vibes become durable decisions.

## What it does

- `> Mind Weaver: Validate with AI experts` — critique the current file with multiple AI models.
- `> Mind Weaver: Explore idea` *(planned)* — explore a selected idea with structured multi-AI options.
- `> Mind Weaver: Create plan` *(planned)* — turn a vague goal into concrete, verifiable tasks.
- **Apply professional hats** from the command palette to steer the AI (`system_design`, `ruthless_critique`, `software_engineer`, etc.).

## Install

### From marketplace

Install from the [VS Code Marketplace](#) or [Open VSX](#) (coming soon).

### From source

```bash
git clone https://github.com/Kurokasaiken/mind-weaver-vscode.git
cd mind-weaver-vscode
python -m venv .venv
source .venv/bin/activate
pip install -e .
cd vscode
npm install
npm run compile
```

### From PyPI

`mindweaver-core` is now available on PyPI:

```bash
pip install mindweaver-core
```

Then install the extension from the VS Code Marketplace or from the `.vsix`:

```bash
code --install-extension vscode/mind-weaver-0.1.0.vsix
```

## Configuration

Create `~/.config/mindweaver/config.yaml` with your API keys:

```yaml
providers:
  openai:
    api_key: sk-...
    model: gpt-4o-mini
  anthropic:
    api_key: sk-ant-...
    model: claude-3-5-sonnet-20241022
  groq:
    api_key: gsk_...
    model: llama-3.3-70b-versatile
```

Or set environment variables:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

## Usage

Open any file, run `> Mind Weaver: Validate with AI experts` from the command palette. The extension sends the file content to the Mind Weaver core, which queries the configured providers and shows a side-by-side critique.

## Architecture

- `mindweaver/`: Python core that runs multi-AI deliberation and exposes a JSON-RPC API.
- `vscode/`: thin TypeScript extension that calls the core and renders results.
- `cli/`: `mw-critique` and future commands for terminal, Claude Code and Codex.

## Support

If Mind Weaver saves you from a bad commit, consider supporting it:

- [Sponsor on GitHub](https://github.com/sponsors/faustoboni)
- [Sponsor on Polar](https://polar.sh/faustoboni)

## License

MIT
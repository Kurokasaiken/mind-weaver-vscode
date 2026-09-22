# Changelog

## 0.2.3

- Version check: the extension verifies `mindweaver-core` version at startup and shows a guided setup if it is missing or mismatched.
- Onboarding wizard: a setup webview opens automatically when the core is not found, with step-by-step instructions and links.
- Better Python detection: the extension tries `python3`, `python`, `py`, and the `mindweaver.pythonPath` setting.
- Activation changed to `onStartupFinished` so commands are available without a manual reload.
- Added `Mind Weaver: Open setup guide` command.

## 0.1.0-alpha

- First public alpha.
- `> Mind Weaver: Validate with AI experts` — multi-AI file critique inside VS Code.
- Core supports OpenAI, Anthropic, Groq and OpenRouter via `~/.config/mindweaver/config.yaml`.
- JSON-RPC core exposed over stdio.
- `mw-critique` CLI.
- `README`, `LANDING`, `.github/FUNDING.yml` and initial documentation.

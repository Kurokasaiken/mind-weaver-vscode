# Mind Weaver

> **An AI team of experts at your command.**
>
> Think before you code. Validate, explore, and plan with multiple AI models inside VS Code.

## Why Mind Weaver

Most AI coding tools write code for you. Mind Weaver is the opposite: it helps you **think before you write**. It runs the same question through several AI providers and shows you a structured, multi-perspective answer.

Use it when:
- you are not sure if your idea is good
- you want to see hidden risks before coding
- you need a concrete plan for a vague goal
- you want a sparring partner, not a ghostwriter

## What makes it different

- **Multi-AI by default**: the same prompt goes to OpenAI, Groq, Anthropic, OpenRouter — or any mix you configure.
- **Professional hats**: ask the AI team to wear a hat (ruthless critic, system designer, software engineer).
- **Selection-aware**: select a piece of code and it deliberates on that. No selection = whole file.
- **Private**: your code and keys stay on your machine.

## Install

### 1. Install the Python core

```bash
pip install mindweaver-core
```

### 2. Install the VS Code extension

From the Marketplace:

```bash
ext install kurokasaiken.mind-weaver
```

Or download the `.vsix` from GitHub Releases and run:

```bash
code --install-extension mind-weaver-0.2.0.vsix
```

## Configure

Open the command palette in VS Code (`Cmd+Shift+P` or `Ctrl+Shift+P`) and run:

```
> Mind Weaver: Open Mind Weaver config
```

This creates `~/.config/mindweaver/config.yaml` if it does not exist. Fill in at least one API key. For the best experience, add **at least two providers**.

### Recommended providers right now

| provider | model | why |
|---|---|---|
| `openai` | `gpt-4o-mini` | cheap, good at reasoning |
| `groq` | `llama-3.3-70b-versatile` | very fast, very cheap, good for critique |

### Where to get keys

- OpenAI: https://platform.openai.com/api-keys
- Groq: https://console.groq.com/keys
- Anthropic: https://console.anthropic.com/settings/keys
- OpenRouter: https://openrouter.ai/keys

### Example config

```yaml
providers:
  openai:
    api_key: sk-...
    model: gpt-4o-mini
  groq:
    api_key: gsk_...
    model: llama-3.3-70b-versatile
```

## How to use

1. Open or select code in VS Code.
2. Open the command palette.
3. Choose one of the Mind Weaver commands.

### Commands

| command | what it does |
|---|---|
| `Mind Weaver: Discuss with AI experts` | Critique the selected code or the whole file with multiple AIs. |
| `Mind Weaver: Explore idea with AI experts` | Type an idea and get options, risks, and a recommendation. |
| `Mind Weaver: Create plan with AI experts` | Type a goal and get a concrete, step-by-step plan. |
| `Mind Weaver: Open Mind Weaver config` | Open your `~/.config/mindweaver/config.yaml`. |
| `Mind Weaver: Show tutorial` | Open the welcome tutorial again. |

### Professional hats

After you run a command, you can choose a hat that shapes the AI perspective:

- **General** — balanced default
- **Ruthless critique** — finds every weakness
- **System design** — architecture, coupling, scalability
- **Software engineer** — implementation, edge cases, tests

## Troubleshooting

### "Core not ready"

This means the Python core did not start. Check:

1. `pip install mindweaver-core` succeeded.
2. The Python used by VS Code has `mindweaver-core` installed (check `mindweaver.pythonPath` in VS Code settings).
3. `~/.config/mindweaver/config.yaml` exists and has at least one valid API key.

Run `> Mind Weaver: Open Mind Weaver config` to create or edit the config file.

### "Provider returned an error"

Check that the API key is correct and that the model name is spelled exactly as shown in the provider docs.

## Support

If you find Mind Weaver useful, consider supporting the project:

- [GitHub Sponsors](https://github.com/sponsors/Kurokasaiken)
- [Polar](https://polar.sh/Kurokasaiken)

## License

MIT — see [LICENSE](LICENSE).
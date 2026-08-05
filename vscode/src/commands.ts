import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CoreBridge } from './coreBridge';
import { renderPanel } from './panel';

const HATS = [
    { label: 'Auto', detail: 'Pick automatically from keywords', value: undefined },
    { label: 'Ruthless critique', detail: 'Tear apart every assumption', value: 'ruthless_critique' },
    { label: 'System design', detail: 'Architecture, scalability, coupling', value: 'system_design' },
    { label: 'Software engineer', detail: 'Implementation, edge cases, tests', value: 'software_engineer' },
    { label: 'UI developer', detail: 'UI/UX, components, accessibility', value: 'ui_developer' },
    { label: 'Cloud architect', detail: 'Cloud, deploy, infrastructure', value: 'cloud_architect' },
    { label: 'Objective critic', detail: 'Neutral, disconfirming evidence', value: 'objective_critic' },
];

function getContext(editor: vscode.TextEditor | undefined) {
    if (!editor) {
        return { filePath: undefined, fileContent: undefined, isSelection: false };
    }
    const selection = editor.selection;
    const isSelection = !selection.isEmpty;
    return {
        filePath: editor.document.uri.fsPath,
        fileContent: isSelection ? editor.document.getText(selection) : editor.document.getText(),
        isSelection,
    };
}

async function pickHat(): Promise<string | undefined> {
    const picked = await vscode.window.showQuickPick(HATS.map(h => ({ ...h, alwaysShow: true })), {
        placeHolder: 'Choose a professional hat for the AI team',
    });
    return picked?.value;
}

async function runCommand(
    core: CoreBridge | undefined,
    context: vscode.ExtensionContext,
    method: 'critique' | 'explore' | 'plan',
    title: string,
    prompt: string,
    isSelection: boolean,
    hat: string | undefined,
    filePath?: string,
    fileContent?: string,
) {
    const panel = renderPanel(context, `Mind Weaver — ${title}`, '<h1>Mind Weaver</h1><p>Thinking...</p>');

    if (!core) {
        panel.webview.html = '<h1>Error</h1><p>Core not available.</p>';
        return;
    }

    try {
        const response = await core.call(method, {
            prompt,
            file_path: filePath,
            file_content: fileContent,
            is_selection: isSelection,
            hat,
        }) as any;
        const text = response?.result || 'No response from the core.';
        const scope = isSelection && filePath ? `Selection from ${filePath}` : filePath;
        panel.webview.html = `<html><body style="font-family: sans-serif; padding: 1rem; line-height: 1.6;"><h1>Mind Weaver — ${title}</h1>${scope ? `<p style="color:#666;">${escapeHtml(scope)}</p><hr>` : ''}${markdownToHtml(text)}</body></html>`;
    } catch (err) {
        panel.webview.html = `<h1>Error</h1><pre style="white-space: pre-wrap;">${escapeHtml(String(err))}</pre>`;
    }
}

export async function critiqueFileCommand(core: CoreBridge | undefined, context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No open file.');
        return;
    }
    const { filePath, fileContent, isSelection } = getContext(editor);
    const hat = await pickHat();
    await runCommand(core, context, 'critique', 'Discuss with AI experts', 'Provide a constructive critique of the code.', isSelection, hat, filePath, fileContent);
}

export async function exploreIdeaCommand(core: CoreBridge | undefined, context: vscode.ExtensionContext) {
    const idea = await vscode.window.showInputBox({
        prompt: 'What idea do you want to explore with AI experts?',
        placeHolder: 'e.g., use a background worker for this task',
    });
    if (!idea) {
        return;
    }
    const hat = await pickHat();
    const { filePath, fileContent, isSelection } = getContext(vscode.window.activeTextEditor);
    await runCommand(core, context, 'explore', 'Explore idea', idea, isSelection, hat, filePath, fileContent);
}

export async function createPlanCommand(core: CoreBridge | undefined, context: vscode.ExtensionContext) {
    const goal = await vscode.window.showInputBox({
        prompt: 'What goal do you want to plan with AI experts?',
        placeHolder: 'e.g., implement user authentication in this file',
    });
    if (!goal) {
        return;
    }
    const hat = await pickHat();
    const { filePath, fileContent, isSelection } = getContext(vscode.window.activeTextEditor);
    await runCommand(core, context, 'plan', 'Create plan', goal, isSelection, hat, filePath, fileContent);
}

const DEFAULT_CONFIG = `# Mind Weaver configuration
# You need at least 1 API key to use the plugin, but 2+ providers are recommended
# so the multi-AI deliberation is actually useful (e.g., OpenAI + Groq).
#
# Recommended providers right now (cheap and fast):
#   - openai: gpt-4o-mini  (good all-rounder)
#   - groq: llama-3.3-70b-versatile  (cheap, fast, good for critique)
#
# How to get API keys:
#   1. OpenAI:   https://platform.openai.com/api-keys
#   2. Groq:     https://console.groq.com/keys
#   3. Anthropic: https://console.anthropic.com/settings/keys
#   4. OpenRouter: https://openrouter.ai/keys
#
# Keep this file secret. Do not commit it.

providers:
  openai:
    api_key: your-openai-key-here
    model: gpt-4o-mini
  groq:
    api_key: your-groq-key-here
    model: llama-3.3-70b-versatile
`;

export async function openConfigCommand() {
    const configDir = path.join(require('os').homedir(), '.config', 'mindweaver');
    const configPath = path.join(configDir, 'config.yaml');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, DEFAULT_CONFIG, 'utf8');
    }
    const doc = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage('Mind Weaver config opened. Add at least one API key and save.');
}

export async function showTutorialCommand(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel('mindweaverTutorial', 'Mind Weaver Tutorial', vscode.ViewColumn.One, { enableScripts: false });
    panel.webview.html = `<html>
<head><style>
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 2rem; line-height: 1.6; max-width: 720px; margin: 0 auto; color: #333; }
h1, h2 { color: #1a1a1a; }
ol li { margin-bottom: 0.6rem; }
kbd { background: #f2f2f2; padding: 0.1rem 0.4rem; border-radius: 4px; font-family: monospace; }
pre { background: #f6f6f6; padding: 0.75rem; border-radius: 6px; overflow: auto; }
</style></head>
<body>
<h1>Welcome to Mind Weaver</h1>
<p>Mind Weaver puts a team of AI experts inside VS Code. Use it <strong>before</strong> you write code, not as a replacement for thinking.</p>

<h2>1. Configure</h2>
<ol>
<li>Open the command palette: <kbd>Cmd+Shift+P</kbd> (Mac) or <kbd>Ctrl+Shift+P</kbd> (Windows).</li>
<li>Run <kbd>Mind Weaver: Open Mind Weaver config</kbd>.</li>
<li>Paste at least one API key. For real multi-AI value, add at least 2 providers.</li>
<li>Recommended: <strong>OpenAI</strong> + <strong>Groq</strong>. Affordable and fast.</li>
</ol>

<h2>2. Select or open code</h2>
<p>Open any file, or <strong>select a specific piece of code</strong>. Mind Weaver will use the selection if there is one, otherwise the whole file.</p>

<h2>3. Run a command</h2>
<p>Open the command palette and try one of:</p>
<ul>
<li><strong>Discuss with AI experts</strong> — get a critique of the selected code.</li>
<li><strong>Explore idea with AI experts</strong> — brainstorm options for an idea.</li>
<li><strong>Create plan with AI experts</strong> — turn a goal into a concrete plan.</li>
</ul>

<h2>4. Choose a hat</h2>
<p>Before the answer, you can pick a <strong>professional hat</strong> (ruthless critique, system design, software engineer). Each AI uses that perspective.</p>

<h2>5. Re-run the tutorial</h2>
<p>Run <kbd>Mind Weaver: Show tutorial</kbd> from the command palette to see this again.</p>
</body>
</html>`;
    context.subscriptions.push(panel);
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function markdownToHtml(text: string): string {
    const blocks = text.split(/\n---\n/);
    const rendered = blocks.map((block) => {
        const escaped = escapeHtml(block);
        const withBold = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const withHeaders = withBold.replace(/^#{1,6} (.*)$/gm, '<h3>$1</h3>');
        const withLists = withHeaders.replace(/^- (.*)$/gm, '<li>$1</li>');
        const withCode = withLists.replace(/```([\s\S]*?)```/g, '<pre style="background:#f6f6f6;padding:0.5rem;border-radius:4px;overflow:auto;"><code>$1</code></pre>');
        const wrapped = withCode.replace(/(<li>.*?<\/li>(?:\n|<br>)*)/g, '<ul>$1</ul>');
        return wrapped.replace(/\n/g, '<br>');
    });
    return rendered.join('<hr style="margin: 1.5rem 0;">');
}
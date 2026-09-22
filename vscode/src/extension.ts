import * as vscode from 'vscode';
import { CoreBridge } from './coreBridge';
import { critiqueFileCommand, exploreIdeaCommand, createPlanCommand, openConfigCommand, showTutorialCommand } from './commands';

let core: CoreBridge | undefined;

function getOnboardingHtml(error: string): string {
    const steps = [
        '<h1>Mind Weaver — Setup</h1>',
        '<p>Per usare il plugin servono due cose: <strong>Python</strong> e <strong>mindweaver-core</strong>.</p>',
        '<h2>1. Installa Python</h2>',
        '<p>Scarica Python 3.10+ da <a href="https://www.python.org/downloads/">python.org</a>. Su Windows spunta "Add Python to PATH".</p>',
        '<h2>2. Installa mindweaver-core 0.2.3</h2>',
        '<p>Apri un terminale ed esegui:</p>',
        '<pre style="background:#f6f6f6;padding:0.5rem;border-radius:4px;overflow:auto;"><code>pip install mindweaver-core==0.2.3</code></pre>',
        '<p>Oppure, se hai il file <code>.whl</code>:</p>',
        '<pre style="background:#f6f6f6;padding:0.5rem;border-radius:4px;overflow:auto;"><code>pip install mindweaver_core-0.2.3-py3-none-any.whl</code></pre>',
        '<h2>3. Configura le chiavi API</h2>',
        '<p>Esegui in VS Code: <code>Mind Weaver: Open Mind Weaver config</code> e aggiungi almeno una chiave. Consigliato iniziare con <a href="https://console.groq.com/keys">Groq</a> (gratuita e veloce).</p>',
        '<h2>4. Ricarica VS Code</h2>',
        '<p><code>Ctrl+Shift+P</code> → <code>Developer: Reload Window</code></p>',
        '<hr>',
        `<p style="color:#c00;"><strong>Errore rilevato:</strong> ${error.replace(/\n/g, '<br>')}</p>`,
        '<p>Se il problema persiste, controlla che il Python usato da VS Code sia quello dove hai installato <code>mindweaver-core</code>. Impostalo con <code>mindweaver.pythonPath</code> nelle impostazioni.</p>',
    ];
    return `<html><body style="font-family: sans-serif; padding: 1rem; line-height: 1.6; max-width: 720px; margin: 0 auto;">${steps.join('')}</body></html>`;
}

export async function activate(context: vscode.ExtensionContext) {
    core = new CoreBridge();
    let error = '';
    try {
        await core.start();
    } catch (err) {
        error = String(err);
        vscode.window.showWarningMessage(`Mind Weaver: ${error.split('\n')[0]}`);
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('mindweaver.critiqueFile', () => {
            if (!core) { vscode.window.showWarningMessage('Mind Weaver core not available.'); return; }
            critiqueFileCommand(core, context);
        }),
        vscode.commands.registerCommand('mindweaver.exploreIdea', () => {
            if (!core) { vscode.window.showWarningMessage('Mind Weaver core not available.'); return; }
            exploreIdeaCommand(core, context);
        }),
        vscode.commands.registerCommand('mindweaver.createPlan', () => {
            if (!core) { vscode.window.showWarningMessage('Mind Weaver core not available.'); return; }
            createPlanCommand(core, context);
        }),
        vscode.commands.registerCommand('mindweaver.openConfig', openConfigCommand),
        vscode.commands.registerCommand('mindweaver.showTutorial', () => showTutorialCommand(context)),
        vscode.commands.registerCommand('mindweaver.onboarding', () => {
            const panel = vscode.window.createWebviewPanel('mindweaverOnboarding', 'Mind Weaver Setup', vscode.ViewColumn.One, { enableScripts: false });
            panel.webview.html = getOnboardingHtml(error || 'Mind Weaver core non avviato.');
        }),
    );

    if (error) {
        const panel = vscode.window.createWebviewPanel('mindweaverOnboarding', 'Mind Weaver Setup', vscode.ViewColumn.One, { enableScripts: false });
        panel.webview.html = getOnboardingHtml(error);
    }
}

export function deactivate() {
    core?.stop();
}

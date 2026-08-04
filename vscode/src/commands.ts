import * as vscode from 'vscode';
import { CoreBridge } from './coreBridge';
import { renderPanel } from './panel';

const DEFAULT_PROVIDERS = ['openai'];

function getFileContext(editor: vscode.TextEditor | undefined) {
    if (!editor) {
        return { filePath: undefined, fileContent: undefined };
    }
    return {
        filePath: editor.document.uri.fsPath,
        fileContent: editor.document.getText(),
    };
}

async function runCommand(
    core: CoreBridge | undefined,
    context: vscode.ExtensionContext,
    method: 'critique' | 'explore' | 'plan',
    title: string,
    prompt: string,
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
            providers: DEFAULT_PROVIDERS,
        }) as any;
        const text = response?.result || 'No response from the core.';
        panel.webview.html = `<html><body style="font-family: sans-serif; padding: 1rem;"><h1>Mind Weaver — ${title}</h1>${filePath ? `<p>File: ${escapeHtml(filePath)}</p><hr>` : ''}${formatResult(text)}</body></html>`;
    } catch (err) {
        panel.webview.html = `<h1>Error</h1><p>${escapeHtml(String(err))}</p>`;
    }
}

export async function critiqueFileCommand(core: CoreBridge | undefined, context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No open file.');
        return;
    }
    const { filePath, fileContent } = getFileContext(editor);
    await runCommand(core, context, 'critique', 'Discuss with AI experts', 'Provide a constructive critique of the file.', filePath, fileContent);
}

export async function exploreIdeaCommand(core: CoreBridge | undefined, context: vscode.ExtensionContext) {
    const idea = await vscode.window.showInputBox({
        prompt: 'What idea do you want to explore with AI experts?',
        placeHolder: 'e.g., use a background worker for this task',
    });
    if (!idea) {
        return;
    }
    const { filePath, fileContent } = getFileContext(vscode.window.activeTextEditor);
    await runCommand(core, context, 'explore', 'Explore idea', idea, filePath, fileContent);
}

export async function createPlanCommand(core: CoreBridge | undefined, context: vscode.ExtensionContext) {
    const goal = await vscode.window.showInputBox({
        prompt: 'What goal do you want to plan with AI experts?',
        placeHolder: 'e.g., implement user authentication in this file',
    });
    if (!goal) {
        return;
    }
    const { filePath, fileContent } = getFileContext(vscode.window.activeTextEditor);
    await runCommand(core, context, 'plan', 'Create plan', goal, filePath, fileContent);
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatResult(text: string): string {
    return '<pre style="white-space: pre-wrap;">' + escapeHtml(text) + '</pre>';
}
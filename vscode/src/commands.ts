import * as vscode from 'vscode';
import { CoreBridge } from './coreBridge';
import { renderPanel } from './panel';

export async function critiqueFileCommand(core: CoreBridge | undefined, context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('No open file.');
        return;
    }
    const filePath = editor.document.uri.fsPath;
    const fileContent = editor.document.getText();

    const panel = renderPanel(context, 'Mind Weaver', '<h1>Mind Weaver</h1><p>Thinking...</p>');

    if (!core) {
        panel.webview.html = '<h1>Error</h1><p>Core not available.</p>';
        return;
    }

    try {
        const response = await core.call('critique', {
            prompt: 'Provide a constructive critique of the file.',
            file_path: filePath,
            file_content: fileContent,
            providers: ['openai'],
        }) as any;
        const text = response?.result || 'No response from the core.';
        panel.webview.html = `<html><body style="font-family: sans-serif; padding: 1rem;"><h1>Mind Weaver</h1><p>File: ${escapeHtml(filePath)}</p><hr>${formatResult(text)}</body></html>`;
    } catch (err) {
        panel.webview.html = `<h1>Error</h1><p>${escapeHtml(String(err))}</p>`;
    }
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
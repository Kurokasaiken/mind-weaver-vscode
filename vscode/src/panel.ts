import * as vscode from 'vscode';

export function renderPanel(context: vscode.ExtensionContext, title: string, html: string) {
    const panel = vscode.window.createWebviewPanel('mindweaverPanel', title, vscode.ViewColumn.Beside, { enableScripts: false });
    panel.webview.html = `<html><body style="font-family: sans-serif; padding: 1rem;">${html}</body></html>`;
    return panel;
}
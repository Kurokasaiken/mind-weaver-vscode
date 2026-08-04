import * as vscode from 'vscode';
import { CoreBridge } from './coreBridge';
import { critiqueFileCommand } from './commands';

let core: CoreBridge | undefined;

export function activate(context: vscode.ExtensionContext) {
    core = new CoreBridge();
    core.start();

    const disposable = vscode.commands.registerCommand('mindweaver.critiqueFile', () => {
        critiqueFileCommand(core, context);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    core?.stop();
}
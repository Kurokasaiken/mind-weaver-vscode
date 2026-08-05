import * as vscode from 'vscode';
import { CoreBridge } from './coreBridge';
import { critiqueFileCommand, exploreIdeaCommand, createPlanCommand, openConfigCommand, showTutorialCommand } from './commands';

let core: CoreBridge | undefined;

export async function activate(context: vscode.ExtensionContext) {
    core = new CoreBridge();
    try {
        await core.start();
    } catch (err) {
        vscode.window.showWarningMessage(`Mind Weaver core did not start: ${err}`);
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('mindweaver.critiqueFile', () => critiqueFileCommand(core, context)),
        vscode.commands.registerCommand('mindweaver.exploreIdea', () => exploreIdeaCommand(core, context)),
        vscode.commands.registerCommand('mindweaver.createPlan', () => createPlanCommand(core, context)),
        vscode.commands.registerCommand('mindweaver.openConfig', openConfigCommand),
        vscode.commands.registerCommand('mindweaver.showTutorial', () => showTutorialCommand(context)),
    );
}

export function deactivate() {
    core?.stop();
}
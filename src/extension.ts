import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadTemplates } from './templates/template';
import { multiStepInput } from './picks';

export function activate(context: vscode.ExtensionContext) {
	console.log('Project Creator extension activated!');

	const disposable = vscode.commands.registerCommand('project-creator.createProject', async () => {
    multiStepInput(context)
			.catch(console.error);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

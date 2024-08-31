import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadTemplates } from './templates/template';

export function activate(context: vscode.ExtensionContext) {
  console.log('Project Creator extension activated!');

  const disposable = vscode.commands.registerCommand('project-creator.createProject', async () => {
    const templates = loadTemplates();
    console.log("🚀 ~ disposable ~ templates:", templates)

    // Create QuickPick items from templates
    const quickPickItems = templates.map(template => ({
      label: template.name,
      description: template.description,
      template: template // Store the template object for later use
    }));

    // Show the QuickPick to the user
    const selectedItem = await vscode.window.showQuickPick(quickPickItems);

    if (selectedItem) {
      // Get the selected template
      const selectedTemplate = selectedItem.template;

      // TODO: Implement project creation logic (next step)
      console.log('Selected template:', selectedTemplate);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

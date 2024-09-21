import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml';
import os from 'os';
import path from 'path';

const desktopDir = path.join(os.homedir(), "Desktop");
console.log("🚀 ~ desktopDir:", desktopDir);
console.log(desktopDir);
export interface TemplateItem { label: string; description: string; template: Template }


export interface Template {
  name: string;
  description: string;
  files: string[];
  commands: string[];
}
interface Templatefile {
  scripts: {},
  templates: Template[]
}

export function loadTemplates(): Templatefile {
  const templatesYml = vscode.extensions.getExtension('paakofiAidoo.project-creator')?.extensionPath + '\\src\\templates\\templates.yaml';
  const templateData: Templatefile = yaml.parse(fs.readFileSync(templatesYml, 'utf-8')) as Templatefile;
  return templateData;
}


function checkBaseFolder() {
  const config = vscode.workspace.getConfiguration();
  const baseFolder = config.get<string>('projectCreator.baseFolder');
  const projectDestination = baseFolder ? templateString(baseFolder, { desktopDir }) : `${desktopDir}\\My_Projects`;
  // Use fs.existsSync to check if the folder exists
  if (!fs.existsSync(projectDestination)) {
    console.log('Base folder does not exist, creating:', projectDestination);
    // Use try-catch for error handling during folder creation
    try {
      fs.mkdirSync(projectDestination, { recursive: true });
      console.log('Base folder created successfully:', projectDestination);
    } catch (err) {
      console.error('Error creating base folder:', err);
      // Handle the error appropriately, e.g., show an error message to the user
      vscode.window.showErrorMessage(`Error creating base folder: ${err}`);
    }
  } else {
    console.log('Base folder exists:', projectDestination);
  }

  return projectDestination;
}

export function createProject(template: TemplateItem, projectName: string) {
  console.log("🚀 ~ createProject ~ projectName:", projectName);
  console.log("🚀 ~ createProject ~ template:", template.template);
  const baseFolder = checkBaseFolder();
  const projectDestination = `${baseFolder}/${projectName}`;

  // Create the project folder
  // fs.mkdirSync(projectDestination, { recursive: true });

  // Create files based on the template
  // template.files.forEach(file => {
  //   const filePath = `${projectDestination}/${file}`;
  //   fs.writeFileSync(filePath, '');
  // });

  const executeCommands = async () => {
    const terminal = vscode.window.createTerminal({
      name: `create-project:${projectName}`,
      hideFromUser: false,
      isTransient: false,
      color: "#00AA00"
    } as any);

    for (const command of template.template.commands) {
      console.log("🚀 ~ executeCommands ~ command:", command)
      const formattedCommand = templateString(command, { projectDestination, projectName });
      console.log('Adding command to terminal:', formattedCommand);

      // Send the command to the terminal, followed by '&& exit' to exit after execution
      terminal.sendText(`${formattedCommand}`);
    }
    terminal.sendText(`exit`);


    // Wait for the terminal to exit (all commands completed)
    await new Promise(resolve => {
      const intervalId = setInterval(() => {
        console.log(terminal.exitStatus);
console.log("has exit status");

        if (terminal.exitStatus !== undefined) {
          clearInterval(intervalId);
          resolve(true);
        }
      }, 1000);
    });

    console.log('All commands executed!');
  };

  // Execute commands and then open the project folder
  executeCommands().then(() => {
    console.log('All commands executed!');
    // vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDestination));
  });





  // // Open the project folder in VS Code
  // vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDestination));
}





function templateString(templateString: string, templateVars: object) {
  return Object.entries(templateVars).reduce(
    (result, [arg, val]) => result.replace(`$\{${arg}}`, `${val}`),
    templateString,
  );
}
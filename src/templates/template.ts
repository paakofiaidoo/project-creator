import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml';
import os from 'os';
import path from 'path';
import { Project } from '../picks';

const desktopDir = path.join(os.homedir(), "Desktop");

export interface TemplateItem { label: string; description: string; template: Template }


export interface Template {
  name: string;
  description: string;
  files: string[];
  commands: string[];
  create_folder: boolean;
  add_git: boolean
}
interface Templatefile {
  scripts: {},
  templates: Template[]
}
interface Snippets {
  [key: string]: string; 
}
interface Snippetfile {
  snippets: Snippets
}

export function loadTemplates(): Templatefile {
  const templatesYml = vscode.extensions.getExtension('paakofiAidoo.project-creator')?.extensionPath + '\\src\\templates\\templates.yaml';
  const templateData: Templatefile = yaml.parse(fs.readFileSync(templatesYml, 'utf-8')) as Templatefile;
  return templateData;
}

export function loadSnippets(): Snippetfile {
  const snippetYml = vscode.extensions.getExtension('paakofiAidoo.project-creator')?.extensionPath + '\\src\\templates\\snippets.yaml';
  const snippets: Snippetfile = yaml.parse(fs.readFileSync(snippetYml, 'utf-8')) as Snippetfile;
  console.log("🚀 ~ loadSnippets ~ snippets:", snippets);
  return snippets;
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

export function createProject(project: Project) {
  const { name, template, initializeGit } = project;
  console.log("🚀 ~ createProject ~ projectName:", name);
  console.log("🚀 ~ createProject ~ template:", template);
  const baseFolder = checkBaseFolder();
  const projectDestination = `${baseFolder}/${name}`;
  let cwd = baseFolder;

  if (template.create_folder) {
    cwd = projectDestination;
    fs.mkdirSync(projectDestination, { recursive: true });
  }

  // Create files based on the template
  template.files?.forEach((file: string) => {
    const filePath = path.join(projectDestination, file); // Use path.join for correct paths

    // Create parent directories if they don't exist
    fs.mkdirSync(path.dirname(filePath), { recursive: true }); 

    fs.writeFileSync(filePath, '');
  });


  // console.log(vscode.commands.getCommands());

  const executeCommands = async () => {
    const terminal = vscode.window.createTerminal({
      name: `create-project:${name}`,
      hideFromUser: false,
      isTransient: false,
      cwd,
      color: "#00AA00"
    } as any);

    for (const command of template.commands) {
      let formattedCommand = templateString(command, { projectDestination, name });
      
      formattedCommand = await replaceSnippetPlaceholders(formattedCommand, baseFolder);

      console.log('Adding command to terminal:', formattedCommand);
      terminal.sendText(`${formattedCommand}`);
    }

    if (initializeGit) {
      terminal.sendText(`git init`);
      terminal.sendText(`git add .`);
    }
//send exit
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
    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectDestination), { forceNewWindow: true });
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



async function replaceSnippetPlaceholders(command: string, baseFolder: string): Promise<string> {
  const snippetRegex = /\${snippets_(\w+)}/g;
  let match;
  let snippets = loadSnippets().snippets;
  while ((match = snippetRegex.exec(command)) !== null) {
    const snippetKey:string = match[1];
    
     const snippetPath =`${vscode.extensions.getExtension('paakofiAidoo.project-creator')?.extensionPath}\\src\\templates\\snippets\\${snippets[snippetKey]}`;
     console.log("🚀 ~ replaceSnippetPlaceholders ~ snippetPath:", snippetPath)

    try {
      const snippetContent = await fs.promises.readFile(snippetPath, 'utf-8');
      command = command.replace(match[0], snippetContent); 
    } catch (error) {
      console.error(`Error loading snippet from ${snippetPath}:`, error);
      vscode.window.showErrorMessage(`Error loading snippet from ${snippetPath}`);
    }
  }

  return command;
}
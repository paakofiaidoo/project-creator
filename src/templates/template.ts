import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml'; 
import YAML from 'yaml'

interface Template {
  name: string;
  description: string;
  files: string[];
  commands: string[];
}

export function loadTemplates(): Template[] {
  const templatesYml = vscode.extensions.getExtension('your-extension-id')?.extensionPath + '/templates/templates.yml';

  const templates: Template[] = [];

  const templateData = yaml.parse(fs.readFileSync(templatesYml, 'utf-8')) as Template;
  console.log("🚀 ~ loadTemplates ~ templateData:", templateData)
//   templates.push(templateData);


 

  return templates;
}

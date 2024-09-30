## Project Creator: Effortless Project Scaffolding in VS Code

Tired of manually setting up new projects? Project Creator streamlines your workflow by generating boilerplate code for various project types directly within VS Code.

### Features
- Intuitive Project Creation: Quickly scaffold new projects using a simple command palette interface.
- Multiple Template Support: Choose from a variety of pre-defined templates for popular languages and frameworks (e.g., React, Go, Flutter, Python, HTML5).
- Seamless Integration: Create projects directly within your VS Code workspace, ready for development.


## Getting Started
1. Install the Extension: Search for "Project Creator" in the VS Code Extensions Marketplace and install it.
2. Create a New Project:
    - Open the command palette (Ctrl+Shift+P or Cmd+Shift+P).
    - Type "Project Creator: Create New Project".
    - Select the desired project type from the list of available templates.
    - Provide a name for your project and choose its location.
3. Start Coding! Project Creator will generate the necessary files and folders, allowing you to focus on writing code.



### Extension Settings

This extension contributes the following settings:
<!-- 
* **`projectCreator.templateDirectory`:** (default: `"./src/templates/templates.yml"`) 
   - Specifies the path to your project templates YAML file. This setting will be used in the future to support custom templates. -->
* **`projectCreator.baseFolder`:** (default: `${desktopDir}\My_Projects`)
   - The base folder where new projects will be created. 


import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';
import { createProject, loadTemplates, Template, TemplateItem } from './templates/template';



export async function multiStepInput(context: ExtensionContext) {


    const templates = loadTemplates();
    console.log("🚀 ~ disposable ~ templates:", templates)

    // Create QuickPick items from templates
    const quickPickItems: TemplateItem[] = templates.templates.map(template => ({
        label: template.name,
        description: template.description,
        template: template // Store the template object for later use
    }));

    class MyButton implements QuickInputButton {
        constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
    }

    const createResourceGroupButton = new MyButton({
        dark: Uri.file(context.asAbsolutePath('resources/dark/add.svg')),
        light: Uri.file(context.asAbsolutePath('resources/light/add.svg')),
    }, 'Create Resource Group');


    interface State {
        title: string;
        step: number;
        totalSteps: number;
        resourceGroup: QuickPickItem | string;
        name: string;
        runtime: QuickPickItem;
        app: string;
        template: any
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        state.name=""
        await MultiStepInput.run(input => pickTemplate(input, state));
        console.log("🚀 ~ collectInputs ~ state:", state)
        createProject(state.template, state.name)

        return state as State;
    }

    const title = 'Create Project';

    async function pickTemplate(input: MultiStepInput, state: Partial<State>) {
        const pick = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 3,
            placeholder: 'Pick a project template',
            items: quickPickItems,
            activeItem: typeof state.resourceGroup !== 'string' ? state.resourceGroup : undefined,
            buttons: [createResourceGroupButton],
            shouldResume: shouldResume
        });
        if (pick instanceof MyButton) {
            console.log(pick.tooltip);
            return
            // return (input: MultiStepInput) => inputResourceGroupName(input, state);
        }
        state.template = pick;
        return (input: MultiStepInput) => inputName(input, state);
    }

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        state.name=""
        // TODO: Remember current value when navigating back.
        state.name = await input.showInputBox({
            title,
            step: 2 + additionalSteps,
            totalSteps: 3 + additionalSteps,
            value: state.name,
            prompt: 'Choose a unique name for the project',
            validate: validateNameIsUnique,
            shouldResume: shouldResume
        });


        // return (input: MultiStepInput) => pickRuntime(input, state);
    }


    async function inputResourceGroupName(input: MultiStepInput, state: Partial<State>) {
        console.log("🚀 ~ inputResourceGroupName ~ state:", state)
        console.log("🚀 ~ inputResourceGroupName ~ input:", input)
        state.resourceGroup = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 4,
            value: typeof state.resourceGroup === 'string' ? state.resourceGroup : '',
            prompt: 'Choose a name for the project',
            validate: validateNameIsUnique,
            shouldResume: shouldResume
        });
        return (input: MultiStepInput) => inputName(input, state);
    }



    async function pickRuntime(input: MultiStepInput, state: Partial<State>) {
        const additionalSteps = typeof state.resourceGroup === 'string' ? 1 : 0;
        // TODO: Remember currently active item when navigating back.
        state.runtime = await input.showQuickPick({
            title,
            step: 3 + additionalSteps,
            totalSteps: 3 + additionalSteps,
            placeholder: 'Pick a runtime',
            items: [],
            activeItem: state.runtime,
            shouldResume: shouldResume
        });
    }

    function shouldResume() {
        // Could show a notification with the option to resume.
        return new Promise<boolean>((resolve, reject) => {
            // noop
        });
    }

    async function validateNameIsUnique(name: string) {
        // ...validate...
        await new Promise(resolve => setTimeout(resolve, 1000));

    
        return name === 'vscode' ? 'Name not unique' : undefined;
    }

 

    const state = await collectInputs();
    window.showInformationMessage(`Creating project '${state.name}'`);







    // console.log("🚀 ~ quickPickItems ~ quickPickItems:", quickPickItems)

    // // Show the QuickPick to the user
    // const selectedItem = await vscode.window.showQuickPick(quickPickItems);

    // if (selectedItem) {
    //   // Get the selected template
    //   const selectedTemplate = selectedItem.template;

    //   // TODO: Implement project creation logic (next step)
    //   console.log('Selected template:', selectedTemplate);
    // }
}



class InputFlowAction {
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    ignoreFocusOut?: boolean;
    placeholder: string;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
    title: string;
    step: number;
    totalSteps: number;
    value: string;
    prompt: string;
    validate: (value: string) => Promise<string | undefined>;
    buttons?: QuickInputButton[];
    ignoreFocusOut?: boolean;
    placeholder?: string;
    shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

    static async run<T>(start: InputStep) {
        const input = new MultiStepInput();
        return input.stepThrough(start);
    }

    private current?: QuickInput;
    private steps: InputStep[] = [];

    private async stepThrough<T>(start: InputStep) {
        let step: InputStep | void = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                } else if (err === InputFlowAction.cancel) {
                    step = undefined;
                } else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }

    async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, ignoreFocusOut, placeholder, buttons, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.ignoreFocusOut = ignoreFocusOut ?? false;
                input.placeholder = placeholder;
                input.items = items;
                if (activeItem) {
                    input.activeItems = [activeItem];
                }
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidChangeSelection(items => resolve(items[0])),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                        })()
                            .catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }

    async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, ignoreFocusOut, placeholder, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createInputBox();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.value = value || '';
                input.prompt = prompt;
                input.ignoreFocusOut = ignoreFocusOut ?? false;
                input.placeholder = placeholder;
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                let validating = validate('');
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidAccept(async () => {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(await validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    }),
                    input.onDidChangeValue(async text => {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = await current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    }),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                        })()
                            .catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }
}
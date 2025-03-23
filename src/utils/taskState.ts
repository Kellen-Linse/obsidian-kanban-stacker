import { TFile, TFolder, Vault, Notice } from "obsidian";
import { extractTasks } from "./extractTasks";

export async function initializeTaskState(vault: Vault, folderPath: string, taskState: Map<string, any>) {

	const folder = vault.getFolderByPath(folderPath);

	if (!folder || !(folder instanceof TFolder)) {
		new Notice(`ITS: Folder "${folderPath}" does not exist.`);
		return;
	}

	const files = folder.children.filter((file) => file instanceof TFile) as TFile[];

	for (const file of files) {
		const content = await vault.read(file);
		const todo = new Set<string>();
		const inProgress = new Set<string>();
		const done = new Set<string>();

		extractTasks(content, "## To Do", todo);
		extractTasks(content, "## In Progress", inProgress);
		extractTasks(content, "## Done", done);

		taskState.set(file.path, { todo, inProgress, done });
	}
}

export async function detectTaskChanges(
	vault: Vault,
	file: TFile,
	taskState: Map<string, any>
) {

	console.log("detectTaskChanges Called in file: ", file.name);

	const previousState = taskState.get(file.path);
	if (!previousState) return;

	const content = await vault.read(file);
  console.log("DTC: ", file.name, " changed content: \n", content);
	const currentTodo = new Set<string>();
	const currentInProgress = new Set<string>();
	const currentDone = new Set<string>();

	extractTasks(content, "## To Do", currentTodo);
	extractTasks(content, "## In Progress", currentInProgress);
	extractTasks(content, "## Done", currentDone);

	console.log("DTC: currentTodo: ", currentTodo);
	console.log("DTC: currentInProgress: ", currentInProgress);
	console.log("DTC: currentDone: ", currentDone);

	const movedToInProgress = [...currentInProgress].filter((task) => previousState.todo.has(task));
	const movedToDone = [...currentDone].filter((task) => previousState.inProgress.has(task));
	const movedToTodo = [...currentTodo].filter((task) => previousState.done.has(task));

	if (movedToInProgress.length > 0) console.log(`Tasks moved to In Progress in ${file.name}:`, movedToInProgress);
	if (movedToDone.length > 0) console.log(`Tasks moved to Done in ${file.name}:`, movedToDone);
	if (movedToTodo.length > 0) console.log(`Tasks moved to To Do in ${file.name}:`, movedToTodo);

	taskState.set(file.path, {
		todo: currentTodo,
		inProgress: currentInProgress,
		done: currentDone,
	});
}
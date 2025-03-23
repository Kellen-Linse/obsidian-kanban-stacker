import { TFile, TFolder, Vault, Notice } from "obsidian";
import { FOLDER_PATH, MAIN_KANBAN_FILENAME } from "../constants";
import { extractTasks } from "../utils/extractTasks";

/**
 * Synchronizes the main Kanban file by aggregating tasks from all sub-Kanban files
 * within the specified folder. Tasks are grouped into "To Do," "In Progress," and
 * "Done" sections and written to the main Kanban file.
 *
 * @param app - The Obsidian app instance.
 * @param isSyncingMain - A flag to indicate whether the main Kanban sync is in progress.
 */
export async function syncSubsToMain(app: any, isSyncingMain: { value: boolean }) {
	try {
		isSyncingMain.value = true;
		const folder = app.vault.getFolderByPath(FOLDER_PATH);

		if (!folder || !(folder instanceof TFolder)) {
			new Notice(`Folder "${FOLDER_PATH}" does not exist.`);
			isSyncingMain.value = false;
			return;
		}

		const files = folder.children.filter(
			(file) =>
				file instanceof TFile && file.name !== MAIN_KANBAN_FILENAME
		) as TFile[];
		const todoTasks = new Set<string>();
		const inProgressTasks = new Set<string>();
		const doneTasks = new Set<string>();

		for (const file of files) {
			const content = await app.vault.read(file);
			extractTasks(content, "## To Do", todoTasks);
			extractTasks(content, "## In Progress", inProgressTasks);
			extractTasks(content, "## Done", doneTasks);
		}

		const mainFile = app.vault.getAbstractFileByPath(
			`${FOLDER_PATH}/${MAIN_KANBAN_FILENAME}`
		) as TFile;
		const newContent = [
			"---",
			"kanban-plugin: board",
			"---",
			"",
			"## To Do",
			...todoTasks,
			"",
			"## In Progress",
			...inProgressTasks,
			"",
			"## Done",
			...doneTasks,
			"",
		].join("\n");

		if (mainFile) {
			await app.vault.modify(mainFile, newContent);
		} else {
			console.log("sK Main file not found.");
		}

		new Notice("Kanban synced successfully!");
		isSyncingMain.value = false;
	} catch (error) {
		isSyncingMain.value = false;
		console.error("Error syncing Kanban:", error);
		new Notice(`Error syncing Kanban: ${error.message}`);
	}
}

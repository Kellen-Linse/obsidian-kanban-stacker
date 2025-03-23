import { TFile, Notice } from "obsidian";
import { FOLDER_PATH, MAIN_KANBAN_FILENAME } from "../constants";
import { extractTasks } from "../utils/extractTasks";


/**
 * Synchronizes all sub-Kanban files by aligning their tasks with the main Kanban file.
 * Tasks in each sub-Kanban file are filtered to include only those that are present
 * in both the main Kanban file and the respective sub-Kanban file. The updated tasks
 * are then written back to the sub-Kanban files.
 *
 * @param app - The Obsidian app instance.
 * @param isSyncingSub - A flag to indicate whether the sub-Kanban sync is in progress.
 */
export async function syncSubKanbans(
	app: any,
	isSyncingSub: { value: boolean }
) {
	try {
		isSyncingSub.value = true;

		const mainFile = app.vault.getAbstractFileByPath(
			`${FOLDER_PATH}/${MAIN_KANBAN_FILENAME}`
		) as TFile;

		if (!mainFile) {
			new Notice(`Main Kanban file "${MAIN_KANBAN_FILENAME}" not found.`);
			isSyncingSub.value = false;
			return;
		}

		const mainContent = await app.vault.read(mainFile);
		console.log("sSK Main File Content: ", mainContent);

		const mainTodoTasks = new Set<string>();
		const mainInProgressTasks = new Set<string>();
		const mainDoneTasks = new Set<string>();

		extractTasks(mainContent, "## To Do", mainTodoTasks);
		extractTasks(mainContent, "## In Progress", mainInProgressTasks);
		extractTasks(mainContent, "## Done", mainDoneTasks);

		const files = app.vault
			.getFiles()
			.filter(
				(file: TFile) =>
					file.path.startsWith(FOLDER_PATH) &&
					file.name !== MAIN_KANBAN_FILENAME
			);

		// Iterate over each sub-Kanban file
		for (const file of files) {
			// Read the content of the sub-Kanban file
			const content = await app.vault.read(file);
			console.log("sSK file: ", file.name);
			console.log("sSK file content: ", content);

			// Initialize sets to store tasks from the sub-Kanban file
			const subTodoTasks = new Set<string>();
			const subInProgressTasks = new Set<string>();
			const subDoneTasks = new Set<string>();

			// Extract tasks from the sub-Kanban file by section
			extractTasks(content, "## To Do", subTodoTasks);
			extractTasks(content, "## In Progress", subInProgressTasks);
			extractTasks(content, "## Done", subDoneTasks);

			// Generate updated content for the sub-Kanban file by filtering tasks
			// to include only those present in both the main and sub-Kanban files
			const updatedContent = [
				"---",
				"kanban-plugin: board",
				"---",
				"",
				"## To Do",
				...Array.from(mainTodoTasks).filter((task) =>
					subTodoTasks.has(task)
				),
				"",
				"## In Progress",
				...Array.from(mainInProgressTasks).filter((task) =>
					subInProgressTasks.has(task)
				),
				"",
				"## Done",
				...Array.from(mainDoneTasks).filter((task) =>
					subDoneTasks.has(task)
				),
				"",
			].join("\n");

			await app.vault.modify(file, updatedContent);
		}

		new Notice("Sub-Kanbans synced successfully!");

		isSyncingSub.value = false;
	} catch (error) {
		isSyncingSub.value = false;
		console.error("Error syncing sub-Kanbans:", error);
		new Notice(`Error syncing sub-Kanbans: ${error.message}`);
	}
}

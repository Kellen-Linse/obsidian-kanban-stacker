import { Plugin, TFile, Notice, TFolder } from "obsidian";

export default class KanbanSyncPlugin extends Plugin {
	private readonly folderPath = "Sources/synced-kanbans";
	private readonly mainKanbanFileName = "main.md";

	async onload() {
		console.log("Kanban Sync Plugin loaded.");
		this.syncKanbans();

		this.app.workspace.on("file-open", async (file) => {
			if (
				file &&
				file.path === `${this.folderPath}/${this.mainKanbanFileName}`
			) {
				await this.syncKanbans();
			}
		});
	}

	async onunload() {
		console.log("Kanban Sync Plugin unloaded.");
	}

	async syncKanbans() {
		try {
			const folder = this.app.vault.getAbstractFileByPath(
				this.folderPath
			);
			if (!folder || !(folder instanceof TFolder)) {
				new Notice(`Folder "${this.folderPath}" does not exist.`);
				return;
			}

			// Get all files in the folder
			const files = this.app.vault
				.getFiles()
				.filter(
					(file) =>
						file.path.startsWith(this.folderPath) &&
						file.name !== this.mainKanbanFileName
				);

			// Initialize task sets
			const todoTasks = new Set<string>();
			const inProgressTasks = new Set<string>();
			const doneTasks = new Set<string>();

			// Process each Kanban file
			for (const file of files) {
				const content = await this.app.vault.read(file);

				// Extract tasks by section
				this.extractTasks(content, "## To Do", todoTasks);
				this.extractTasks(content, "## In Progress", inProgressTasks);
				this.extractTasks(content, "## Done", doneTasks);
			}

			// Create or update the main Kanban file
			const mainFile = this.app.vault.getAbstractFileByPath(
				`${this.folderPath}/${this.mainKanbanFileName}`
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
				await this.app.vault.modify(mainFile, newContent);
			} else {
				await this.app.vault.create(
					`${this.folderPath}/${this.mainKanbanFileName}`,
					newContent
				);
			}

			new Notice("Kanban synced successfully!");
		} catch (error) {
			console.error("Error syncing Kanban:", error);
			new Notice(`Error syncing Kanban: ${error.message}`);
		}
	}

	extractTasks(content: string, sectionHeader: string, taskSet: Set<string>) {
		let section: RegExpMatchArray | null;

		if (sectionHeader === "## Done") {
			section = content.match(/^##\s*Done\s*([\s\S]*?)(?=^##|$)/m);
		} else {
			section = content.match(
				new RegExp(`^${sectionHeader}[\\s\\S]*?(?=^##|\\Z)`, "m")
			);
		}

		if (section) {
			const tasks = section[0].match(/^- .+$/gm);
			if (tasks) tasks.forEach((task) => taskSet.add(task));
		}
	}
}

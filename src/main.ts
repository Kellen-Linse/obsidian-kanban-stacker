// src/main.ts
import { TFile, Plugin } from "obsidian";
import { FOLDER_PATH, MAIN_KANBAN_FILENAME } from "./constants";
import { syncSubsToMain } from "./sync/syncMain";
import { syncSubKanbans } from "./sync/syncSub";
import { initializeTaskState, detectTaskChanges } from "./utils/taskState";

export default class KanbanSyncPlugin extends Plugin {
	private isSyncingMain = { value: false };
	private isSyncingSub = { value: false };
	private taskState: Map<string, any> = new Map();

	async onload() {
		console.log("Kanban Sync Plugin Onload Called.");
		await initializeTaskState(this.app.vault, FOLDER_PATH, this.taskState);
		await syncSubsToMain(this.app, this.isSyncingMain);

		this.app.workspace.on("file-open", async (file) => {
			if (
				file &&
				file.path === `${FOLDER_PATH}/${MAIN_KANBAN_FILENAME}`
			) {
				await syncSubsToMain(this.app, this.isSyncingMain);
			}
		});

		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				if (
					!this.isSyncingMain.value &&
					!this.isSyncingSub.value &&
					file &&
					file.path.startsWith(FOLDER_PATH)
				) {
					if (file instanceof TFile) {
						await detectTaskChanges(
							this.app.vault,
							file,
							this.taskState
						);
					}
					await syncSubKanbans(this.app, this.isSyncingSub);
				}
			})
		);
	}

	onunload() {
		console.log("Kanban Sync Plugin unloaded.");
	}
}

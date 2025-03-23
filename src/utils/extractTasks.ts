export function extractTasks(
	content: string,
	sectionHeader: string,
	taskSet: Set<string>
) {
	let section: RegExpMatchArray | null;

	if (sectionHeader === "## Done") {
		section = content.match(/^##\s*Done\s*([\s\S]*?)(?=^##|$)/m);
	} else {
		section = content.match(
			new RegExp(`^${sectionHeader}[\\s\\S]*?(?=^##|\\Z)`, "m")
		);
	}

	if (section) {
		// Updated regex to handle leading/trailing whitespace and optional checkboxes
		const tasks = section[0].match(/^\s*-\s*(\[[ xX]\])?\s*.+$/gm);
		if (tasks) tasks.forEach((task) => taskSet.add(task.trim()));
	}
}

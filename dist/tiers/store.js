import { saveMemory, readMemory, deleteMemory } from "../storage";
export async function store($, title, content, options = {}) {
    const cat = options.category || "notes";
    return saveMemory(cat, title, content, {
        tags: options.tags,
        importance: options.importance,
        project: options.project,
        source: options.source || "agent",
    });
}
export async function read(relPath) {
    const record = await readMemory(relPath);
    if (!record)
        return null;
    return `# ${record.fm.title || relPath}\n\n${record.body}`;
}
export async function remove($, relPath, reason) {
    await deleteMemory(relPath);
    if (reason) {
        const notePath = `notes/deletions.md`;
        const note = await readMemory(notePath);
        const entry = `- Deleted: ${relPath} (${new Date().toISOString()}) - ${reason}\n`;
        if (note) {
            const { parseFrontmatter, buildMemoryContent } = await import("../frontmatter");
            const content = await import("../fs").then((m) => m.readFile(note.path, "utf-8"));
            const { fm, body } = parseFrontmatter(content);
            const newContent = buildMemoryContent(fm, body + entry);
            await import("../fs").then((m) => m.writeFile(note.path, newContent, "utf-8"));
        }
    }
}
//# sourceMappingURL=store.js.map
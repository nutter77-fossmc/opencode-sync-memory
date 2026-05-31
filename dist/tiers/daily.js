import { dailyNotePath, categoryPath } from "../paths";
import { readFile, writeFile, mkdir, exists } from "../fs";
import { parseFrontmatter, buildMemoryContent } from "../frontmatter";
import { getHostname } from "../machine";
export async function ensureDailyNote($) {
    const path = dailyNotePath();
    const hostname = getHostname();
    if (await exists(path))
        return path;
    await mkdir(categoryPath("notes"), { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const body = `# ${date}\n\n## Session Notes\n\n## Decisions\n\n## For Next Session\n`;
    const fm = {
        title: `Daily Notes - ${date}`,
        tags: ["daily", date],
        importance: "low",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        created_by: hostname,
        updated_by: hostname,
        source: "auto-capture",
        related: [],
    };
    const content = buildMemoryContent(fm, body);
    await writeFile(path, content, "utf-8");
    return path;
}
export async function appendToDailyNote($, section, text) {
    const path = await ensureDailyNote($);
    const content = await readFile(path, "utf-8");
    const { fm, body } = parseFrontmatter(content);
    const updatedBody = body + `\n### ${section}\n${text}\n`;
    const hostname = getHostname();
    fm.updated = new Date().toISOString();
    fm.updated_by = hostname;
    const newContent = buildMemoryContent(fm, updatedBody);
    await writeFile(path, newContent, "utf-8");
}
//# sourceMappingURL=daily.js.map
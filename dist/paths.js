import { homedir } from "os";
import { join } from "path";
export const MEMORY_DIR = join(homedir(), ".opencode-memory");
export const MEMORIES_DIR = join(MEMORY_DIR, "memories");
export const CATEGORIES = [
    "preferences",
    "repos",
    "technical",
    "people",
    "workflows",
    "snippets",
    "notes",
];
export function categoryPath(category) {
    return join(MEMORIES_DIR, category);
}
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 120);
}
export function memoryFilePath(category, title) {
    return join(categoryPath(category), `${slugify(title)}.md`);
}
export function dailyNotePath(date) {
    const d = date || new Date();
    const iso = d.toISOString().slice(0, 10);
    return join(categoryPath("notes"), `${iso}.md`);
}
//# sourceMappingURL=paths.js.map
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
] as const;

export function categoryPath(category: string): string {
  return join(MEMORIES_DIR, category);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function memoryFilePath(category: string, title: string): string {
  return join(categoryPath(category), `${slugify(title)}.md`);
}

export function dailyNotePath(date?: Date): string {
  const d = date || new Date();
  const iso = d.toISOString().slice(0, 10);
  return join(categoryPath("notes"), `${iso}.md`);
}

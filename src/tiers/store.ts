import type { Shell } from "../types";
import { saveMemory, readMemory, deleteMemory, memoryDir, getCategoryFromPath } from "../storage";
import { getHostname } from "../machine";

export interface StoreOptions {
  category?: string;
  tags?: string;
  importance?: string;
  project?: string;
  source?: string;
}

export async function store(
  $: Shell,
  title: string,
  content: string,
  options: StoreOptions = {},
): Promise<string> {
  const cat = options.category || "notes";
  return saveMemory(cat, title, content, {
    tags: options.tags,
    importance: options.importance,
    project: options.project,
    source: options.source || "agent",
  });
}

export async function read(relPath: string): Promise<string | null> {
  const record = await readMemory(relPath);
  if (!record) return null;
  return `# ${record.fm.title || relPath}\n\n${record.body}`;
}

export async function remove(
  $: Shell,
  relPath: string,
  reason?: string,
): Promise<void> {
  await deleteMemory(relPath);
  if (reason) {
    const notePath = `notes/deletions.md`;
    const note = await readMemory(notePath);
    const entry = `- Deleted: ${relPath} (${new Date().toISOString()}) - ${reason}\n`;
    if (note) {
      const { parseFrontmatter, buildMemoryContent } = await import("../frontmatter");
      const content = await import("../fs").then((m) => m.readFile(note.path, "utf-8"));
      const { fm, body } = parseFrontmatter(content);
      const newContent = buildMemoryContent(fm as Record<string, unknown>, body + entry);
      await import("../fs").then((m) => m.writeFile(note.path, newContent, "utf-8"));
    }
  }
}

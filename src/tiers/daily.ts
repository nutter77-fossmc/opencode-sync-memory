import type { Shell } from "../types";
import { dailyNotePath, categoryPath } from "../paths";
import { readFile, writeFile, mkdir, exists } from "../fs";
import { parseFrontmatter, buildMemoryContent } from "../frontmatter";
import { getHostname } from "../machine";

export async function ensureDailyNote($: Shell): Promise<string> {
  const path = dailyNotePath();
  const hostname = getHostname();

  if (await exists(path)) return path;

  await mkdir(categoryPath("notes"), { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const body = `# ${date}\n\n## Session Notes\n\n## Decisions\n\n## For Next Session\n`;

  const fm: Record<string, unknown> = {
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

export async function appendToDailyNote(
  $: Shell,
  section: string,
  text: string,
): Promise<void> {
  const path = await ensureDailyNote($);
  const content = await readFile(path, "utf-8");
  const { fm, body } = parseFrontmatter(content);

  const updatedBody = body + `\n### ${section}\n${text}\n`;
  const hostname = getHostname();
  fm.updated = new Date().toISOString();
  fm.updated_by = hostname;

  const newContent = buildMemoryContent(fm as Record<string, unknown>, updatedBody);
  await writeFile(path, newContent, "utf-8");
}

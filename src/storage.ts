import { MEMORY_DIR, MEMORIES_DIR, CATEGORIES, categoryPath, memoryFilePath } from "./paths";
import { readFile, writeFile, mkdir, exists } from "./fs";
import { parseFrontmatter, formatFrontmatter, buildMemoryContent, type MemoryMeta } from "./frontmatter";
import { getHostname } from "./machine";
import { join } from "path";

export interface MemoryRecord {
  path: string;
  relativePath: string;
  fm: Partial<MemoryMeta>;
  body: string;
  preview: string;
}

export async function ensureMemoryDir(): Promise<void> {
  for (const cat of CATEGORIES) {
    await mkdir(categoryPath(cat), { recursive: true });
  }
}

export async function readMemory(relPath: string): Promise<MemoryRecord | null> {
  const fullPath = join(MEMORY_DIR, relPath);
  if (!(await exists(fullPath))) return null;
  const content = await readFile(fullPath, "utf-8");
  const { fm, body } = parseFrontmatter(content);
  const preview = body.trim().split("\n").slice(0, 3).join("\n").slice(0, 200);
  return { path: fullPath, relativePath: relPath, fm, body, preview };
}

export async function saveMemory(
  category: string,
  title: string,
  body: string,
  options: {
    tags?: string;
    importance?: string;
    project?: string;
    source?: string;
    related?: string[];
  } = {},
): Promise<string> {
  const hostname = getHostname();
  const now = new Date().toISOString();

  const filePath = memoryFilePath(category, title);

  const existing = await exists(filePath) ? await readMemoryFromPath(filePath) : null;

  const tags = options.tags
    ? options.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : existing?.fm.tags || [];

  const fm: Record<string, unknown> = {
    title,
    tags,
    importance: options.importance || existing?.fm.importance || "medium",
    project: options.project || existing?.fm.project || undefined,
    created: existing?.fm.created || now,
    updated: now,
    created_by: existing?.fm.created_by || hostname,
    updated_by: hostname,
    source: options.source || existing?.fm.source || "manual",
    related: options.related || existing?.fm.related || [],
  };

  const content = buildMemoryContent(fm, body);
  await mkdir(categoryPath(category), { recursive: true });
  await writeFile(filePath, content, "utf-8");

  return filePath;
}

async function readMemoryFromPath(filePath: string): Promise<MemoryRecord | null> {
  const content = await readFile(filePath, "utf-8");
  const { fm, body } = parseFrontmatter(content);
  const preview = body.trim().split("\n").slice(0, 3).join("\n").slice(0, 200);
  return {
    path: filePath,
    relativePath: filePath.replace(MEMORY_DIR + "/", ""),
    fm,
    body,
    preview,
  };
}

export async function deleteMemory(relPath: string): Promise<void> {
  const fullPath = join(MEMORY_DIR, relPath);
  const archiveDir = join(MEMORY_DIR, ".archive");
  await mkdir(archiveDir, { recursive: true });
  const archivePath = join(archiveDir, relPath.replace(/\//g, "_"));
  if (await exists(fullPath)) {
    const content = await readFile(fullPath, "utf-8");
    await writeFile(archivePath, content, "utf-8");
    await writeFile(fullPath, "", "utf-8");
  }
}

export function memoryDir(): string {
  return MEMORY_DIR;
}

export function getCategoryFromPath(relPath: string): string {
  const parts = relPath.split("/");
  return parts[0] || "notes";
}

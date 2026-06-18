import type { Shell } from "./types";
import { MEMORIES_DIR } from "./paths";
import { readFile } from "./fs";
import { parseFrontmatter } from "./frontmatter";
import { searchSessions } from "./session";
import { searchIndex, loadIndex } from "./index-db";

export interface SearchResult {
  path: string;
  title: string;
  preview: string;
  category: string;
  project?: string;
  source: "memory" | "note";
  score: number;
  updated: string;
}

export async function searchMemories(
  $: Shell,
  query: string,
  options?: {
    category?: string;
    limit?: number;
  },
): Promise<SearchResult[]> {
  const limit = options?.limit || 20;
  
  // Try index-based search first (faster)
  if (query.trim()) {
    try {
      const indexedResults = await searchIndex(query, {
        category: options?.category,
        limit,
      });
      
      if (indexedResults.length > 0) {
        return indexedResults.map(memory => ({
          path: memory.path,
          title: memory.title,
          preview: memory.content.slice(0, 200) || "No preview available",
          category: memory.type,
          project: memory.project,
          source: memory.type === "notes" ? "note" : "memory",
          score: memory.confidence * 10, // Convert 0-1 to 0-10 scale
          updated: memory.modified,
        }));
      }
    } catch {
      // Fall back to grep-based search
    }
  }
  
  // Fallback: grep-based search
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    // List all memories if no query
    const idx = await loadIndex();
    return idx.memories.slice(0, limit).map(memory => ({
      path: memory.path,
      title: memory.title,
      preview: memory.content.slice(0, 200) || "No preview available",
      category: memory.type,
      project: memory.project,
      source: memory.type === "notes" ? "note" : "memory",
      score: 0.5,
      updated: memory.modified,
    }));
  }
  
  const results: SearchResult[] = [];

  let searchDir = MEMORIES_DIR;
  if (options?.category) {
    searchDir = `${MEMORIES_DIR}/${options.category}`;
  }

  try {
    const files = await findFiles($, searchDir, terms);
    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const { fm, body } = parseFrontmatter(content);
      const relPath = file.replace(MEMORIES_DIR + "/", "");
      const category = relPath.split("/")[0];
      const score = scoreContent(query, fm.title || "", body, fm.tags || []);
      const preview = body.trim().split("\n").slice(0, 3).join("\n").slice(0, 200);

      if (score > 0) {
        results.push({
          path: relPath,
          title: fm.title || relPath,
          preview,
          category: category || "uncategorized",
          project: fm.project,
          source: category === "notes" ? "note" : "memory",
          score,
          updated: fm.updated || "",
        });
      }
    }
  } catch {}

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

async function findFiles($: Shell, dir: string, terms: string[]): Promise<string[]> {
  const termArgs = terms.map((t) => `-e ${t}`).join(" ");
  try {
    const out = await $`grep -ril ${termArgs} --include="*.md" ${dir}`.text();
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function scoreContent(
  query: string,
  title: string,
  body: string,
  tags: string[],
): number {
  const q = query.toLowerCase();
  let score = 0;
  const text = `${title}\n${body}`.toLowerCase();

  if (title.toLowerCase().includes(q)) score += 10;
  if (text.includes(q)) score += 5;

  for (const tag of tags) {
    if (q.includes(tag.toLowerCase())) score += 3;
  }

  for (const term of q.split(/\s+/)) {
    if (text.includes(term)) score += 2;
    if (title.toLowerCase().includes(term)) score += 4;
  }

  // Recency bonus
  const age = Date.now() - new Date().getTime();
  const daysSinceCreation = age / (1000 * 60 * 60 * 24);
  score += Math.max(0, 5 - daysSinceCreation);

  return score;
}

export async function unifiedSearch(
  $: Shell,
  query: string,
  options?: {
    category?: string;
    limit?: number;
    includeSessions?: boolean;
    sessionDir?: string;
  },
): Promise<SearchResult[]> {
  const memories = await searchMemories($, query, {
    category: options?.category,
    limit: options?.limit || 20,
  });

  if (options?.includeSessions && options?.sessionDir) {
    const sessions = await searchSessions(query, options.sessionDir);
    for (const s of sessions) {
      memories.push({
        path: `session://${s.id}`,
        title: `Session: ${s.title || s.id}`,
        preview: s.preview,
        category: "sessions",
        source: "note",
        score: s.score,
        updated: s.updated,
      });
    }
  }

  memories.sort((a, b) => b.score - a.score);
  return memories.slice(0, options?.limit || 20);
}

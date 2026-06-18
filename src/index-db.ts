import { MEMORY_DIR, MEMORIES_DIR } from "./paths";
import { readFile } from "./fs";
import { parseFrontmatter } from "./frontmatter";
import { join } from "path";
import { existsSync } from "fs";
import { mkdirSync } from "fs";

// SQLite will be available at runtime in OpenCode (bun:sqlite)
// For now, we'll use a JSON-based index that's fast enough for most cases
const INDEX_PATH = join(MEMORY_DIR, ".index.json");

export interface IndexedMemory {
  id: string;
  path: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  project?: string;
  created: string;
  modified: string;
  confidence: number;
  importance: "low" | "medium" | "high";
}

export interface SearchIndex {
  memories: IndexedMemory[];
  lastUpdated: string;
  version: number;
}

let index: SearchIndex | null = null;

export async function loadIndex(): Promise<SearchIndex> {
  if (index) return index;
  
  try {
    if (existsSync(INDEX_PATH)) {
      const content = await readFile(INDEX_PATH, "utf-8");
      index = JSON.parse(content);
      return index!;
    }
  } catch {
    // Index doesn't exist or is corrupted
  }
  
  // Build fresh index
  return await rebuildIndex();
}

export async function rebuildIndex(): Promise<SearchIndex> {
  const memories: IndexedMemory[] = [];
  
  try {
    // Scan all markdown files in memories directory
    const { readdirSync, statSync } = await import("fs");
    
    function scanDir(dir: string, category?: string): void {
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDir(fullPath, entry);
          } else if (entry.endsWith(".md")) {
            // Process markdown file
            const relPath = fullPath.replace(MEMORIES_DIR + "/", "");
            const cat = category || relPath.split("/")[0] || "notes";
            memories.push({
              id: relPath.replace(/\.md$/, ""),
              path: relPath,
              type: cat,
              title: entry.replace(/\.md$/, ""),
              content: "", // Will be loaded on demand
              tags: [],
              created: stat.mtime.toISOString(),
              modified: stat.mtime.toISOString(),
              confidence: 0.5,
              importance: "medium",
            });
          }
        }
      } catch {
        // Directory doesn't exist
      }
    }
    
    scanDir(MEMORIES_DIR);
  } catch {
    // Build failed
  }
  
  index = {
    memories,
    lastUpdated: new Date().toISOString(),
    version: 1,
  };
  
  // Save index
  try {
    const { writeFileSync } = await import("fs");
    writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  } catch {
    // Save failed
  }
  
  return index;
}

export async function searchIndex(
  query: string,
  options?: {
    category?: string;
    limit?: number;
  }
): Promise<IndexedMemory[]> {
  const idx = await loadIndex();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  if (terms.length === 0) return idx.memories.slice(0, options?.limit || 20);
  
  let candidates = idx.memories;
  
  // Filter by category if specified
  if (options?.category) {
    candidates = candidates.filter(m => m.type === options.category);
  }
  
  // Score each memory
  const scored = candidates.map(memory => {
    let score = 0;
    const text = `${memory.title} ${memory.content}`.toLowerCase();
    
    // Title match (highest weight)
    if (memory.title.toLowerCase().includes(query.toLowerCase())) {
      score += 10;
    }
    
    // Content match
    for (const term of terms) {
      if (text.includes(term)) {
        score += 2;
      }
    }
    
    // Tag match
    for (const tag of memory.tags) {
      if (terms.some(t => tag.toLowerCase().includes(t))) {
        score += 3;
      }
    }
    
    // Recency bonus
    const age = Date.now() - new Date(memory.created).getTime();
    const daysSinceCreation = age / (1000 * 60 * 60 * 24);
    score += Math.max(0, 5 - daysSinceCreation);
    
    // Importance multiplier
    const importanceMultiplier = { low: 0.5, medium: 1, high: 1.5 };
    score *= importanceMultiplier[memory.importance] || 1;
    
    return { memory, score };
  });
  
  // Sort by score and return top results
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options?.limit || 20)
    .map(s => s.memory);
}

export function invalidateIndex(): void {
  index = null;
  try {
    const { unlinkSync } = require("fs");
    if (existsSync(INDEX_PATH)) {
      unlinkSync(INDEX_PATH);
    }
  } catch {
    // Ignore errors
  }
}

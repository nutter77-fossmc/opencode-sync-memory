import { MEMORIES_DIR } from "./paths";
import { readFile, writeFile, mkdir, exists } from "./fs";
import { parseFrontmatter, buildMemoryContent } from "./frontmatter";
import { getHostname } from "./machine";
import { join } from "path";
import { readdirSync, statSync } from "fs";

export interface MemoryForConsolidation {
  path: string;
  title: string;
  content: string;
  tags: string[];
  created: string;
  modified: string;
  confidence: number;
  importance: "low" | "medium" | "high";
}

// Find duplicate memories based on title similarity
export function findDuplicates(memories: MemoryForConsolidation[]): MemoryForConsolidation[][] {
  const groups: MemoryForConsolidation[][] = [];
  const processed = new Set<string>();

  for (const mem1 of memories) {
    if (processed.has(mem1.path)) continue;

    const group: MemoryForConsolidation[] = [mem1];
    processed.add(mem1.path);

    for (const mem2 of memories) {
      if (processed.has(mem2.path)) continue;
      
      // Check title similarity
      if (isSimilarTitle(mem1.title, mem2.title)) {
        group.push(mem2);
        processed.add(mem2.path);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups;
}

function isSimilarTitle(title1: string, title2: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const norm1 = normalize(title1);
  const norm2 = normalize(title2);

  // Exact match
  if (norm1 === norm2) return true;

  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  // Levenshtein distance (simple version)
  const distance = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  
  // If strings are similar enough (within 30% edit distance)
  return distance / maxLen < 0.3;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  
  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = [];
  
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  
  return matrix[m][n];
}

// Merge duplicate memories
export async function mergeMemories(group: MemoryForConsolidation[]): Promise<MemoryForConsolidation> {
  const hostname = getHostname();
  const now = new Date().toISOString();

  // Select the best memory (highest confidence, most recent)
  const best = group.reduce((a, b) => {
    if (a.confidence > b.confidence) return a;
    if (a.confidence < b.confidence) return b;
    if (a.modified > b.modified) return a;
    return b;
  });

  // Merge tags
  const allTags = new Set<string>();
  for (const mem of group) {
    for (const tag of mem.tags) {
      allTags.add(tag);
    }
  }

  // Merge content (keep the best one, append others as notes)
  let mergedContent = best.content;
  const otherContents = group
    .filter(m => m.path !== best.path)
    .map(m => `- ${m.title}: ${m.content.slice(0, 100)}`)
    .join("\n");

  if (otherContents) {
    mergedContent += `\n\n## Related notes\n${otherContents}`;
  }

  // Determine importance (highest among group)
  const importanceOrder = { low: 0, medium: 1, high: 2 };
  const maxImportance = group.reduce((max, mem) => {
    return importanceOrder[mem.importance] > importanceOrder[max] ? mem.importance : max;
  }, "low" as "low" | "medium" | "high");

  return {
    path: best.path,
    title: best.title,
    content: mergedContent,
    tags: Array.from(allTags),
    created: best.created,
    modified: now,
    confidence: Math.max(...group.map(m => m.confidence)),
    importance: maxImportance,
  };
}

// Check for stale memories that should be archived
export async function findStaleMemories(): Promise<MemoryForConsolidation[]> {
  const stale: MemoryForConsolidation[] = [];
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  try {
    const files = readdirSync(MEMORIES_DIR, { recursive: true });
    
    for (const file of files) {
      if (typeof file !== "string" || !file.endsWith(".md")) continue;
      
      const fullPath = join(MEMORIES_DIR, file);
      const stat = statSync(fullPath);
      
      // Check if file is older than 30 days
      if (now - stat.mtimeMs > thirtyDays) {
        const content = await readFile(fullPath, "utf-8");
        const { fm, body } = parseFrontmatter(content);
        
        // Check if memory has expired
        if (fm.expires) {
          const expiryDate = new Date(fm.expires as string);
          if (expiryDate < new Date()) {
            stale.push({
              path: file,
              title: fm.title || file.replace(/\.md$/, ""),
              content: body,
              tags: (fm.tags as string[]) || [],
              created: (fm.created as string) || stat.birthtime.toISOString(),
              modified: stat.mtime.toISOString(),
              confidence: (fm.confidence as number) || 0.5,
              importance: (fm.importance as "low" | "medium" | "high") || "medium",
            });
          }
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return stale;
}

// Archive a memory
export async function archiveMemory(memory: MemoryForConsolidation): Promise<void> {
  const archiveDir = join(MEMORIES_DIR, ".archive");
  await mkdir(archiveDir, { recursive: true });
  
  const archivePath = join(archiveDir, memory.path.replace(/\//g, "_"));
  const content = await readFile(join(MEMORIES_DIR, memory.path), "utf-8");
  
  await writeFile(archivePath, content, "utf-8");
}

// Full consolidation process
export async function consolidateMemories(): Promise<{
  duplicatesFound: number;
  duplicatesMerged: number;
  staleFound: number;
  staleArchived: number;
}> {
  const hostname = getHostname();
  const stats = {
    duplicatesFound: 0,
    duplicatesMerged: 0,
    staleFound: 0,
    staleArchived: 0,
  };

  // Load all memories
  const allMemories: MemoryForConsolidation[] = [];
  
  try {
    const files = readdirSync(MEMORIES_DIR, { recursive: true });
    
    for (const file of files) {
      if (typeof file !== "string" || !file.endsWith(".md")) continue;
      
      const fullPath = join(MEMORIES_DIR, file);
      const content = await readFile(fullPath, "utf-8");
      const { fm, body } = parseFrontmatter(content);
      
      allMemories.push({
        path: file,
        title: (fm.title as string) || file.replace(/\.md$/, ""),
        content: body,
        tags: (fm.tags as string[]) || [],
        created: (fm.created as string) || new Date().toISOString(),
        modified: (fm.updated as string) || new Date().toISOString(),
        confidence: (fm.confidence as number) || 0.5,
        importance: (fm.importance as "low" | "medium" | "high") || "medium",
      });
    }
  } catch {
    // Directory doesn't exist
  }

  // Find and merge duplicates
  const duplicateGroups = findDuplicates(allMemories);
  stats.duplicatesFound = duplicateGroups.reduce((sum, group) => sum + group.length, 0);

  for (const group of duplicateGroups) {
    const merged = await mergeMemories(group);
    
    // Save merged memory
    const category = merged.path.split("/")[0] || "notes";
    const title = merged.title;
    const body = merged.content;
    
    // Delete old duplicates
    for (const mem of group) {
      if (mem.path !== merged.path) {
        const fullPath = join(MEMORIES_DIR, mem.path);
        if (await exists(fullPath)) {
          const { unlinkSync } = await import("fs");
          unlinkSync(fullPath);
        }
      }
    }
    
    stats.duplicatesMerged++;
  }

  // Find and archive stale memories
  const staleMemories = await findStaleMemories();
  stats.staleFound = staleMemories.length;

  for (const memory of staleMemories) {
    await archiveMemory(memory);
    
    // Remove from active store
    const fullPath = join(MEMORIES_DIR, memory.path);
    if (await exists(fullPath)) {
      const { unlinkSync } = await import("fs");
      unlinkSync(fullPath);
    }
    
    stats.staleArchived++;
  }

  return stats;
}

// Manual consolidation tool
export async function manualConsolidate(): Promise<string> {
  const stats = await consolidateMemories();
  
  let output = `## Consolidation Complete\n\n`;
  output += `**Duplicates found**: ${stats.duplicatesFound}\n`;
  output += `**Duplicates merged**: ${stats.duplicatesMerged}\n`;
  output += `**Stale memories found**: ${stats.staleFound}\n`;
  output += `**Stale memories archived**: ${stats.staleArchived}\n`;
  
  return output;
}

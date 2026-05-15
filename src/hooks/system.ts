import type { Shell } from "../types";
import { loadConfig } from "../config";
import { buildActiveContext } from "../tiers/active";

export async function getSystemContext(
  $: Shell,
  project?: string,
): Promise<string> {
  const config = await loadConfig();
  if (!config.injection.enabled) return "";

  const ctx = await buildActiveContext(
    $,
    project,
    config.injection.maxMemories,
    config.injection.maxLinesPerMemory,
  );

  if (!ctx.memories.trim()) return "";

  return `<memory_context>
You have a persistent memory store at ~/.opencode-memory/ with ${ctx.counts.total} entries.
Here are the most relevant memories for this session:

${ctx.memories}

To save new memories: use memory_save
To search all memories: use memory_search
To read full details: use memory_read
To browse categories: use memory_list
</memory_context>`;
}

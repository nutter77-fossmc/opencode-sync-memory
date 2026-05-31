import type { Shell } from "../types";

let toolCallCount = 0;
const NUDGE_INTERVAL = 6;

export async function onToolExecuted(
  $: Shell,
  toolName: string,
): Promise<string | null> {
  toolCallCount++;

  const saveTriggers = ["read", "write", "edit", "bash", "grep", "glob"];
  if (saveTriggers.includes(toolName)) {
    if (toolCallCount >= NUDGE_INTERVAL) {
      toolCallCount = 0;
      return `Auto-save suggestion: Consider saving key findings to memory with memory_save (category, title, content). Save preferences, decisions, architecture facts, and useful commands.`;
    }
  }

  return null;
}

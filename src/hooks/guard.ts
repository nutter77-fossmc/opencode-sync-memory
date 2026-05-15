import type { Shell } from "../types";

let toolCallCount = 0;
const NUDGE_INTERVAL = 8;

export async function onToolExecuted(
  $: Shell,
  toolName: string,
): Promise<string | null> {
  toolCallCount++;

  const saveTriggers = ["read", "write", "edit", "bash", "grep", "glob"];
  if (saveTriggers.includes(toolName)) {
    if (toolCallCount >= NUDGE_INTERVAL) {
      toolCallCount = 0;
      return `Consider saving any important findings to memory using memory_save.`;
    }
  }

  return null;
}

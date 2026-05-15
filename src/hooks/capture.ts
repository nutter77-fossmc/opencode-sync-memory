import type { Shell } from "../types";
import { ensureDailyNote, appendToDailyNote } from "../tiers/daily";

let lastSessionId: string | null = null;

export async function onSessionCreated(
  $: Shell,
  sessionId: string,
): Promise<void> {
  if (lastSessionId === sessionId) return;
  lastSessionId = sessionId;
  await ensureDailyNote($);
}

export async function onSessionIdle(
  $: Shell,
  sessionId: string,
): Promise<void> {
  await appendToDailyNote(
    $,
    "Session Complete",
    `Session ${sessionId} completed at ${new Date().toISOString()}`,
  );
}

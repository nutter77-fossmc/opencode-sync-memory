import type { Shell } from "../types";
import { saveMemory } from "../storage";
import { ensureDailyNote, appendToDailyNote } from "../tiers/daily";
import { getHostname } from "../machine";
import { commitAll, rebasePull, push, hasRemote, getRemoteUrl } from "../git";

let captureBuffer: string[] = [];

export function bufferActivity(summary: string): void {
  captureBuffer.push(summary);
  if (captureBuffer.length > 20) {
    captureBuffer = captureBuffer.slice(-10);
  }
}

export async function flushCaptureBuffer(
  $: Shell,
  sessionId: string,
  remoteUrl?: string,
): Promise<void> {
  if (captureBuffer.length === 0) return;

  const date = new Date().toISOString().slice(0, 10);
  const hostname = getHostname();
  const summary = captureBuffer.join("\n");

  await appendToDailyNote(
    $,
    "Activity Summary",
    `\n${summary}\n`,
  );

  captureBuffer = [];
}

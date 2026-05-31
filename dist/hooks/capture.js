import { ensureDailyNote, appendToDailyNote } from "../tiers/daily";
let lastSessionId = null;
export async function onSessionCreated($, sessionId) {
    if (lastSessionId === sessionId)
        return;
    lastSessionId = sessionId;
    await ensureDailyNote($);
}
export async function onSessionIdle($, sessionId) {
    await appendToDailyNote($, "Session Complete", `Session ${sessionId} completed at ${new Date().toISOString()}`);
}
//# sourceMappingURL=capture.js.map
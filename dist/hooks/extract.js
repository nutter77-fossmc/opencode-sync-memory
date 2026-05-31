import { appendToDailyNote } from "../tiers/daily";
import { getHostname } from "../machine";
let captureBuffer = [];
export function bufferActivity(summary) {
    captureBuffer.push(summary);
    if (captureBuffer.length > 20) {
        captureBuffer = captureBuffer.slice(-10);
    }
}
export async function flushCaptureBuffer($, sessionId, remoteUrl) {
    if (captureBuffer.length === 0)
        return;
    const date = new Date().toISOString().slice(0, 10);
    const hostname = getHostname();
    const summary = captureBuffer.join("\n");
    await appendToDailyNote($, "Activity Summary", `\n${summary}\n`);
    captureBuffer = [];
}
//# sourceMappingURL=extract.js.map
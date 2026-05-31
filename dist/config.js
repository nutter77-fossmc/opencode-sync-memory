import { homedir } from "os";
import { join } from "path";
import { mkdir, readFile, writeFile } from "./fs";
import { normalizeGitUrl } from "./repo";
export const DEFAULT_CONFIG = {
    remote: {
        url: "",
        branch: "main",
        autoCreate: true,
    },
    categories: [
        "preferences",
        "repos",
        "technical",
        "people",
        "workflows",
        "snippets",
        "notes",
    ],
    injection: {
        enabled: true,
        maxMemories: 5,
        maxLinesPerMemory: 3,
    },
    dailyNotes: {
        enabled: true,
        autoCreate: true,
    },
    sessionSearch: {
        enabled: true,
        maxResults: 10,
    },
};
const CONFIG_PATH = join(homedir(), ".config", "opencode", "opencode-sync-memory.jsonc");
export async function loadConfig() {
    try {
        const content = await readFile(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(stripJsonc(content));
        const config = { ...DEFAULT_CONFIG, ...parsed };
        // Normalize any malformed remote URL
        if (config.remote.url) {
            config.remote.url = normalizeGitUrl(config.remote.url);
        }
        return config;
    }
    catch {
        return { ...DEFAULT_CONFIG };
    }
}
export async function saveConfig(config) {
    const dir = join(homedir(), ".config", "opencode");
    await mkdir(dir, { recursive: true });
    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
function stripJsonc(text) {
    return text
        .split("\n")
        .filter((line) => !line.trim().startsWith("//"))
        .join("\n");
}
//# sourceMappingURL=config.js.map
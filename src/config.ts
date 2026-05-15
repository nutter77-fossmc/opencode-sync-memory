export interface SyncMemoryConfig {
  remote: {
    url: string;
    branch: string;
    autoCreate: boolean;
  };
  categories: string[];
  injection: {
    enabled: boolean;
    maxMemories: number;
    maxLinesPerMemory: number;
  };
  dailyNotes: {
    enabled: boolean;
    autoCreate: boolean;
  };
  sessionSearch: {
    enabled: boolean;
    maxResults: number;
  };
}

export const DEFAULT_CONFIG: SyncMemoryConfig = {
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

const CONFIG_PATH = join(
  homedir(),
  ".config",
  "opencode",
  "opencode-sync-memory.jsonc",
);

import { homedir } from "os";
import { join } from "path";
import { mkdir, readFile, writeFile, exists } from "./fs";

export async function loadConfig(): Promise<SyncMemoryConfig> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(stripJsonc(content));
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(
  config: SyncMemoryConfig,
): Promise<void> {
  const dir = join(homedir(), ".config", "opencode");
  await mkdir(dir, { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

function stripJsonc(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

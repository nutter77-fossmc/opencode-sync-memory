import { homedir } from "os";
import { join } from "path";
import { readFile, exists } from "./fs";

interface SessionInfo {
  id: string;
  title: string;
  preview: string;
  project?: string;
  updated: string;
  score: number;
}

function sessionDbPath(): string {
  const platform = process.platform;
  if (platform === "darwin") {
    const possible = [
      join(homedir(), "Library", "Application Support", "opencode", "opencode.db"),
      join(homedir(), "Library", "Application Support", "opencode", "sessions.db"),
    ];
    return possible[0];
  }
  if (platform === "linux") {
    return join(homedir(), ".local", "share", "opencode", "opencode.db");
  }
  if (platform === "win32") {
    return join(homedir(), "AppData", "Roaming", "opencode", "opencode.db");
  }
  return join(homedir(), ".local", "share", "opencode", "opencode.db");
}

async function tryReadSessionDb(): Promise<unknown[] | null> {
  const dbPath = sessionDbPath();
  if (!(await exists(dbPath))) return null;

  try {
    // @ts-expect-error - bun:sqlite is available at runtime in opencode
    const { Database } = await import("bun:sqlite");
    const db = new Database(dbPath);
    const rows = db
      .query(
        `SELECT id, title, updated_at FROM sessions ORDER BY updated_at DESC LIMIT 100`,
      )
      .all() as unknown[];
    db.close();
    return rows;
  } catch {
    return null;
  }
}

export async function searchSessions(
  query: string,
  _dir?: string,
): Promise<SessionInfo[]> {
  const results: SessionInfo[] = [];
  const q = query.toLowerCase();

  const rows = await tryReadSessionDb();
  if (!rows) return results;

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const title = (r.title as string) || "";
    const id = (r.id as string) || "";
    const updated = (r.updated_at as string) || "";

    if (title.toLowerCase().includes(q) || id.toLowerCase().includes(q)) {
      results.push({
        id,
        title: title || id,
        preview: title.slice(0, 200),
        updated,
        score: title.toLowerCase().includes(q) ? 8 : 4,
      });
    }
  }

  return results;
}

import { MEMORY_DIR } from "./paths";
import { getHostname } from "./machine";
import type { Shell } from "./types";

const GIT = "git";

export async function isRepo($: Shell): Promise<boolean> {
  try {
    const out = await $`${GIT} -C ${MEMORY_DIR} rev-parse --is-inside-work-tree`.text();
    return out.trim() === "true";
  } catch {
    return false;
  }
}

export async function initRepo($: Shell): Promise<void> {
  try {
    await $`${GIT} -C ${MEMORY_DIR} init`;
    await $`${GIT} -C ${MEMORY_DIR} branch -M main`;
  } catch {
    // git init failed — safe to ignore, repo may already exist
  }
}

export async function hasRemote($: Shell): Promise<boolean> {
  try {
    const out = await $`${GIT} -C ${MEMORY_DIR} remote -v`.text();
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

export async function getRemoteUrl($: Shell): Promise<string> {
  const out = await $`${GIT} -C ${MEMORY_DIR} remote get-url origin`.text();
  return out.trim();
}

export async function setRemote($: Shell, url: string): Promise<void> {
  const exists = await hasRemote($);
  if (exists) {
    await $`${GIT} -C ${MEMORY_DIR} remote set-url origin ${url}`;
  } else {
    await $`${GIT} -C ${MEMORY_DIR} remote add origin ${url}`;
  }
}

export async function commitAll($: Shell, message: string): Promise<boolean> {
  try {
    const status = await $`${GIT} -C ${MEMORY_DIR} status --porcelain`.text();
    if (!status.trim()) return false;
    await $`${GIT} -C ${MEMORY_DIR} add -A`;
    await $`${GIT} -C ${MEMORY_DIR} commit -m ${message}`;
    return true;
  } catch {
    return false;
  }
}

export async function currentBranch($: Shell): Promise<string> {
  const out = await $`${GIT} -C ${MEMORY_DIR} rev-parse --abbrev-ref HEAD`.text();
  return out.trim();
}

export async function rebasePull($: Shell): Promise<{
  ok: boolean;
  conflicted: string[];
}> {
  try {
    await $`${GIT} -C ${MEMORY_DIR} pull --rebase origin main`.text();
    return { ok: true, conflicted: [] };
  } catch {
    const conflicted = await getConflictedFiles($);
    return { ok: conflicted.length === 0, conflicted };
  }
}

export async function push($: Shell): Promise<boolean> {
  try {
    const branch = await currentBranch($);
    await $`${GIT} -C ${MEMORY_DIR} push origin ${branch}`.text();
    return true;
  } catch {
    return false;
  }
}

export async function getConflictedFiles($: Shell): Promise<string[]> {
  try {
    const out = await $`${GIT} -C ${MEMORY_DIR} diff --name-only --diff-filter=U`.text();
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function resolveConflict(
  $: Shell,
  filePath: string,
): Promise<string[]> {
  const hostname = getHostname();
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const base = filePath.replace(/\.md$/, "");

  const content = await $`${GIT} -C ${MEMORY_DIR} show :${filePath}`.text();

  const ours = extractOurs(content);
  const theirs = extractTheirs(content);

  const localFile = `${base}.local.${hostname}.${ts}.md`;
  const remoteFile = `${base}.remote.${ts}.md`;

  const localFm = {
    conflict_of: filePath,
    title: `Local version from ${hostname}`,
    created: new Date().toISOString(),
    created_by: hostname,
  };
  const remoteFm = {
    conflict_of: filePath,
    title: `Remote version from other machine`,
    created: new Date().toISOString(),
    created_by: "remote",
  };

  const { formatFrontmatter } = await import("./frontmatter");
  const { writeFile } = await import("./fs");
  const { join } = await import("path");
  
  await writeFile(
    join(MEMORY_DIR, localFile),
    formatFrontmatter(localFm) + "\n" + ours,
    "utf-8"
  );
  await writeFile(
    join(MEMORY_DIR, remoteFile),
    formatFrontmatter(remoteFm) + "\n" + theirs,
    "utf-8"
  );

  const resolvedFm = {
    title: `Conflict resolved: ${base.split("/").pop()}`,
    conflicts_with: [localFile, remoteFile],
    updated: new Date().toISOString(),
    updated_by: hostname,
  };
  const resolvedBody = `This memory had a conflict between local (${hostname}) and remote versions.\n\nSee:\n- [Local version](${localFile})\n- [Remote version](${remoteFile})`;
  await writeFile(
    join(MEMORY_DIR, filePath),
    formatFrontmatter(resolvedFm) + "\n" + resolvedBody,
    "utf-8"
  );

  await $`${GIT} -C ${MEMORY_DIR} add ${filePath} ${localFile} ${remoteFile}`;

  return [localFile, remoteFile];
}

function extractOurs(content: string): string {
  const match = content.match(/<<<<<<< HEAD\n([\s\S]*?)\n=======/);
  return match ? match[1].trim() : "";
}

function extractTheirs(content: string): string {
  const match = content.match(/=======\n([\s\S]*?)>>>>>>> /);
  return match ? match[1].trim() : "";
}

export async function continueRebase($: Shell): Promise<void> {
  try {
    await $`${GIT} -C ${MEMORY_DIR} rebase --continue --no-edit`.text();
  } catch {
    await $`${GIT} -C ${MEMORY_DIR} commit --allow-empty -m "conflict resolution"`.text();
  }
}

export async function cloneRepo($: Shell, url: string): Promise<void> {
  await $`${GIT} clone ${url} ${MEMORY_DIR}`.text();
}

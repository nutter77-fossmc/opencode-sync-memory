import { MEMORY_DIR } from "./paths";
import { getHostname } from "./machine";
import type { Shell } from "./types";

export async function isRepo($: Shell): Promise<boolean> {
  try {
    const out = await $`cd ${MEMORY_DIR} && git rev-parse --is-inside-work-tree`.text();
    return out.trim() === "true";
  } catch {
    return false;
  }
}

export async function initRepo($: Shell): Promise<void> {
  await $`cd ${MEMORY_DIR} && git init && git branch -M main`;
}

export async function hasRemote($: Shell): Promise<boolean> {
  try {
    const out = await $`cd ${MEMORY_DIR} && git remote -v`.text();
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

export async function getRemoteUrl($: Shell): Promise<string> {
  const out = await $`cd ${MEMORY_DIR} && git remote get-url origin`.text();
  return out.trim();
}

export async function setRemote($: Shell, url: string): Promise<void> {
  const exists = await hasRemote($);
  if (exists) {
    await $`cd ${MEMORY_DIR} && git remote set-url origin ${url}`;
  } else {
    await $`cd ${MEMORY_DIR} && git remote add origin ${url}`;
  }
}

export async function commitAll($: Shell, message: string): Promise<boolean> {
  const status = await $`cd ${MEMORY_DIR} && git status --porcelain`.text();
  if (!status.trim()) return false;
  await $`cd ${MEMORY_DIR} && git add -A`;
  await $`cd ${MEMORY_DIR} && git commit -m ${message}`;
  return true;
}

export async function currentBranch($: Shell): Promise<string> {
  const out = await $`cd ${MEMORY_DIR} && git rev-parse --abbrev-ref HEAD`.text();
  return out.trim();
}

export async function rebasePull($: Shell): Promise<{
  ok: boolean;
  conflicted: string[];
}> {
  try {
    await $`cd ${MEMORY_DIR} && git pull --rebase origin main`.text();
    return { ok: true, conflicted: [] };
  } catch {
    const conflicted = await getConflictedFiles($);
    return { ok: conflicted.length === 0, conflicted };
  }
}

export async function push($: Shell): Promise<boolean> {
  try {
    const branch = await currentBranch($);
    await $`cd ${MEMORY_DIR} && git push origin ${branch}`.text();
    return true;
  } catch {
    return false;
  }
}

export async function getConflictedFiles($: Shell): Promise<string[]> {
  try {
    const out = await $`cd ${MEMORY_DIR} && git diff --name-only --diff-filter=U`.text();
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

  const content = await $`cd ${MEMORY_DIR} && cat ${filePath}`.text();

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
  await $`echo ${formatFrontmatter(localFm)}\n${ours} > ${MEMORY_DIR}/${localFile}`.text();
  await $`echo ${formatFrontmatter(remoteFm)}\n${theirs} > ${MEMORY_DIR}/${remoteFile}`.text();

  const resolvedFm = {
    title: `Conflict resolved: ${base.split("/").pop()}`,
    conflicts_with: [localFile, remoteFile],
    updated: new Date().toISOString(),
    updated_by: hostname,
  };
  const resolvedBody = `This memory had a conflict between local (${hostname}) and remote versions.\n\nSee:\n- [Local version](${localFile})\n- [Remote version](${remoteFile})`;
  await $`echo ${formatFrontmatter(resolvedFm)}\n${resolvedBody} > ${MEMORY_DIR}/${filePath}`.text();

  await $`cd ${MEMORY_DIR} && git add ${filePath} ${localFile} ${remoteFile}`.text();

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
    await $`cd ${MEMORY_DIR} && git rebase --continue --no-edit`.text();
  } catch {
    await $`cd ${MEMORY_DIR} && git commit --allow-empty -m "conflict resolution"`.text();
  }
}

export async function cloneRepo($: Shell, url: string): Promise<void> {
  await $`git clone ${url} ${MEMORY_DIR}`.text();
}

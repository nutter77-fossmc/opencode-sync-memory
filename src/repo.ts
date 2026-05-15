import type { Shell } from "./types";
import { MEMORY_DIR } from "./paths";

export async function ensureGhAuthenticated($: Shell): Promise<boolean> {
  try {
    await $`gh auth status`.text();
    return true;
  } catch {
    return false;
  }
}

export async function createPrivateRepo(
  $: Shell,
  name: string,
): Promise<string> {
  const out = await $`gh repo create ${name} --private --description "opencode-sync-memory: persistent memory store"`.text();
  const url = `git@github.com:${out.trim() || name}.git`;
  return url;
}

export async function repoExists($: Shell, name: string): Promise<boolean> {
  try {
    await $`gh repo view ${name} --json name`.text();
    return true;
  } catch {
    return false;
  }
}

export async function getSuggestedRepoName($: Shell): Promise<string> {
  try {
    const out = await $`gh api user --jq .login`.text();
    const user = out.trim();
    return `${user}/opencode-memory`;
  } catch {
    return "opencode-memory";
  }
}

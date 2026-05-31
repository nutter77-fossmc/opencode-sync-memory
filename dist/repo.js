export function normalizeGitUrl(input) {
    // Fix malformed URLs like "git@github.com:https://github.com/user/repo.git"
    const malformedPattern = /^git@github\.com:https:\/\/github\.com\//;
    if (malformedPattern.test(input)) {
        return input.replace(malformedPattern, "https://github.com/");
    }
    // Fix "git@github.com:https://..." (any https path)
    const mixedPattern = /^git@github\.com:https?:\/\//;
    if (mixedPattern.test(input)) {
        return input.replace(/^git@github\.com:/, "");
    }
    // Fix "git@github.com:user/repo.git" -> "https://github.com/user/repo.git"
    const sshPattern = /^git@github\.com:(.+)$/;
    const sshMatch = input.match(sshPattern);
    if (sshMatch) {
        return `https://github.com/${sshMatch[1]}`;
    }
    return input;
}
export async function ensureGhAuthenticated($) {
    try {
        await $ `gh auth status`.text();
        return true;
    }
    catch {
        return false;
    }
}
export async function createPrivateRepo($, name) {
    await $ `gh repo create ${name} --private --description "opencode-sync-memory: persistent memory store"`.text();
    const url = `https://github.com/${name}.git`;
    return url;
}
export async function repoExists($, name) {
    try {
        await $ `gh repo view ${name} --json name`.text();
        return true;
    }
    catch {
        return false;
    }
}
export async function getSuggestedRepoName($) {
    try {
        const out = await $ `gh api user --jq .login`.text();
        const user = out.trim();
        return `${user}/opencode-memory`;
    }
    catch {
        return "opencode-memory";
    }
}
//# sourceMappingURL=repo.js.map
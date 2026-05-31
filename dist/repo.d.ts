import type { Shell } from "./types";
export declare function normalizeGitUrl(input: string): string;
export declare function ensureGhAuthenticated($: Shell): Promise<boolean>;
export declare function createPrivateRepo($: Shell, name: string): Promise<string>;
export declare function repoExists($: Shell, name: string): Promise<boolean>;
export declare function getSuggestedRepoName($: Shell): Promise<string>;
//# sourceMappingURL=repo.d.ts.map
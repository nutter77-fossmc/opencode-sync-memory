import type { Shell } from "./types";
export declare function isRepo($: Shell): Promise<boolean>;
export declare function initRepo($: Shell): Promise<void>;
export declare function hasRemote($: Shell): Promise<boolean>;
export declare function getRemoteUrl($: Shell): Promise<string>;
export declare function setRemote($: Shell, url: string): Promise<void>;
export declare function commitAll($: Shell, message: string): Promise<boolean>;
export declare function currentBranch($: Shell): Promise<string>;
export declare function rebasePull($: Shell): Promise<{
    ok: boolean;
    conflicted: string[];
}>;
export declare function push($: Shell): Promise<boolean>;
export declare function getConflictedFiles($: Shell): Promise<string[]>;
export declare function resolveConflict($: Shell, filePath: string): Promise<string[]>;
export declare function continueRebase($: Shell): Promise<void>;
export declare function cloneRepo($: Shell, url: string): Promise<void>;
//# sourceMappingURL=git.d.ts.map
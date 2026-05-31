import type { Shell } from "./types";
export interface SearchResult {
    path: string;
    title: string;
    preview: string;
    category: string;
    project?: string;
    source: "memory" | "note";
    score: number;
    updated: string;
}
export declare function searchMemories($: Shell, query: string, options?: {
    category?: string;
    limit?: number;
}): Promise<SearchResult[]>;
export declare function unifiedSearch($: Shell, query: string, options?: {
    category?: string;
    limit?: number;
    includeSessions?: boolean;
    sessionDir?: string;
}): Promise<SearchResult[]>;
//# sourceMappingURL=search.d.ts.map
import type { Shell } from "../types";
export interface ActiveContext {
    memories: string;
    counts: {
        total: number;
        byCategory: Record<string, number>;
    };
}
export declare function buildActiveContext($: Shell, project?: string, maxMemories?: number, maxLines?: number): Promise<ActiveContext>;
//# sourceMappingURL=active.d.ts.map
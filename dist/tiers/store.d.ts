import type { Shell } from "../types";
export interface StoreOptions {
    category?: string;
    tags?: string;
    importance?: string;
    project?: string;
    source?: string;
}
export declare function store($: Shell, title: string, content: string, options?: StoreOptions): Promise<string>;
export declare function read(relPath: string): Promise<string | null>;
export declare function remove($: Shell, relPath: string, reason?: string): Promise<void>;
//# sourceMappingURL=store.d.ts.map
import { type MemoryMeta } from "./frontmatter";
export interface MemoryRecord {
    path: string;
    relativePath: string;
    fm: Partial<MemoryMeta>;
    body: string;
    preview: string;
}
export declare function ensureMemoryDir(): Promise<void>;
export declare function readMemory(relPath: string): Promise<MemoryRecord | null>;
export declare function saveMemory(category: string, title: string, body: string, options?: {
    tags?: string;
    importance?: string;
    project?: string;
    source?: string;
    related?: string[];
}): Promise<string>;
export declare function deleteMemory(relPath: string): Promise<void>;
export declare function memoryDir(): string;
export declare function getCategoryFromPath(relPath: string): string;
//# sourceMappingURL=storage.d.ts.map
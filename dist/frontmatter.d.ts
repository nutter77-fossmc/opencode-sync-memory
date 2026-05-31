export interface MemoryMeta {
    title: string;
    tags: string[];
    importance: "low" | "medium" | "high";
    project?: string;
    created: string;
    updated: string;
    created_by: string;
    updated_by: string;
    source: string;
    related: string[];
    conflicts_with?: string[];
    conflict_of?: string;
}
export declare function parseFrontmatter(content: string): {
    fm: Partial<MemoryMeta>;
    body: string;
};
export declare function formatFrontmatter(fm: Record<string, unknown>): string;
export declare function buildMemoryContent(fm: Record<string, unknown>, body: string): string;
//# sourceMappingURL=frontmatter.d.ts.map
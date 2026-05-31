export declare const MEMORY_DIR: string;
export declare const MEMORIES_DIR: string;
export declare const CATEGORIES: readonly ["preferences", "repos", "technical", "people", "workflows", "snippets", "notes"];
export declare function categoryPath(category: string): string;
export declare function slugify(text: string): string;
export declare function memoryFilePath(category: string, title: string): string;
export declare function dailyNotePath(date?: Date): string;
//# sourceMappingURL=paths.d.ts.map
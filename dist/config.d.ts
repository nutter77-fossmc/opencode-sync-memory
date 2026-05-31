export interface SyncMemoryConfig {
    remote: {
        url: string;
        branch: string;
        autoCreate: boolean;
    };
    categories: string[];
    injection: {
        enabled: boolean;
        maxMemories: number;
        maxLinesPerMemory: number;
    };
    dailyNotes: {
        enabled: boolean;
        autoCreate: boolean;
    };
    sessionSearch: {
        enabled: boolean;
        maxResults: number;
    };
}
export declare const DEFAULT_CONFIG: SyncMemoryConfig;
export declare function loadConfig(): Promise<SyncMemoryConfig>;
export declare function saveConfig(config: SyncMemoryConfig): Promise<void>;
//# sourceMappingURL=config.d.ts.map
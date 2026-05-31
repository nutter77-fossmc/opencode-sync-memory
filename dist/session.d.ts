interface SessionInfo {
    id: string;
    title: string;
    preview: string;
    project?: string;
    updated: string;
    score: number;
}
export declare function searchSessions(query: string, _dir?: string): Promise<SessionInfo[]>;
export {};
//# sourceMappingURL=session.d.ts.map
import { searchMemories } from "../search";
import { CATEGORIES } from "../paths";
export async function buildActiveContext($, project, maxMemories = 5, maxLines = 3) {
    const totalFiles = await countFiles($);
    const categoryCounts = {};
    for (const cat of CATEGORIES) {
        categoryCounts[cat] = await countFilesInCategory($, cat);
    }
    let memories = [];
    if (project) {
        memories = await searchMemories($, project, { limit: maxMemories });
    }
    if (memories.length < maxMemories) {
        for (const cat of CATEGORIES) {
            if (memories.length >= maxMemories)
                break;
            const more = await searchMemories($, cat === "notes" ? "" : cat, {
                category: cat,
                limit: maxMemories - memories.length,
            });
            for (const m of more) {
                if (!memories.find((e) => e.path === m.path)) {
                    memories.push(m);
                }
            }
        }
    }
    const memoryLines = memories
        .slice(0, maxMemories)
        .map((m) => {
        const lines = m.preview.split("\n").slice(0, maxLines).join("\n");
        return `- [${m.title}] (${m.category})${m.project ? ` project:${m.project}` : ""}\n  ${lines}`;
    })
        .join("\n\n");
    return {
        memories: memoryLines,
        counts: {
            total: totalFiles,
            byCategory: categoryCounts,
        },
    };
}
async function countFiles($) {
    try {
        const out = await $ `find ${CATEGORIES.map((c) => `"${c}"`).join(" ")} -name "*.md" 2>/dev/null | wc -l`.text();
        return parseInt(out.trim()) || 0;
    }
    catch {
        return 0;
    }
}
async function countFilesInCategory($, category) {
    try {
        const out = await $ `find "memories/${category}" -name "*.md" 2>/dev/null | wc -l`.text();
        return parseInt(out.trim()) || 0;
    }
    catch {
        return 0;
    }
}
//# sourceMappingURL=active.js.map
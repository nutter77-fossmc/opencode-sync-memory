const FM_RE = /^---\n([\s\S]*?)\n---\n/;
export function parseFrontmatter(content) {
    const match = content.match(FM_RE);
    if (!match)
        return { fm: {}, body: content };
    const fm = {};
    for (const line of match[1].split("\n")) {
        const idx = line.indexOf(":");
        if (idx === -1)
            continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (!key)
            continue;
        if (val.startsWith("[") && val.endsWith("]")) {
            fm[key] = val
                .slice(1, -1)
                .split(",")
                .map((v) => v.trim().replace(/^['"]|['"]$/g, ""))
                .filter(Boolean);
        }
        else if (val === "true")
            fm[key] = true;
        else if (val === "false")
            fm[key] = false;
        else if (/^\d+$/.test(val))
            fm[key] = parseInt(val, 10);
        else
            fm[key] = val.replace(/^['"]|['"]$/g, "");
    }
    return { fm: fm, body: content.slice(match[0].length) };
}
export function formatFrontmatter(fm) {
    const lines = ["---"];
    for (const [key, val] of Object.entries(fm)) {
        if (val === undefined || val === null)
            continue;
        if (Array.isArray(val)) {
            lines.push(`${key}: [${val
                .map((v) => typeof v === "string" && (v.includes(" ") || v.includes(","))
                ? `"${v}"`
                : v)
                .join(", ")}]`);
        }
        else if (typeof val === "string" && (val.includes(" ") || val.includes(":"))) {
            lines.push(`${key}: "${val}"`);
        }
        else {
            lines.push(`${key}: ${val}`);
        }
    }
    lines.push("---");
    return lines.join("\n");
}
export function buildMemoryContent(fm, body) {
    return formatFrontmatter(fm) + "\n" + body.trim();
}
//# sourceMappingURL=frontmatter.js.map
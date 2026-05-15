import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import type { Shell } from "./types";
import { ensureMemoryDir, saveMemory, readMemory, memoryDir, getCategoryFromPath } from "./storage";
import { unifiedSearch } from "./search";
import { loadConfig, saveConfig } from "./config";
import { CATEGORIES } from "./paths";
import { getHostname } from "./machine";
import {
  isRepo,
  initRepo,
  hasRemote,
  setRemote,
  commitAll,
  rebasePull,
  push,
  resolveConflict,
  continueRebase,
  cloneRepo,
  getRemoteUrl,
} from "./git";
import { ensureGhAuthenticated, createPrivateRepo, getSuggestedRepoName } from "./repo";
import { getSystemContext } from "./hooks/system";
import { onSessionCreated, onSessionIdle } from "./hooks/capture";
import { onToolExecuted } from "./hooks/guard";
import { appendToDailyNote } from "./tiers/daily";

export const SyncMemoryPlugin: Plugin = async (ctx) => {
  const $ = ctx.$ as unknown as Shell;
  const config = await loadConfig();
  const hostname = getHostname();
  let initialized = false;

  async function ensureInitialized(): Promise<void> {
    if (initialized) return;
    await ensureMemoryDir();

    const repoExists = await isRepo($);
    if (!repoExists) {
      await initRepo($);

      if (config.remote.autoCreate) {
        const authed = await ensureGhAuthenticated($);
        if (authed) {
          const repoName = await getSuggestedRepoName($);
          if (!config.remote.url) {
            try {
              const url = await createPrivateRepo($, repoName);
              config.remote.url = url;
              await saveConfig(config);
              await setRemote($, url);
            } catch {
              // gh repo create failed — user can set remote manually
            }
          }
        }
      }

      if (config.remote.url) {
        try {
          await cloneRepo($, config.remote.url);
        } catch {
          await initRepo($);
        }
      }

      await commitAll($, "initialize memory store");
      if (config.remote.url) {
        await setRemote($, config.remote.url);
        await push($);
      }
    } else if (config.remote.url) {
      const existingRemote = await hasRemote($);
      if (!existingRemote) {
        await setRemote($, config.remote.url);
      }
      const result = await rebasePull($);
      if (result.conflicted.length > 0) {
        for (const file of result.conflicted) {
          await resolveConflict($, file);
        }
        await continueRebase($);
      }
    }

    initialized = true;
  }

  async function sync(): Promise<string> {
    const repoOk = await isRepo($);
    if (!repoOk) return "Memory store not initialized. Save a memory first.";

    const remoteUrl = config.remote.url || (await hasRemote($) ? await getRemoteUrl($) : "");
    if (!remoteUrl) return "No remote configured. Set it in ~/.config/opencode/opencode-sync-memory.jsonc";

    if (!(await hasRemote($))) {
      await setRemote($, remoteUrl);
    }

    const pullResult = await rebasePull($);
    if (pullResult.conflicted.length > 0) {
      for (const file of pullResult.conflicted) {
        await resolveConflict($, file);
      }
      await continueRebase($);
    }

    await push($);
    return "Synced successfully.";
  }

  return {
    tool: {
      memory_save: tool({
        description:
          "Save a fact, decision, preference, or any knowledge to persistent memory. " +
          "The memory is stored locally and synced to your private GitHub repo. " +
          "Use this when you discover something noteworthy about the project, user preferences, architecture decisions, etc.",
        args: {
          title: tool.schema
            .string()
            .describe("Short descriptive title for the memory"),
          content: tool.schema
            .string()
            .describe("The full content of the memory"),
          category: tool.schema
            .string()
            .optional()
            .default("notes")
            .describe(
              "Category: preferences, repos, technical, people, workflows, snippets, or notes",
            ),
          tags: tool.schema
            .string()
            .optional()
            .describe("Comma-separated tags for searchability"),
          importance: tool.schema
            .string()
            .optional()
            .default("medium")
            .describe("Importance: low, medium, or high"),
        },
        async execute(args, _context) {
          await ensureInitialized();
          const path = await saveMemory(
            args.category || "notes",
            args.title,
            args.content,
            {
              tags: args.tags,
              importance: args.importance,
              source: "agent",
              project: _context.worktree
                ? _context.worktree.split("/").pop()
                : undefined,
            },
          );
          await commitAll($, `memory: ${args.title} (from ${hostname})`);

          if (config.remote.url) {
            const pullResult = await rebasePull($);
            if (pullResult.conflicted.length > 0) {
              for (const file of pullResult.conflicted) {
                await resolveConflict($, file);
              }
              await continueRebase($);
            }
            await push($);
          }

          return `Saved memory: "${args.title}" in ${args.category || "notes"}`;
        },
      }),

      memory_search: tool({
        description:
          "Search memories, daily notes, and optionally past opencode sessions. " +
          "Returns ranked results with previews. Use this to find information you've saved previously.",
        args: {
          query: tool.schema
            .string()
            .describe("Search query (keywords to find in memories)"),
          category: tool.schema
            .string()
            .optional()
            .describe("Filter by category"),
          limit: tool.schema
            .number()
            .optional()
            .default(10)
            .describe("Maximum number of results"),
          includeSessions: tool.schema
            .boolean()
            .optional()
            .default(false)
            .describe("Also search past opencode sessions"),
        },
        async execute(args, _context) {
          const results = await unifiedSearch($, args.query, {
            category: args.category,
            limit: args.limit,
            includeSessions: args.includeSessions,
          });
          if (results.length === 0) return "No memories found.";
          let output = `Found ${results.length} results:\n\n`;
          for (const r of results) {
            output += `**${r.title}** (${r.category}) [${r.source}]\n`;
            output += `  ${r.preview.slice(0, 150)}\n`;
            output += `  Path: ${r.path}\n\n`;
          }
          return output;
        },
      }),

      memory_read: tool({
        description:
          "Read the full content of a specific memory by its path. " +
          "Use memory_list or memory_search first to find the path.",
        args: {
          path: tool.schema
            .string()
            .describe("Path to the memory file (e.g., technical/react-setup.md)"),
        },
        async execute(args) {
          const content = await readMemory(args.path);
          if (!content) return `Memory not found: ${args.path}`;
          return `# ${content.fm.title || args.path}\n\n${content.body}`;
        },
      }),

      memory_list: tool({
        description:
          "List memories, optionally filtered by category. Shows title, category, project, and last updated.",
        args: {
          category: tool.schema
            .string()
            .optional()
            .describe("Filter by category"),
          limit: tool.schema
            .number()
            .optional()
            .default(30)
            .describe("Maximum entries to list"),
        },
        async execute(args) {
          const results = await unifiedSearch($, "", {
            category: args.category,
            limit: args.limit,
          });
          if (results.length === 0) return "No memories found.";
          let output = `Memories (${results.length}):\n\n`;
          for (const r of results) {
            output += `- ${r.title} [${r.category}] (${r.updated.slice(0, 10)}) — ${r.path}\n`;
          }
          return output;
        },
      }),

      memory_update: tool({
        description:
          "Update an existing memory's content, title, tags, or importance.",
        args: {
          path: tool.schema
            .string()
            .describe("Path to the memory file to update"),
          title: tool.schema.string().optional().describe("New title"),
          content: tool.schema.string().optional().describe("New content body"),
          tags: tool.schema
            .string()
            .optional()
            .describe("Comma-separated tags"),
          importance: tool.schema
            .string()
            .optional()
            .describe("Importance: low, medium, or high"),
        },
        async execute(args, _context) {
          await ensureInitialized();
          const existing = await readMemory(args.path);
          if (!existing) return `Memory not found: ${args.path}`;

          const category = getCategoryFromPath(args.path);
          const title = args.title || existing.fm.title || "untitled";
          const body = args.content || existing.body;

          await saveMemory(category, title, body, {
            tags: args.tags || existing.fm.tags?.join(", "),
            importance: args.importance || existing.fm.importance,
            project: existing.fm.project,
            source: existing.fm.source,
          });

          await commitAll($, `memory update: ${title} (from ${hostname})`);

          if (config.remote.url) {
            const pullResult = await rebasePull($);
            if (pullResult.conflicted.length > 0) {
              for (const file of pullResult.conflicted) {
                await resolveConflict($, file);
              }
              await continueRebase($);
            }
            await push($);
          }

          return `Updated: ${title}`;
        },
      }),

      memory_forget: tool({
        description:
          "Remove a memory from the active store. It's archived to .archive/ for safety.",
        args: {
          path: tool.schema
            .string()
            .describe("Path to the memory file to remove"),
          reason: tool.schema
            .string()
            .optional()
            .describe("Why this is being removed"),
        },
        async execute(args, _context) {
          await ensureInitialized();
          const { deleteMemory } = await import("./storage");
          await deleteMemory(args.path);

          if (args.reason) {
            await appendToDailyNote(
              $,
              "Memory Removal",
              `Removed ${args.path}: ${args.reason}`,
            );
          }

          await commitAll($, `memory forget: ${args.path} (from ${hostname})`);

          if (config.remote.url) {
            await rebasePull($);
            await push($);
          }

          return `Removed: ${args.path}`;
        },
      }),

      memory_sync: tool({
        description: "Manually sync the memory store with the remote GitHub repo. Pulls latest, pushes local changes.",
        args: {},
        async execute() {
          await ensureInitialized();
          return await sync();
        },
      }),

      memory_status: tool({
        description:
          "Show the current status of the memory store: size, category counts, sync status, and remote info.",
        args: {},
        async execute() {
          const repoOk = await isRepo($);
          const remoteUrl = config.remote.url || (await hasRemote($) ? await getRemoteUrl($).catch(() => "") : "");
          const { buildActiveContext } = await import("./tiers/active");
          const ctx = await buildActiveContext($);

          let out = `## Memory Store Status\n\n`;
          out += `**Location**: ${memoryDir()}\n`;
          out += `**Total entries**: ${ctx.counts.total}\n\n`;
          out += `**By category**:\n`;
          for (const [cat, count] of Object.entries(ctx.counts.byCategory)) {
            out += `  - ${cat}: ${count}\n`;
          }
          out += `\n`;
          out += `**Git repo**: ${repoOk ? "initialized" : "not initialized"}\n`;
          out += `**Remote**: ${remoteUrl || "none configured"}\n`;
          out += `**Machine**: ${hostname}\n`;
          out += `**Config**: ~/.config/opencode/opencode-sync-memory.jsonc\n`;

          return out;
        },
      }),
    },

    event: async ({ event }) => {
      if (event.type === "session.created") {
        const props = event as { type: "session.created"; properties: { info: { id: string } } };
        await onSessionCreated($, props.properties.info.id);
      }
      if (event.type === "session.idle") {
        const props = event as { type: "session.idle"; properties: { sessionID: string } };
        await onSessionIdle($, props.properties.sessionID);
      }
    },

    "experimental.chat.system.transform": async (_input, output) => {
      const context = await getSystemContext($, ctx.worktree?.split("/").pop());
      if (context) {
        output.system.push(context);
      }
    },

    "tool.execute.after": async (input, _output) => {
      const nudge = await onToolExecuted($, input.tool);
      if (nudge) {
        await ctx.client.app.log({
          body: {
            service: "opencode-sync-memory",
            level: "info",
            message: nudge,
          },
        });
      }
    },
  };
};

export default SyncMemoryPlugin;

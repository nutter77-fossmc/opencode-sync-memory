# opencode-sync-memory

Persistent memory for [opencode](https://opencode.ai), synced across machines via a private GitHub repo.

Save facts, decisions, preferences, and project knowledge once — access them from any machine.

## How It Works

```
~/.opencode-memory/         ← git repo (synced to GitHub)
  .git/
  memories/
    preferences/*.md         ← User preferences, coding style
    repos/*.md               ← Per-repo knowledge, architecture
    technical/*.md           ← Language/framework specifics
    people/*.md              ← Team info, responsibilities
    workflows/*.md           ← Build/deploy/CI patterns
    snippets/*.md            ← Reusable code patterns
    notes/YYYY-MM-DD.md      ← Daily session notes (auto-captured)
```

**Three-tier memory:**
- **Active Context**: Top 5 most relevant memories injected into each session's system prompt (compact 1-3 line summaries)
- **Daily Notes**: Auto-created per session, captures what you worked on and decisions made
- **Long-term Knowledge**: Full detail preserved, retrievable on demand via `memory_search`

## Setup

### 1. Install

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-sync-memory"]
}
```

Or install locally:

```bash
mkdir -p ~/.config/opencode/plugins
bun add -g opencode-sync-memory
```

### 2. Authenticate with GitHub

The plugin uses the [GitHub CLI](https://cli.github.com/) for authentication and repo creation:

```bash
gh auth login
```

### 3. Configure remote (optional — the plugin can auto-create)

```jsonc
// ~/.config/opencode/opencode-sync-memory.jsonc
{
  "remote": {
    "url": "git@github.com:yourname/opencode-memory.git",
    "branch": "main",
    "autoCreate": true     // Creates a private repo via gh if url is empty
  }
}
```

If `autoCreate` is true and no URL is configured, the plugin will:
1. Check `gh auth status`
2. Create `gh repo create <user>/opencode-memory --private`
3. Set it as the remote
4. Push all memories on save

## Tools

| Tool | Purpose |
|---|---|
| `memory_save` | Save a fact/decision/knowledge + auto commit + push to GitHub |
| `memory_search` | Search memories + daily notes + past sessions (unified) |
| `memory_read` | Read full content of a specific memory |
| `memory_list` | Browse memories by category |
| `memory_update` | Update a memory's content/title/tags/importance |
| `memory_forget` | Remove a memory (archived to `.archive/`) |
| `memory_sync` | Manually trigger git pull + push |
| `memory_status` | Show store stats, sync health, remote info |

## Cross-Everything

- **Cross-session**: Indexes past opencode sessions — search conversations alongside memories
- **Cross-project**: Memories tagged with project name from git worktree. Search scoped to current project + global by default
- **Cross-machine**: Git sync via private repo. Each edit tracks which machine (`created_by`, `updated_by`)
- **Cross-content**: Single `memory_search` queries memories + daily notes + session history

## Conflict Resolution

When two machines edit the same memory simultaneously, the plugin:
1. Creates fork files: `name.local.<hostname>.<timestamp>.md` and `name.remote.<timestamp>.md`
2. Adds `conflicts_with` cross-reference links in both files' frontmatter
3. Replaces the original with a summary referencing both forks
4. Commits and pushes the resolution

## Configuration

```jsonc
{
  "remote": {
    "url": "git@github.com:user/opencode-memory.git",
    "branch": "main",
    "autoCreate": true
  },
  "injection": {
    "enabled": true,
    "maxMemories": 5,
    "maxLinesPerMemory": 3
  },
  "dailyNotes": {
    "enabled": true,
    "autoCreate": true
  },
  "sessionSearch": {
    "enabled": true,
    "maxResults": 10
  }
}
```

## License

MIT

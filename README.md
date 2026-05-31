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
- **Long-term Knowledge**: Full detail preserved, retrievable on demand via memory search tools

## Quick Start

### 1. Install

```jsonc
// ~/.config/opencode/opencode.json
{
  "plugin": ["opencode-sync-memory"]
}
```

Then run `npm install` in `~/.config/opencode/` or install globally:

```bash
npm install -g opencode-sync-memory
```

### 2. Authenticate with GitHub

```bash
gh auth login
```

### 3. Configure (optional)

```jsonc
// ~/.config/opencode/opencode-sync-memory.jsonc
{
  "remote": {
    "url": "https://github.com/yourname/opencode-memory.git",
    "branch": "main",
    "autoCreate": true
  }
}
```

If `autoCreate` is true and no URL is set, the plugin auto-creates a private repo on first run.

## Tools

| Tool | Purpose |
|---|---|
| `memory_save` | Save a fact/decision + auto commit + push to GitHub |
| `memory_search` | Search memories + daily notes + past sessions |
| `memory_read` | Read full content of a specific memory |
| `memory_list` | Browse memories by category |
| `memory_update` | Update a memory's content/title/tags/importance |
| `memory_forget` | Remove a memory (archived to `.archive/`) |
| `memory_sync` | Manually trigger git pull + push |
| `memory_status` | Show store stats, sync health, remote info |

## Automatic Features

- **Daily notes**: Each session auto-creates a timestamped note
- **Memory injection**: Top 5 most relevant memories loaded into every session's system prompt
- **Git sync**: Every memory save auto-commits and pushes
- **Tool nudges**: Agent reminded to save memories during work
- **URL validation**: Malformed remote URLs auto-fixed on load

## Cross-Everything

- **Cross-session**: Indexes past opencode sessions
- **Cross-project**: Memories tagged with project name from git worktree
- **Cross-machine**: Git sync via private repo. Each edit tracks which machine
- **Cross-content**: Single `memory_search` queries memories + daily notes + session history

## Setup for Multiple Machines

See [opencode-config-repo](https://github.com/nutter77-fossmc/opencode-config-repo)

## License

MIT

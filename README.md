# opencode-sync-memory

A powerful OpenCode plugin that provides persistent memory synced across machines via a private GitHub repo. **Now with automatic memory extraction, encryption, and smart consolidation!**

## Features

### Core Features
- **Automatic Memory Extraction** - Extracts key facts, decisions, and preferences from conversations
- **Cross-Machine Sync** - GitHub-based synchronization for multi-device workflows
- **Structured Memory Types** - Preferences, decisions, facts, errors, and people
- **Smart Search** - Index-based search with relevance scoring

### New in v0.3.0
- **Full Encryption** - AES-256-GCM encryption for all memories
- **Memory Consolidation** - Automatic deduplication and stale memory archiving
- **New Tools** - `memory_diff`, `memory_export`, `memory_import`, `memory_consolidate`, `memory_encrypt`
- **Auto-Extraction** - Hooks into OpenCode events to extract memories in real-time
- **Index-Based Search** - Fast JSON index for instant memory lookup

## Installation

```bash
npm install opencode-sync-memory
```

## Quick Start

1. **Enable the plugin** in your OpenCode config:

```json
{
  "plugins": ["opencode-sync-memory"]
}
```

2. **Initialize memory store** (first time):

```
/memory_save title="My first memory" content="This plugin is awesome!"
```

3. **Sync across machines**:

```
/memory_sync
```

## Usage

### Manual Memory Operations

```
# Save a memory
/memory_save title="React Preference" content="I prefer React over Vue for frontend projects" category="preferences" tags="react,frontend" importance="high"

# Search memories
/memory_search query="react"

# Read a specific memory
/memory_read path="preferences/react-preference.md"

# List all memories
/memory_list category="technical"

# Update a memory
/memory_update path="preferences/react-preference.md" content="Updated preference" importance="low"

# Remove a memory (archived)
/memory_forget path="preferences/react-preference.md" reason="No longer relevant"

# View status
/memory_status
```

### New Tools (v0.3.0)

```
# View memory history
/memory_diff path="technical/architecture.md"

# Export a category
/memory_export category="technical" format="json"

# Import memories
/memory_import data="[{"title":"Imported Memory","content":"..."}]" format="json"

# Consolidate duplicates and archive stale entries
/memory_consolidate

# Enable encryption
/memory_encrypt key="your-secret-key"
```

### Automatic Memory Extraction

The plugin automatically extracts memories from:

1. **Assistant messages** - Preferences, decisions, and facts are extracted in real-time
2. **Compaction summaries** - Architecture decisions and key facts are captured for free
3. **Tool executions** - Working patterns and solutions are saved

### Memory Types

- **preferences** - Coding style, tools, defaults
- **technical** - Architecture decisions, project facts
- **errors** - Error patterns and solutions
- **people** - Team info, responsibilities
- **notes** - Daily notes and session logs

### Encryption

Enable encryption to protect sensitive memories:

```bash
# Generate a key
/memory_encrypt

# Or use your own key
/memory_encrypt key="my-secret-key-123"
```

Set the key on other machines:

```bash
export OPENCODE_MEMORY_ENCRYPTION_KEY="your-key-here"
```

### Consolidation

Run consolidation to merge duplicates and archive stale entries:

```
/memory_consolidate
```

This will:
- Find and merge duplicate memories
- Archive memories older than 30 days
- Clean up the memory store

## Configuration

### Global Config

Location: `~/.config/opencode/opencode-sync-memory.jsonc`

```jsonc
{
  // GitHub sync settings
  "remote": {
    "url": "git@github.com:user/opencode-memory.git",
    "branch": "main",
    "autoCreate": true
  },
  
  // Memory categories
  "categories": ["preferences", "repos", "technical", "people", "workflows", "snippets", "notes"],
  
  // System prompt injection
  "injection": {
    "enabled": true,
    "maxMemories": 5,
    "maxLinesPerMemory": 3
  },
  
  // Daily notes
  "dailyNotes": {
    "enabled": true,
    "autoCreate": true
  },
  
  // Session search
  "sessionSearch": {
    "enabled": true,
    "maxResults": 10
  }
}
```

### Per-Project Config

Create `.opencode-memory.json` in your project root:

```json
{
  "categories": ["project-specific", "team-notes"],
  "injection": {
    "maxMemories": 10
  }
}
```

### Environment Variables

```bash
# Encryption key (optional)
OPENCODE_MEMORY_ENCRYPTION_KEY="your-key-here"
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  OpenCode Chat  │────▶│  Memory Extractor  │────▶│  Local Index    │
│   (hooks)       │     │  (regex + compaction)│    │   (JSON)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        │
                              ┌───────────────────────┘
                              ▼
                        ┌──────────────────┐
                        │  YAML Files      │
                        │  (git-tracked)   │
                        │  memories/*.md   │
                        └──────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │  GitHub Repo     │
                        │  (cross-machine) │
                        └──────────────────┘
```

## File Structure

```
~/.opencode-memory/
  .git/                          # GitHub sync (encrypted files)
  memories/
    preferences/                   # User preferences
    technical/                     # Architecture decisions
    errors/                        # Error patterns & fixes
    people/                        # Team info
    notes/                         # Daily notes (auto-generated)
  .archive/                        # Archived memories
  .index.json                     # Search index (local only)
```

## Development

```bash
# Clone the repo
git clone https://github.com/nutter77-fossmc/opencode-sync-memory.git
cd opencode-sync-memory

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm test` to ensure everything works
6. Submit a pull request

## License

MIT

## Support

- [GitHub Issues](https://github.com/nutter77-fossmc/opencode-sync-memory/issues)
- [Documentation](https://github.com/nutter77-fossmc/opencode-sync-memory/blob/main/README.md)

## Changelog

### v0.3.0 (2026-06-17)
- **BREAKING**: Fixed git template literal chains (requires Node.js 18+)
- Added automatic memory extraction from conversations
- Added AES-256-GCM encryption for all memories
- Added memory consolidation (deduplication + stale archiving)
- Added new tools: `memory_diff`, `memory_export`, `memory_import`, `memory_consolidate`, `memory_encrypt`
- Added index-based search for faster queries
- Added per-project configuration support
- Added GitHub Actions CI/CD
- Added comprehensive test suite

### v0.2.0
- Initial release with basic memory tools
- GitHub sync support
- Daily notes auto-capture

### v0.1.0
- Early prototype

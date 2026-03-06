## Beads + BV Quickstart

This project uses Beads (`br`) for issue management and BV (`bv`) for graph-aware triage/planning.

### What each tool is for

- `br`: create/update/close issues, labels, dependencies, sync
- `bv`: decide what to work on next (`--robot-*` analysis)

### Hard rules

- Never parse `.beads/*.jsonl` directly.
- Never run bare `bv` (it starts interactive TUI). Always use `--robot-*`.
- Use numeric priorities `0-4` (P0 highest).

### Minimal workflow

1. Triage: `bv --robot-triage --format toon`
2. Confirm actionable work: `br ready`
3. Claim/start: `br update <id> --status in_progress`
4. Implement and validate
5. Close: `br close <id> --reason "Completed"`
6. Flush: `br sync --flush-only`

### Most useful commands

```bash
# Find work
bv --robot-triage --format toon
bv --robot-next
br ready

# Inspect issues
br list --status open
br show <id>

# Manage issues
br create --title "..." --description "..." --type task --priority 2 --labels "hugo,config"
br update <id> --status in_progress
br close <id> --reason "Completed"

# Dependencies and labels
br dep add <issue> <depends-on>
br label add <id> "tag1,tag2"

# Sync state
br sync --flush-only
```

### Recommended patterns

- Start every session with `bv --robot-triage --format toon`.
- Use one epic + child tasks for multi-phase work.
- Put exact file paths and acceptance criteria in issue descriptions.
- End every working session with `br sync --flush-only`.

### Optional deeper analysis

```bash
bv --robot-plan --format toon
bv --robot-triage --robot-triage-by-label --format toon
bv --robot-alerts --format toon
```

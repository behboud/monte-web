## Runtime

This Astro app uses the Node standalone adapter and a persistent SQLite database plus uploads directory. Do not treat it as a static GitHub Pages site. Self-hosted font URLs in CSS under `/css/` must stay relative, such as `../fonts/...`, so they resolve under a deployment prefix; `tests/ui/public-links.spec.ts` protects this contract.

<!-- envit:begin -->
## envit: repo context

Additional context is available in `.envit/`. The source of each external
repository declared in `envit.json` is at `.envit/repos/<name>/`, read-only,
at a pinned commit. Read `.envit/AGENTS.md` for the inventory.

When you work with a dependency, read its actual code there instead of
guessing from memory. The entries are symlinks: use `rg --follow` or
`fd -L` when you search them.
<!-- envit:end -->

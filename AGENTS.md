## Deployment lesson

GitHub Pages serves the site below `/monte-web/`. CSS assets emitted under `/css/` must use relative URLs such as `../fonts/...` for self-hosted fonts so they resolve under the deployment prefix. The production CSS asset regression in `tests/ui/public-links.spec.ts` protects this contract.

<!-- envit:begin -->
## envit: repo context

Additional context is available in `.envit/`. The source of each external
repository declared in `envit.json` is at `.envit/repos/<name>/`, read-only,
at a pinned commit. Read `.envit/AGENTS.md` for the inventory.

When you work with a dependency, read its actual code there instead of
guessing from memory. The entries are symlinks: use `rg --follow` or
`fd -L` when you search them.
<!-- envit:end -->

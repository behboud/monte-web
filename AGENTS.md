## Deployment lesson

GitHub Pages serves the site below `/monte-web/`. CSS assets emitted under `/css/` must use relative URLs such as `../fonts/...` for self-hosted fonts so they resolve under the deployment prefix. The production CSS asset regression in `tests/ui/public-links.spec.ts` protects this contract.

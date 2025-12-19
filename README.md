# MeTTa Chess Tutorial (Frontend)

This repo hosts a Next.js frontend for a MeTTa-based chess/pattern-mining tutorial. The app proxies API calls through Next.js rewrites (see `frontend/next.config.mjs`) to your backend (e.g., Prolog/MeTTa service). Key pieces:

- `frontend/components/code-editor.tsx`: Sends code to `/metta_stateless`, normalizes `println!` to `println`, and stores the second bracketed result as a shared `Atomspace_state` (global + localStorage).
- `frontend/components/display-atomspace-button.tsx`: Shows the current `Atomspace_state`, split by `splitParenthesizedArray`.
- `frontend/components/reset-button.tsx`: “Reset to Default Program” currently shows an alert only (no API call).
- `frontend/components/site-header.tsx`: Header actions (Play Chess, Reset to Default Program, Display Atomspace, Reset Atomspace).
- Tutorials live under `frontend/tutorials/*.tex` and are rendered via `frontend/app/tutorials/[slug]/page.tsx`.

Development:
1) `cd frontend`
2) `pnpm install`
3) `pnpm dev` (front end) — ensure your backend is reachable at the rewrite destination.

Notes:
- API base is `/api` (set in `frontend/lib/constants.ts`), with rewrites defined in `frontend/next.config.mjs`.
- Reset Atomspace button clears the shared `Atomspace_state` and alerts “Atomspace successfully reset.”

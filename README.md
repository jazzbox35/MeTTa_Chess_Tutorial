# MeTTa Chess Tutorial (Frontend)

This repo hosts a Next.js frontend for a MeTTa-based chess tutorial. The app proxies API calls through Next.js rewrites (see `frontend/next.config.mjs`) to the MeTTaWamJam Prolog MeTTa server PeTTa.

Start Server:
1) `cd frontend`
2) `pnpm install`
3) `pnpm dev` (front end) — ensure your backend is reachable at the rewrite destination.

Notes:
- API base is `/api` (set in `frontend/lib/constants.ts`), with rewrites defined in `frontend/next.config.mjs`.
- Reset Atomspace button clears the shared `Atomspace_state` and alerts “Atomspace successfully reset.” The browser retains Atomspace state using the MettaWamJam server’s stateless mode.

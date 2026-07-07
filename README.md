# h2r — Hire-To-Retire domain

Minimal TypeScript project used to exercise the SDLC harness.

- `npm run test` — vitest (picks up `src/**/*.{test,spec}.ts`)
- `npm run typecheck` — `tsc --noEmit`

Domain logic lives under `src/hr/`. Tasks add modules there (e.g.
`src/hr/lifecycle.ts`) with matching `*.test.ts` files.

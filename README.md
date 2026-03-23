# StudyCorner

StudyCorner is a real-time chat platform for subject-based school discussions. The MVP focuses on room creation, room discovery, and live messaging.

## Live deployment

- Web app (Vercel): https://module245.vercel.app
- Backend: Convex Cloud deployment referenced by `NEXT_PUBLIC_CONVEX_URL`.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Convex (database + real-time functions)
- Convex Auth (password provider)

## Prerequisites

- Node.js 20+
- pnpm 9+
- Convex CLI (`npm install -g convex`) for local workflows.

## Local development

1. Copy `.env.example` to `.env.local` and fill in secrets (see Environment variables below).
2. Install dependencies:
   ```
   pnpm install
   ```
3. Start both Next.js and Convex dev servers:
   ```
   pnpm dev
   ```
   This runs `next dev` and `convex dev` in parallel so the client and backend stay in sync.

You can also run `pnpm dev:frontend` and `pnpm dev:backend` separately if you want to focus on one side.

### Convex dev workflow

- The `predev` script runs `convex dev --until-success` and `node setup.mjs --once` to provision schema/auth locally.
- To inspect Convex logs or run quick tests, open another terminal and execute `convex dev`.
- When targeting the cloud backend, run `npx convex deploy` and point `NEXT_PUBLIC_CONVEX_URL` at the deployed instance.

### Build & production start

```
pnpm build
pnpm start
```

`pnpm build` must complete without errors locally before deploying to Vercel; `pnpm start` serves the production build on port 3000.

## Environment variables

Copy [.env.example](.env.example) to `.env.local` and fill in values. Real secrets never land in git; `.env*` files stay local while Vercel + Convex hold the production copies.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL used by the client |
| `CONVEX_SITE_URL` | Public URL used by Convex Auth (e.g. http://localhost:3000) |
| `CONVEX_DEPLOY_KEY` | Convex deploy key for preview/production |
| `JWT_PRIVATE_KEY` | Private key for Convex Auth JWT signing |
| `JWKS` | Public JWKS JSON for Convex Auth |

Generate keys with `node generateKeys.mjs` or the `npx @convex-dev/auth` helper.

## Security & secrets

- Secrets only live in `.env.local` (git-ignored) or in managed platform stores (Vercel/Convex environment variables).
- `.env.example` documents every required variable without shipping real values.
- Convex deploy keys and auth keys are rotated by re-running `node generateKeys.mjs` and updating the hosting platforms.
- Server-side mutations (`convex/rooms.ts`, `convex/messages.ts`, `convex/memberships.ts`) all import `requireUser` so passwords/tokens are never sent to client logic.

## Authentication & authorization

We use Convex Auth with the Password provider (see [docs/auth.md](docs/auth.md)). All mutations call `requireUser` to ensure the caller is authenticated, and message-related mutations additionally verify room membership (see `getMembership` helper). Admin-only capabilities (e.g., deleting any message) rely on the `admins` table and `isAdminUser` helper, giving us both authentication and authorization layers documented here.

## Data model & server logic

- Rooms: name, subject, createdBy, createdAt
- Messages: roomId, userId, content, timestamp
- Memberships: roomId, userId, joinedAt (enforced unique per room/user via `by_roomId_userId` index)

See [convex/schema.ts](convex/schema.ts). Rooms are public in the MVP, realtime updates come from Convex queries, and join logic is idempotent because `joinRoom` returns the existing membership instead of inserting duplicates. All business logic (create/join/send) resides in Convex mutations/queries instead of the UI.

## Deployment checklist

1. Run `pnpm build` locally to ensure the production bundle compiles.
2. Configure environment variables in Vercel (Next.js) and Convex Cloud so secrets never live in git.
3. Deploy the Convex backend (`npx convex deploy`) and copy its URL into `NEXT_PUBLIC_CONVEX_URL`.
4. Set `CONVEX_SITE_URL` to the deployed web URL (https://module245.vercel.app) so Convex Auth callbacks succeed.
5. Add/update `CONVEX_DEPLOY_KEY`, `JWT_PRIVATE_KEY`, and `JWKS` in Convex Cloud.
6. Trigger a Vercel deployment; the resulting artifact powers https://module245.vercel.app without runtime errors.
7. Run the happy-path smoke tests below (locally and remotely) after each deploy.

## Happy-path tests

1. User registers and signs in.
2. User creates a public room (subject/topic).
3. The new room appears in the room list immediately.
4. User joins the room (membership badge should toggle to "Joined").
5. User sends a message from one browser tab.
6. Message appears in real time (under 2 seconds) in a second browser session.
7. No crashes or critical console errors occur locally or on https://module245.vercel.app.

## PoC learnings

- **Realtime messaging:** Verified Convex live queries keep two browser sessions in sync with <2s latency, satisfying the chat performance hypothesis.
- **Auth flow robustness:** Tested sign-up/sign-in/password validation via Convex Auth to confirm sessions persist across refreshes (documented in [docs/auth.md](docs/auth.md)).
- **Next steps:** Evaluate private/role-based rooms and push notifications once the MVP grading is complete.

## Agile process evidence (QW6-8)

Sprint notes, linked issues, and supporting commits for each qualifying week are captured in [docs/process.md](docs/process.md). Use the referenced GitHub Project board and PR links to demonstrate continuous delivery for the rubric.

## Versioning

Work happens on short-lived `feat/*` branches that reference GitHub issues, then merge via pull requests into `main`, which is always deployable. Tags (e.g., `qw8-handoff`) mark weekly checkpoints, and the Git history commands in [docs/process.md](docs/process.md) show how to reproduce the evidence for evaluators.

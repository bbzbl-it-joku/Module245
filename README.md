# StudyCorner

StudyCorner is a real-time chat platform for subject-based school discussions. The MVP focuses on room creation, room discovery, and live messaging.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Convex (database + real-time functions)
- Convex Auth (password provider)

## Local development

Install dependencies and run the dev servers:

```
pnpm install
pnpm dev
```

## Environment variables

Copy [.env.example](.env.example) to `.env.local` and fill in values.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL used by the client |
| `CONVEX_SITE_URL` | Public URL used by Convex Auth (e.g. http://localhost:3000) |
| `CONVEX_DEPLOY_KEY` | Convex deploy key for preview/production |
| `JWT_PRIVATE_KEY` | Private key for Convex Auth JWT signing |
| `JWKS` | Public JWKS JSON for Convex Auth |

Generate keys with `node generateKeys.mjs` or the `npx @convex-dev/auth` helper.

## Data model

- Rooms: name, subject, createdBy, createdAt
- Messages: roomId, userId, content, timestamp
- Memberships: roomId, userId, joinedAt

See [convex/schema.ts](convex/schema.ts).

## Deployment checklist

- Configure env vars in Vercel and Convex Cloud
- Set `NEXT_PUBLIC_CONVEX_URL` to the deployed Convex URL
- Set `CONVEX_SITE_URL` to the deployed web URL
- Add `CONVEX_DEPLOY_KEY` for production deploys
- Verify Convex Auth keys are configured (`JWT_PRIVATE_KEY`, `JWKS`)
- Run smoke tests (see below)

## Smoke tests

- Register or sign in
- Create a room
- Verify the room appears in the list
- Send a message and confirm real-time update in a second browser window

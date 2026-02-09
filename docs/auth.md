# Auth decision

## Context
StudyCorner needs authentication for room creation and messaging. The MVP prioritizes speed, simple local dev, and server-side enforcement in Convex mutations.

## Decision
Use Convex Auth with the Password provider.

## Rationale
- Tight integration with Convex mutations and session validation.
- Minimal external dependencies for the MVP.
- Works locally without configuring third-party OAuth providers.

## Alternatives considered
- External OAuth providers (Google, Microsoft, etc.) via third-party auth.
- A custom auth service.

## Consequences
- Password management handled by Convex Auth.
- Easier MVP delivery, with the option to add OAuth providers later.

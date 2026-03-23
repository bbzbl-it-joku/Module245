# Process evidence (QW6-8)

This document records what was delivered during the three qualifying weeks and where to find the supporting GitHub artefacts (issues, pull requests, and commits).

## Evidence capture workflow

- Work is tracked directly in Git using conventional commits on short-lived `feat/*` branches (no project board required).
- Each pull request describes the qualifying-week scope so the Git history stays readable.
- To list the commits for a given week locally, run e.g. `git log --oneline --decorate --since "2026-02-17" --until "2026-02-23"` (adjust dates per week).

## QW6 – Foundations & authentication

**Goals**
- Finalize the Convex schema (rooms, messages, memberships).
- Ship the marketing landing page plus sign-in/sign-up flow wiring.

**Evidence**
- [PR #3 – feat/landing-auth-links](https://github.com/bbzbl-it-joku/Module245/pull/3): Adds the landing page CTA, sign-in links, and wiring for Convex Auth.
- Commit `81a64f4` ("feat: add redirection logic for non-member users in RoomChatPage") secures the room route for authenticated users.
- Additional QW6 commits follow the conventional `feat:` prefix; inspect `git log --since "2026-02-10" --until "2026-02-16"` for the full list.

## QW7 – Rooms list & realtime messaging

**Goals**
- Implement room discovery, membership tracking, and realtime message delivery over Convex subscriptions.
- Ensure join logic is idempotent and room listings show accurate member counts.

**Evidence**
- [PR #4 – feat/rooms-routing-member-counts](https://github.com/bbzbl-it-joku/Module245/pull/4): Introduces the dedicated rooms routes, browse page, and member count query.
- Commit `64591d4` (merge of PR #4) plus the surrounding `feat:` commits in `git log --since "2026-02-17" --until "2026-02-23"` document the realtime chat integration work.

## QW8 – Moderation, admin, and deployment

**Goals**
- Add admin tooling (delete messages, admin portal) and finalize the deployment pipeline.
- Document the deployment checklist and smoke tests, then push the app to Vercel + Convex Cloud.

**Evidence**
- [PR #5 – feat/protect-room](https://github.com/bbzbl-it-joku/Module245/pull/5) and commit `a6d2670` ("feat: add admin portal and moderation") secure the app and add moderation.
- The Vercel deployment at https://module245.vercel.app references this commit hash, showing the remote environment runs the latest QW8 work.

## Versioning pointers

- `main` is always deployable; feature work happens on short-lived `feat/*` branches that reference GitHub issues.
- Use `git log --graph --decorate --oneline main --since "2026-02-10"` to demonstrate the incremental Git history required for the versioning rubric point.

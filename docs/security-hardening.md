# Security hardening

## Deployment

Apply migrations before starting the patched API:

```sh
pnpm exec prisma migrate deploy --schema packages/database/prisma/schema.prisma
pnpm exec prisma generate --schema packages/database/prisma/schema.prisma
```

Deploy the patched API instances together. Do not leave an old instance issuing
legacy LiveKit tokens alongside patched instances. The voice-room cleanup worker
removes legacy and obsolete rooms after startup; existing calls must rejoin.

Set `LIVEKIT_API_URL` to the server-side HTTP endpoint reachable by the API
(Docker uses `http://livekit:7880`). `LIVEKIT_URL` remains the browser-facing
WebSocket endpoint. The signed webhook URL must reach `/api/voice/webhook`.
Without a working webhook, new voice connections receive no media privileges.

## Voice revocation

LiveKit rooms are named `channel:<channelId>:<generation>`. The generation is
stored in PostgreSQL. Every issued room token records a lease for its HTTP
session, including disconnected participants who may still hold cached tokens.

Tokens initially have no publish, subscribe, data, or metadata-update privileges.
The signed join webhook checks the session, current membership, room generation,
and lease before granting media permissions. The browser waits for that grant.

Logout, password reset, and leaving a server advance affected room generations
and delete the previous SFU rooms. **Everyone in an affected room is disconnected
and must rejoin.** This deliberate interruption prevents cached privileged tokens
(including tokens refreshed by a self-hosted SFU) from hearing future calls. A
cached token can at most recreate an obsolete room with no newly authorized
participants. Removing only one participant or shortening JWT expiry would not
provide that property on self-hosted LiveKit.

Ordinary HTTP refresh transfers leases and participant metadata to the new
session without rotating the room. A cleanup worker runs every 10 seconds and
removes obsolete rooms and connections whose authorization changed externally.
If the SFU control API is unavailable, revocation reports failure, while the DB
generation change remains committed; the worker retries room cleanup. Monitor
`Voice authorization reconciliation failed` and restore control API connectivity.

## Account recovery and attachments

Login and refresh acquire the same PostgreSQL user-row lock used by password
reset. A conditional update matches the password hash that was verified before
creating the session. This prevents delayed old credentials from surviving reset.

Deleted messages cannot mint fresh attachment URLs, including via nonce retries.
Already issued object-store URLs retain their short expiry (normally 5 minutes).
Objects are retained according to the existing storage policy.

Browser Google Analytics is disabled, including when `NEXT_PUBLIC_GA_ID` is set.
Third-party scripts can survive client navigation and observe sensitive URLs;
future telemetry should use aggregate server-side public-page measurements.

## Regression checks

```sh
node --test scripts/test-auth-security.mjs scripts/test-attachment-security.mjs scripts/test-voice-security.mjs
pnpm test:realtime
pnpm test:redis
pnpm --filter @discord-clone/web test
pnpm type-check
pnpm lint
```

The route/security suites isolate database and SFU adapters. The Redis suite
uses real Redis, real WebSockets, and signed SDK webhooks, while isolating SFU
control calls. Use the PostgreSQL integration suite for real transaction locking.

For PostgreSQL integration, create an isolated local database named
`bravechat_security_*`, apply the migrations with its `DATABASE_URL`, then set
`TEST_DATABASE_URL` to that same URL and run `pnpm test:security:postgres`.
The test refuses remote hosts and databases without that name prefix, and
cleans up its own users, sessions, servers, and room leases.

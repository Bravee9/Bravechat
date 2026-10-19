# Media setup

## Local Docker

Copy `.env.example` to `.env`, fill in the existing R2 values, then start the stack:

```sh
docker compose up --build -d
```

The local LiveKit configuration uses development-only credentials (`devkey` / `devsecret`). Keep the API key and secret aligned between `.env` and `livekit.yaml`; never use these values outside local development. The API container runs Prisma `db push` before startup so a fresh local PostgreSQL volume receives the current schema.

Register at `/register`, sign in, then use the server-rail `+` button to create a test server. It creates `#general`, `voice`, and `video` channels. The same account can join from another browser tab for a local room smoke test.

Set the R2 bucket to private. Configure its CORS policy to allow the exact web origin (for example `http://localhost`) and `PUT` with the `Content-Type` request header. Presigned upload URLs expire after ten minutes; authenticated download redirects expire after five minutes. Attachments are served only after channel membership is checked by the API.

Uploads start under `pending/` and are moved to `attachments/` when a message is committed. Configure an R2 lifecycle rule to expire only the `pending/` prefix after one day to clean up interrupted uploads; never expire the `attachments/` prefix.

## Production voice/video

Use a public DNS name and trusted TLS for the LiveKit WebSocket URL, replace the development key/secret, and configure LiveKit's webhook URL to the API's `/api/voice/webhook` endpoint with the matching signing API key. Configure TURN/TLS with a public certificate for clients whose networks block direct WebRTC traffic. The sample compose config is for local development and is not a production topology.

The included LiveKit config uses UDP mux port `7882` plus TURN/UDP `3478`; expose those UDP ports and TCP `7880` (normally behind TLS termination). LiveKit's standard deployment guidance uses UDP media ports `50000–60000`, TCP `7881`, and recommends a public hostname/TLS for production. Set matching config and firewall rules for whichever transport mode is deployed. Validate with clients on separate networks; Docker Desktop/local LAN tests do not prove public TURN/NAT connectivity.

## API behavior

- `POST /api/uploads/presign` accepts `channelId`, `filename`, `contentType`, and `size`; current default maximum is 50 MiB.
- `POST /api/channels/:channelId/messages` accepts text and up to ten uploaded attachment descriptors (`filename`, `contentType`, `key`). The API checks object ownership, existence, size and MIME type before committing.
- `GET /api/channels/:channelId/messages` returns up to 100 messages and accepts `before` (message ID) and `limit` cursor parameters.
- `POST /api/voice/channels/:channelId/token` issues a short-lived, channel-scoped LiveKit token. `VOICE` channels can publish microphone only; `VIDEO` channels can publish microphone and camera.
- LiveKit webhooks are signature-verified and update Redis participant presence used for configured channel user limits.

The browser needs microphone/camera permission and a secure context (HTTPS, or localhost). R2 credentials and LiveKit API secrets are server-only; expose only `LIVEKIT_URL` to clients through the token response.

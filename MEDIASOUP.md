# VAL mediasoup service

VAL keeps Next.js and its media service separate. The media service is a long-running Node process; it cannot run in a Vercel/serverless function because it needs persistent Socket.IO connections and a UDP/TCP WebRTC port range.

## Local development

Set `MEDIA_AUTH_SECRET` (at least 32 characters) in `.env.local`, copy the media variables from `.env.example`, then run these in separate terminals:

```powershell
npm run dev
npm run media:dev
```

`/mediasoup-test?channelId=<authorized-voice-channel-id>` is development-only and verifies the authenticated microphone producer path.

## Authentication and authorization

The Next.js credential endpoints perform authorization using the existing VAL database rules before issuing a five-minute HMAC credential:

- Space voice credentials require membership in the channel's Space.
- Friend-call credentials require that the caller or receiver owns the current call and preserve existing call-status validation.

The browser only sends that credential to Socket.IO. The media server verifies its signature and expiry, derives `userId` and `roomId` from it, and rejects a different requested room. Neither identity nor room authorization is trusted from browser payloads.

## Architecture

`media-server/` contains the worker manager, room manager, peer lifecycle helper, credential verifier, and Socket.IO handlers. A room has one router and owns peers; a peer owns send/receive transports, producers, and consumers. Empty rooms close their router. A worker death is logged and exits non-zero so a process manager can restart it.

The browser-side `MediaClient` owns the mediasoup Device, both transports, independent mic/camera/screen producers, consumers, remote tracks, and cleanup. The persistent VAL call UI consumes only its high-level state.

## Signaling

The service supports `join-room`, `leave-room`, `create-transport`, `connect-transport`, `produce`, `close-producer`, `consume`, and `resume-consumer`, plus `new-producer`, `producer-closed`, `consumer-closed`, `peer-joined`, and `peer-left` notifications.

## Deployment networking

Set `MEDIASOUP_LISTEN_IP` to the bind interface and `MEDIASOUP_ANNOUNCED_ADDRESS` to the public IP/DNS address. Allow `MEDIA_SERVER_PORT` for Socket.IO and the inclusive `MEDIASOUP_MIN_PORT`–`MEDIASOUP_MAX_PORT` range for both UDP and TCP through the firewall/security group. TLS is required for browser microphone/camera access outside localhost; terminate TLS in front of the media service or deploy it directly with TLS-aware infrastructure.

## Limitations and validation

The migration currently has source-level lint/type validation and service syntax validation. Two independent authenticated browser sessions are still required to validate real remote audio, camera, screen-share, device switching, and reconnect behavior. Mediasoup does not provide application-level E2EE automatically; VAL's existing device-key subsystem has not been weakened or redefined by this service.

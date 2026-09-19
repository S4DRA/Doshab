import http from "node:http";
import { Server } from "socket.io";
import { authenticateSocket } from "./auth/authenticateSocket.mjs";
import { config, mediaCodecs } from "./config/config.mjs";
import { RoomManager } from "./mediasoup/roomManager.mjs";
import { WorkerManager } from "./mediasoup/workerManager.mjs";
import { registerSocketHandlers } from "./signaling/socketHandlers.mjs";

if (!config.authSecret || config.authSecret.length < 32) throw new Error("MEDIA_AUTH_SECRET must be set to at least 32 characters.");
const workers = new WorkerManager({ rtcMinPort: config.rtcMinPort, rtcMaxPort: config.rtcMaxPort, onDied: () => { process.exitCode = 1; } });
const rooms = new RoomManager({ workerManager: workers, mediaCodecs });
const server = http.createServer(); const io = new Server(server, { cors: { origin: config.allowedOrigin, methods: ["GET", "POST"] } });
io.use((socket, next) => authenticateSocket(socket, next, config.authSecret));
io.on("connection", (socket) => registerSocketHandlers(io, socket, rooms, { listenInfos: [{ protocol: "udp", ip: config.listenIp, announcedAddress: config.announcedAddress }, { protocol: "tcp", ip: config.listenIp, announcedAddress: config.announcedAddress }] }));
await workers.getWorker(); server.listen(config.port, () => console.log(`VAL media server listening on ${config.port}`));

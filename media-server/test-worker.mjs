import * as mediasoup from "mediasoup";

console.log("mediasoup version:", mediasoup.version);

const worker = await mediasoup.createWorker();

console.log("mediasoup worker started");
console.log("worker PID:", worker.pid);

worker.on("died", () => {
  console.error("mediasoup worker died");
  process.exit(1);
});

setTimeout(async () => {
  console.log("test successful");
  await worker.close();
  process.exit(0);
}, 2000);
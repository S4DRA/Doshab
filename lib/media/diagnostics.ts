/** Local point sample. Omit candidates, IPs, device, track and peer identifiers. */
export function summarizeMediaStats(reports: RTCStatsReport[]) {
  let packetsReceived = 0, packetsLost = 0, jitterMs = 0, roundTripMs = 0, bytesSent = 0, bytesReceived = 0;
  let hasJitter = false, hasRoundTrip = false;
  for (const report of reports) report.forEach((entry) => {
    if (entry.type === "inbound-rtp" && (entry.kind === "audio" || entry.mediaType === "audio")) {
      packetsReceived += entry.packetsReceived ?? 0; packetsLost += Math.max(0, entry.packetsLost ?? 0);
      if (Number.isFinite(entry.jitter)) { jitterMs = Math.max(jitterMs, entry.jitter * 1000); hasJitter = true; }
    }
    if (entry.type === "candidate-pair" && entry.state === "succeeded" && entry.nominated) {
      if (Number.isFinite(entry.currentRoundTripTime)) { roundTripMs = Math.max(roundTripMs, entry.currentRoundTripTime * 1000); hasRoundTrip = true; }
      bytesSent += entry.bytesSent ?? 0; bytesReceived += entry.bytesReceived ?? 0;
    }
  });
  const total = packetsReceived + packetsLost;
  return { peers: reports.length, packetsReceived, packetsLost, packetLossPercent: total ? Math.round(packetsLost / total * 10000) / 100 : null,
    jitterMs: hasJitter ? Math.round(jitterMs) : null, roundTripMs: hasRoundTrip ? Math.round(roundTripMs) : null, bytesSent, bytesReceived };
}

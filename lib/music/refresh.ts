// Event-driven request coalescing: at most one active request and one queued refresh.
// No interval or spinning timer is needed while a request is running.
export function coalesceMusicRefresh(task: () => Promise<void>) {
  let running = false;
  let pending = false;
  let disposed = false;
  const run = async (): Promise<void> => {
    if (disposed) return;
    if (running) { pending = true; return; }
    running = true;
    try { await task(); }
    finally {
      running = false;
      if (pending && !disposed) { pending = false; await run(); }
    }
  };
  return { run, dispose: () => { disposed = true; pending = false; } };
}

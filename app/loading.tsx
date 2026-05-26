export default function Loading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#050705] text-white">
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-[#111111] px-4 py-3 text-sm font-semibold">
        <span className="size-2 rounded-full bg-[#FF5F25]" />
        Loading
      </div>
    </div>
  );
}

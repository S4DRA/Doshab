import { SubmitButton } from "@/components/ui/submit-button";

type MessageInputProps = {
  channelId: string;
  channelName: string;
};

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  return (
    <form action={`/api/channels/${channelId}/messages`} className="flex items-end gap-2 sm:gap-3" method="post">
      <textarea
        className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-[#050505] px-3 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:min-h-11 sm:text-sm"
        maxLength={2000}
        name="content"
        placeholder={`Message #${channelName}`}
        required
        rows={1}
      />
      <SubmitButton
        className="h-12 min-w-16 rounded-xl bg-[#FF5F25] px-4 text-sm font-bold text-black transition hover:bg-[#ff7847] sm:h-11"
        pendingText="Sending..."
      >
        Send
      </SubmitButton>
    </form>
  );
}

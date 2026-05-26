import { SubmitButton } from "@/components/ui/submit-button";

type MessageInputProps = {
  channelId: string;
  channelName: string;
};

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  return (
    <form action={`/api/channels/${channelId}/messages`} className="flex gap-3" method="post">
      <textarea
        className="min-h-11 flex-1 resize-none rounded-md border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20"
        maxLength={2000}
        name="content"
        placeholder={`Message #${channelName}`}
        required
        rows={1}
      />
      <SubmitButton
        className="h-11 rounded-md bg-[#FF5F25] px-4 text-sm font-semibold text-white shadow-lg shadow-[#FF5F25]/30 transition hover:bg-[#FF5F25]/90"
        pendingText="Sending..."
      >
        Send
      </SubmitButton>
    </form>
  );
}

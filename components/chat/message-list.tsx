import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatReadableTimestamp } from "@/lib/utils";
import type { ChatMessage } from "@/types";

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/12 bg-white/[0.03] p-6 text-center">
        <p className="text-sm font-semibold text-white">No messages yet</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Start the conversation with the first message.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {messages.map((message) => (
        <article className="flex gap-3" key={message.id}>
          <AvatarInitials
            imageUrl={message.sender.image}
            value={message.sender.name || message.sender.email}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-sm font-semibold text-white">
                {message.sender.name || message.sender.email}
              </p>
              <time className="text-xs text-slate-500">
                {formatReadableTimestamp(message.createdAt)}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
              {message.content}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatReadableTimestamp } from "@/lib/utils";
import type { ChatMessage } from "@/types";

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  if (!messages.length) {
    return (
      <div className="app-card border-dashed p-5 text-center sm:p-6">
        <p className="text-sm font-semibold text-white">No messages yet</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Start the conversation with the first message.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map((message) => (
        <article className="flex gap-2.5 border border-transparent px-1.5 py-2.5 sm:gap-3 sm:px-2" key={message.id}>
          <AvatarInitials
            imageUrl={message.sender.image}
            value={message.sender.name || message.sender.email}
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="min-w-0 max-w-full truncate text-sm font-semibold text-white">
                {message.sender.name || message.sender.email}
              </p>
              <time className="text-[11px] text-slate-500 sm:text-xs">
                {formatReadableTimestamp(message.createdAt)}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300 [overflow-wrap:anywhere]">
              {message.content}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

import type { Prisma } from "@/lib/generated/prisma/client";
import { reactionEmojis } from "@/lib/chat-constants";
import { prisma } from "@/lib/prisma";
import type { ChatMessage, ChatMessageReaction } from "@/types";

export const chatMessageBaseSelect = {
  id: true,
  content: true,
  createdAt: true,
  pinnedAt: true,
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: {
        select: {
          email: true,
          id: true,
          image: true,
          name: true,
          status: true,
        },
      },
    },
  },
  sender: {
    select: {
      email: true,
      id: true,
      image: true,
      name: true,
      status: true,
    },
  },
} satisfies Prisma.MessageSelect;

export type RawChatMessage = Prisma.MessageGetPayload<{
  select: typeof chatMessageBaseSelect;
}>;

type ReactionCount = {
  _count: {
    _all: number;
  };
  emoji: string;
  messageId: string;
};

type PollWithOptions = {
  id: string;
  messageId: string;
  options: Array<{
    _count: {
      votes: number;
    };
    id: string;
    text: string;
  }>;
  question: string;
};

type UserPollVote = {
  optionId: string;
  pollId: string;
};

type MessageMetadata = {
  pollsByMessageId: Map<string, PollWithOptions>;
  reactionCountsByMessageId: Map<string, ReactionCount[]>;
  userPollVotesByPollId: Map<string, UserPollVote>;
  userReactionsByMessageId: Map<string, Set<string>>;
};

export async function formatChatMessage(
  message: RawChatMessage,
  userId: string,
): Promise<ChatMessage> {
  const metadata = await loadMessageMetadata([message.id], userId);

  return formatChatMessageWithMetadata(message, metadata);
}

export async function formatChatMessages(messages: RawChatMessage[], userId: string) {
  const metadata = await loadMessageMetadata(
    messages.map((message) => message.id),
    userId,
  );

  return messages.map((message) => formatChatMessageWithMetadata(message, metadata));
}

async function loadMessageMetadata(
  messageIds: string[],
  userId: string,
): Promise<MessageMetadata> {
  const uniqueMessageIds = [...new Set(messageIds)];

  if (!uniqueMessageIds.length) {
    return emptyMetadata();
  }

  const [reactionCounts, userReactions, polls] = await Promise.all([
    prisma.messageReaction.groupBy({
      by: ["messageId", "emoji"],
      where: {
        emoji: {
          in: [...reactionEmojis],
        },
        messageId: {
          in: uniqueMessageIds,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.messageReaction.findMany({
      where: {
        emoji: {
          in: [...reactionEmojis],
        },
        messageId: {
          in: uniqueMessageIds,
        },
        userId,
      },
      select: {
        emoji: true,
        messageId: true,
      },
    }),
    prisma.poll.findMany({
      where: {
        messageId: {
          in: uniqueMessageIds,
        },
      },
      select: {
        id: true,
        messageId: true,
        question: true,
        options: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            text: true,
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const pollIds = polls.map((poll) => poll.id);
  const userPollVotes = pollIds.length
    ? await prisma.pollVote.findMany({
        where: {
          pollId: {
            in: pollIds,
          },
          userId,
        },
        select: {
          optionId: true,
          pollId: true,
        },
      })
    : [];
  const reactionCountsByMessageId = new Map<string, ReactionCount[]>();
  const userReactionsByMessageId = new Map<string, Set<string>>();
  const pollsByMessageId = new Map<string, PollWithOptions>();
  const userPollVotesByPollId = new Map<string, UserPollVote>();

  reactionCounts.forEach((reaction) => {
    const current = reactionCountsByMessageId.get(reaction.messageId) ?? [];
    current.push(reaction);
    reactionCountsByMessageId.set(reaction.messageId, current);
  });

  userReactions.forEach((reaction) => {
    const current = userReactionsByMessageId.get(reaction.messageId) ?? new Set<string>();
    current.add(reaction.emoji);
    userReactionsByMessageId.set(reaction.messageId, current);
  });

  polls.forEach((poll) => {
    pollsByMessageId.set(poll.messageId, poll);
  });

  userPollVotes.forEach((vote) => {
    userPollVotesByPollId.set(vote.pollId, vote);
  });

  return {
    pollsByMessageId,
    reactionCountsByMessageId,
    userPollVotesByPollId,
    userReactionsByMessageId,
  };
}

function emptyMetadata(): MessageMetadata {
  return {
    pollsByMessageId: new Map(),
    reactionCountsByMessageId: new Map(),
    userPollVotesByPollId: new Map(),
    userReactionsByMessageId: new Map(),
  };
}

function formatChatMessageWithMetadata(
  message: RawChatMessage,
  metadata: MessageMetadata,
): ChatMessage {
  const reactionsByEmoji = new Map<string, ChatMessageReaction>();
  const userReactions = metadata.userReactionsByMessageId.get(message.id) ?? new Set<string>();
  const reactionCounts = metadata.reactionCountsByMessageId.get(message.id) ?? [];
  const poll = metadata.pollsByMessageId.get(message.id);

  for (const emoji of reactionEmojis) {
    reactionsByEmoji.set(emoji, {
      count: 0,
      emoji,
      reacted: userReactions.has(emoji),
    });
  }

  reactionCounts.forEach((reaction) => {
    const current = reactionsByEmoji.get(reaction.emoji);

    if (!current) {
      return;
    }

    current.count = reaction._count._all;
  });

  const pollVote = poll ? metadata.userPollVotesByPollId.get(poll.id) : null;
  const totalPollVotes =
    poll?.options.reduce((total, option) => total + option._count.votes, 0) ?? 0;

  return {
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    pinnedAt: message.pinnedAt,
    poll: poll
      ? {
          id: poll.id,
          options: poll.options.map((option) => ({
            id: option.id,
            text: option.text,
            voteCount: option._count.votes,
          })),
          question: poll.question,
          totalVotes: totalPollVotes,
          userVoteOptionId: pollVote?.optionId ?? null,
        }
      : null,
    reactions: [...reactionsByEmoji.values()].filter(
      (reaction) => reaction.count > 0 || reaction.reacted,
    ),
    replyTo: message.replyTo
      ? {
          content: message.replyTo.content,
          id: message.replyTo.id,
          sender: message.replyTo.sender,
        }
      : null,
    sender: message.sender,
  };
}

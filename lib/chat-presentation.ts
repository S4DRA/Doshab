export type MessageSegment = { text: string; href?: string };

/** Link only explicit web addresses; leave punctuation and other schemes as text. */
export function messageSegments(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let cursor = 0;
  for (const match of content.matchAll(/https?:\/\/[^\s<>]+/gi)) {
    const start = match.index;
    if (start > cursor) segments.push({ text: content.slice(cursor, start) });
    let address = match[0].replace(/[.,!?;:]+$/, "");
    while (address.endsWith(")") && (address.match(/\)/g)?.length ?? 0) > (address.match(/\(/g)?.length ?? 0)) address = address.slice(0, -1);
    try {
      const parsed = new URL(address);
      if (!parsed.hostname || parsed.username || parsed.password) throw new Error("Not a public web address");
      segments.push({ text: address, href: parsed.href });
      if (address.length < match[0].length) segments.push({ text: match[0].slice(address.length) });
    } catch {
      segments.push({ text: match[0] });
    }
    cursor = start + match[0].length;
  }
  if (cursor < content.length) segments.push({ text: content.slice(cursor) });
  return segments;
}

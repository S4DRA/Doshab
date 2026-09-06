import { NextRequest, NextResponse } from "next/server";
import { authorizeMusic, requireActiveMusicParticipant } from "@/lib/music/server";
import { getMusicProvider } from "@/lib/music/providers";
import { MusicError } from "@/lib/music/state";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const context = await authorizeMusic((await params).channelId);
    await requireActiveMusicParticipant(context);
    const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
    if (query.length > 120 || (query.length > 0 && query.length < 2)) throw new MusicError("Enter at least two characters.");
    const limited = await rateLimit(request, { key: "music:search", identifiers: [context.user.id], limit: 40, windowMs: 60000 });
    if (limited) return limited;
    const provider = getMusicProvider("youtube");
    return NextResponse.json({ tracks: query ? await provider.search(query) : await provider.browse(), provider: "youtube" }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof MusicError ? error.message : "Music search is temporarily unavailable." }, { status: error instanceof MusicError ? error.status : 503 });
  }
}

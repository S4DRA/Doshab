import { getWindowsRelease } from "@/lib/desktop-download";

export async function GET(request: Request) {
  const release = await getWindowsRelease();
  return new Response(null, {
    status: release ? 307 : 303,
    headers: {
      Location: release?.downloadUrl ?? new URL("/download?unavailable=1", request.url).toString(),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

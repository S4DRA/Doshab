import "server-only";
import { headers } from "next/headers";

/** Framework prefetches may render server components; they must not repair data. */
export async function isSpeculativeRequest() {
  const values = await headers();
  return values.has("next-router-prefetch") || /prefetch/i.test(values.get("purpose") ?? "") || /prefetch/i.test(values.get("sec-purpose") ?? "");
}

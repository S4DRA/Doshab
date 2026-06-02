import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });

  const supabase = createSupabaseRouteClient(request, response);
  await supabase.auth.signOut().catch(() => null);

  return response;
}

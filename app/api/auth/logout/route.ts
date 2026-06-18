import { NextRequest, NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/session";
import { createSupabaseRouteClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });

  const supabase = createSupabaseRouteClient(request, response);
  await supabase.auth.signOut({ scope: "global" }).catch(() => null);
  response.cookies.set(sessionCookieName, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

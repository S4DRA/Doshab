import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { renewSessionTokenIfNeeded, sessionCookieName, sessionDurationSeconds } from "@/lib/session-token";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseAnonKey, supabaseUrl };
}

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-doshab-path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  // Only verified, unexpired legacy sessions can roll forward. Auth endpoints
  // retain ownership of login/logout cookies so logout cannot be resurrected.
  let renewed: string | null = null;
  if (!request.nextUrl.pathname.startsWith("/api/auth/")) {
    const token = request.cookies.get(sessionCookieName)?.value;
    renewed = token ? await renewSessionTokenIfNeeded(token) : null;
    if (renewed) {
      request.cookies.set(sessionCookieName, renewed);
      requestHeaders.set("cookie", request.cookies.toString());
    }
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (renewed) response.cookies.set(sessionCookieName, renewed, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
    maxAge: sessionDurationSeconds, expires: new Date(Date.now() + sessionDurationSeconds * 1000),
  });

  const env = getSupabaseEnv();

  // Allow the app to boot even if Supabase isn't configured yet.
  if (!env) {
    return response;
  }

  const { supabaseAnonKey, supabaseUrl } = env;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if needed and propagate updated cookies to the response.
  await supabase.auth.getUser().catch(() => null);

  return response;
}

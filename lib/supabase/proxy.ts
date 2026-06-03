import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
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

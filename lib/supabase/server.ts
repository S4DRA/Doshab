import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseAnonKey, supabaseUrl };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  const { supabaseAnonKey, supabaseUrl } = env;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components, setting cookies may throw. Only Route Handlers can reliably set.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // noop
        }
      },
    },
  });
}

export function createSupabaseRouteClient(
  request: NextRequest,
  response: NextResponse,
) {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    );
  }

  const { supabaseAnonKey, supabaseUrl } = env;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

export type SupabaseCookieOptions = CookieOptions;

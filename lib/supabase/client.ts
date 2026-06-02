"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClientOptions } from "@supabase/supabase-js";

type SupabaseBrowserClientOptions = SupabaseClientOptions<"public"> & {
  isSingleton?: boolean;
};

let browserClient: ReturnType<typeof createBrowserClient> | null | undefined;

export function createSupabaseBrowserClient(options?: SupabaseBrowserClientOptions) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, options);
}

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) {
    return browserClient;
  }

  browserClient = createSupabaseBrowserClient();

  return browserClient;
}

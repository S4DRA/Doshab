"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClientOptions } from "@supabase/supabase-js";

type SupabaseBrowserClientOptions = SupabaseClientOptions<"public"> & {
  isSingleton?: boolean;
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

let browserClient: ReturnType<typeof createBrowserClient> | null | undefined;

export function createSupabaseBrowserClient(options?: SupabaseBrowserClientOptions) {
  const {
    supabaseAnonKey: configuredAnonKey,
    supabaseUrl: configuredUrl,
    ...clientOptions
  } = options ?? {};
  const supabaseUrl = configuredUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    configuredAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, clientOptions);
}

export async function createSupabaseBrowserClientFromRuntimeConfig(
  options?: SupabaseClientOptions<"public">,
) {
  const response = await fetch("/api/auth/supabase-config", {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const config = (await response.json()) as {
    supabaseAnonKey?: string;
    supabaseUrl?: string;
  };

  return createSupabaseBrowserClient({
    ...options,
    supabaseAnonKey: config.supabaseAnonKey,
    supabaseUrl: config.supabaseUrl,
  });
}

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) {
    return browserClient;
  }

  browserClient = createSupabaseBrowserClient();

  return browserClient;
}

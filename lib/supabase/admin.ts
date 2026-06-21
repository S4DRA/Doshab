import "server-only";

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { serviceRoleKey, supabaseUrl };
}

export function createSupabaseAdminClient() {
  const env = getSupabaseAdminEnv();

  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
    );
  }

  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function findSupabaseUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((candidate) => {
      return candidate.email?.toLowerCase() === normalizedEmail;
    });

    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }

  return null;
}

export async function confirmSupabaseEmailForDev(email: string) {
  // TODO: Re-enable email verification/reset before production.
  const supabase = createSupabaseAdminClient();
  const user = await findSupabaseUserByEmail(email);

  if (!user) {
    return false;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  return true;
}

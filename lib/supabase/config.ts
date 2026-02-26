function cleanEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function hasSupabasePublicConfig(): boolean {
  return Boolean(cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) && cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

export function getSupabaseUrl(): string {
  const value = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no está configurado.");
  }

  return value;
}

export function getSupabaseAnonKey(): string {
  const value = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurado.");
  }

  return value;
}

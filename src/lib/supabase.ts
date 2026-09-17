import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function publicAssetUrl(path: string | null) {
  if (!path) return null;
  if (
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  if (path === "/usk-official-logo.png" || path === "usk-official-logo.png") {
    return "/usk-official-logo.png";
  }
  const normalizedPath = path.replace(/^\/+/, "");
  return supabase?.storage.from("usk-assets").getPublicUrl(normalizedPath).data.publicUrl || null;
}


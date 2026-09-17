import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://atwetdbtwvrmsijsueck.supabase.co";
const supabaseKey = "sb_publishable_UwCRGtn3vvttY81U1lj0vQ_cave7Aeo";

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
  const normalizedPath = path
    .replace(/^\/+/, "")
    .replace(/^usk-assets\//, "");
  const publicUrl = supabase?.storage.from("usk-assets").getPublicUrl(normalizedPath).data.publicUrl;
  return publicUrl || null;
}


import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const uploadAsset = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { path, file } = data as { path: string; file: File };
  const url = import.meta.env.SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Le stockage Supabase n’est pas configuré côté serveur.");
  if (!path || !path.startsWith("teams/") || !(file instanceof File) || file.size === 0)
    throw new Error("Le fichier sélectionné est vide ou invalide.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)
    throw new Error("Sélectionnez une image JPG, PNG ou WebP de moins de 10 Mo.");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase.storage.from("usk-assets").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    if (import.meta.env.DEV) console.error("[v0] Supabase team asset upload failed", { path, type: file.type, size: file.size }, error);
    throw new Error("Impossible d’enregistrer le logo.");
  }
  return supabase.storage.from("usk-assets").getPublicUrl(path).data.publicUrl;
});

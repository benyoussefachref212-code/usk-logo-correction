import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const bucket = "usk-assets";
const slotMeta: Record<string, { label: string; title: string; description: string }> = {
  home: { label: "Domicile", title: "Maillot Home", description: "La tenue officielle portée à Kelibia." },
  away: { label: "Extérieur", title: "Maillot Away", description: "La tenue officielle pour les déplacements." },
  third: { label: "Troisième", title: "Maillot Third", description: "La troisième tenue officielle du club." },
};
const slots = new Set(Object.keys(slotMeta));
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxFileSize = 10 * 1024 * 1024;

function getServerSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY est absent de l’environnement serveur.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function safeFileName(name: string) {
  const extension = name.toLowerCase().split(".").pop() || "bin";
  return extension.replace(/[^a-z0-9]/g, "") || "bin";
}

export const uploadTenue = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const payload = data as {
    slot?: unknown;
    file?: { name?: unknown; type?: unknown; bytes?: unknown };
  };
  const slot = payload.slot;
  const uploaded = payload.file;
  const name = typeof uploaded?.name === "string" ? uploaded.name : "tenue-image";
  const type = typeof uploaded?.type === "string" ? uploaded.type : "";
  const bytes = Array.isArray(uploaded?.bytes) ? uploaded.bytes : [];

  if (typeof slot !== "string" || !slots.has(slot)) throw new Error("Type de tenue invalide.");
  if (!bytes.length || !allowedTypes.has(type)) throw new Error("Sélectionnez une image JPG, PNG ou WebP.");
  if (bytes.length > maxFileSize) throw new Error("L’image doit faire moins de 10 Mo.");
  const file = new File([new Uint8Array(bytes as number[])], name, { type });

  const path = `kits/${slot}/${crypto.randomUUID()}.${safeFileName(file.name)}`;
  const supabase = getServerSupabase();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) {
    if (import.meta.env.DEV) console.error("[v0] Supabase tenue upload failed", { slot, path, type: file.type, size: file.size }, uploadError);
    throw new Error("Impossible d’enregistrer le visuel.");
  }

  const timestamp = new Date().toISOString();
  const meta = slotMeta[slot] ?? {
    label: slot === "home" ? "Domicile" : slot === "away" ? "Extérieur" : "Troisième",
    title: slot === "home" ? "Maillot Home" : slot === "away" ? "Maillot Away" : "Maillot Third",
    description:
      slot === "home"
        ? "La tenue officielle portée à Kelibia."
        : slot === "away"
          ? "La tenue officielle pour les déplacements."
          : "La troisième tenue officielle du club.",
  };
  const row = {
    slot,
    label: meta.label,
    title: meta.title,
    description: meta.description,
    image_path: path,
    updated_at: timestamp,
    status: "draft",
    generated_at: null,
    validated_at: null,
  };
  if (!row.label || !row.title || !row.description) {
    throw new Error("Les informations de la tenue sont incomplètes.");
  }
  const { error: rowError } = await supabase.from("usk_official_kits").upsert(
    row,
    { onConflict: "slot" },
  );
  if (rowError) {
    if (import.meta.env.DEV) console.error("[v0] Supabase tenue row update failed", { slot, path }, rowError);
    throw new Error("Le visuel a été téléversé mais n’a pas pu être associé à la tenue.");
  }

  return { path, url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl, updatedAt: timestamp };
});

export type TenueUploadResult = Awaited<ReturnType<typeof uploadTenue>>;

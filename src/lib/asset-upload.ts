import { supabase } from "./supabase";

type AssetUploadData = {
  path: string;
  file: File;
};

const bucket = "usk-assets";

export async function uploadAsset({ data }: { data: AssetUploadData }): Promise<string> {
  const { path, file } = data;
  if (!supabase) {
    console.error("[team-logo] Supabase client missing", {
      file,
      bucket,
      path,
      "upload error": "client unavailable",
      "public URL": null,
    });
    throw new Error("Le stockage Supabase n’est pas configuré côté navigateur.");
  }
  if (
    !path ||
    !(path.startsWith("teams/") || path.startsWith("kits/")) ||
    !(file instanceof File) ||
    file.size === 0
  ) {
    console.error("[team-logo] File validation failed", {
      file,
      bucket,
      path,
      "upload error": "invalid File, path, or empty file",
      "public URL": null,
    });
    throw new Error("Le fichier sélectionné est vide ou invalide.");
  }
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  ) {
    console.error("[team-logo] MIME/size validation failed", {
      file,
      bucket,
      path,
      "upload error": `type=${file.type}, size=${file.size}`,
      "public URL": null,
    });
    throw new Error("Sélectionnez une image JPG, PNG ou WebP de moins de 10 Mo.");
  }

  let error: { message: string } | null = null;
  try {
    ({ error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type,
    }));
  } catch (cause) {
    console.error("[team-logo] Storage request threw", {
      file,
      bucket,
      path,
      "upload error": cause,
      "public URL": null,
    });
    throw new Error(
      "Supabase est injoignable. Vérifiez VITE_SUPABASE_URL dans .env.local et redémarrez le serveur.",
    );
  }
  if (error) {
    console.error("[team-logo] Storage upload failed", {
      file,
      bucket,
      path,
      "upload error": error,
      "public URL": null,
    });
    const message = error.message.toLowerCase();
    if (message.includes("bucket") && message.includes("not found")) {
      throw new Error(
        "Le bucket Supabase « usk-assets » n’existe pas encore. Appliquez la migration Storage.",
      );
    }
    throw new Error(
      import.meta.env.DEV
        ? `Impossible d’enregistrer le logo : ${error.message}`
        : "Impossible d’enregistrer le logo.",
    );
  }
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  console.error("[team-logo] Storage upload succeeded", {
    file,
    bucket,
    path,
    "upload error": null,
    "public URL": publicUrl,
  });
  if (!publicUrl || !/^https?:\/\//.test(publicUrl)) {
    console.error("[team-logo] Public URL invalid", {
      file,
      bucket,
      path,
      "upload error": "invalid public URL",
      "public URL": publicUrl,
    });
    throw new Error("Supabase n’a pas retourné une URL publique valide pour le logo.");
  }
  return publicUrl;
}

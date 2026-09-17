import { useEffect, useState } from "react";
import { publicAssetUrl, supabase } from "../lib/supabase";

export type KitSlot = "home" | "away" | "third";
export type OfficialKit = {
  slot: KitSlot;
  label: string;
  title: string;
  description: string;
  image: string | null;
  updatedAt: string | null;
  generatedAt: string | null;
  validatedAt: string | null;
  status: "draft" | "generated" | "official";
};

const storageKey = "usk-official-kits-v1";
export const kitsUpdatedEvent = "usk-kits-updated";
const defaults: OfficialKit[] = [
  {
    slot: "home",
    label: "Domicile",
    title: "Maillot Home",
    description: "La tenue officielle portée à Kelibia.",
    image: null,
    updatedAt: null,
    generatedAt: null,
    validatedAt: null,
    status: "draft",
  },
  {
    slot: "away",
    label: "Extérieur",
    title: "Maillot Away",
    description: "La tenue officielle pour les déplacements.",
    image: null,
    updatedAt: null,
    generatedAt: null,
    validatedAt: null,
    status: "draft",
  },
  {
    slot: "third",
    label: "Troisième",
    title: "Maillot Third",
    description: "La troisième tenue officielle du club.",
    image: null,
    updatedAt: null,
    generatedAt: null,
    validatedAt: null,
    status: "draft",
  },
];

function normalizeKit(value: unknown, fallback: OfficialKit): OfficialKit {
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<OfficialKit>;
  return {
    ...fallback,
    image:
      typeof candidate.image === "string" && candidate.image.length > 0 ? candidate.image : null,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : null,
    generatedAt: typeof candidate.generatedAt === "string" ? candidate.generatedAt : null,
    validatedAt: typeof candidate.validatedAt === "string" ? candidate.validatedAt : null,
    status:
      candidate.status === "official" || candidate.status === "generated"
        ? candidate.status
        : "draft",
  };
}

let remoteKits: OfficialKit[] = defaults;
let kitsLoading: Promise<void> | null = null;
function readKits(): OfficialKit[] {
  return remoteKits;
}
async function loadRemoteKits() {
  if (!supabase) return;
  const { data, error } = await supabase
    .from("usk_official_kits")
    .select("slot,label,title,description,image_path,status,updated_at,generated_at,validated_at")
    .order("slot");
  if (!error && data)
    remoteKits = defaults.map((fallback) =>
      normalizeKit(
        {
          ...data.find((item) => item.slot === fallback.slot),
          image: publicAssetUrl(
            data.find((item) => item.slot === fallback.slot)?.image_path || null,
          ),
          updatedAt: data.find((item) => item.slot === fallback.slot)?.updated_at,
          generatedAt: data.find((item) => item.slot === fallback.slot)?.generated_at,
          validatedAt: data.find((item) => item.slot === fallback.slot)?.validated_at,
        },
        fallback,
      ),
    );
}

export function getOfficialHomeKit() {
  return getKit("home");
}

export function getKits() {
  return readKits();
}
export function getKit(slot: KitSlot) {
  return readKits().find((kit) => kit.slot === slot) || defaults.find((kit) => kit.slot === slot)!;
}
export async function saveKit(slot: KitSlot, image: string | null) {
  const timestamp = image ? new Date().toISOString() : null;
  remoteKits = readKits().map((kit) =>
    kit.slot === slot
      ? {
          ...kit,
          image,
          updatedAt: timestamp,
          status: "draft",
          generatedAt: null,
          validatedAt: null,
        }
      : kit,
  );
  if (supabase) {
    const kit = getKit(slot);
    const { error } = await supabase
      .from("usk_official_kits")
      .upsert(
        {
          slot,
          label: kit.label,
          title: kit.title,
          description: kit.description,
          image_path: image && !image.startsWith("data:") ? image : null,
          updated_at: timestamp,
          status: "draft",
          generated_at: null,
          validated_at: null,
        },
        { onConflict: "slot" },
      );
    if (error) throw error;
  }
  window.dispatchEvent(new CustomEvent(kitsUpdatedEvent));
}
export async function generateKit(slot: KitSlot) {
  const timestamp = new Date().toISOString();
  remoteKits = readKits().map((kit) =>
    kit.slot === slot
      ? { ...kit, generatedAt: timestamp, status: "generated" as const, updatedAt: timestamp }
      : kit,
  );
  if (supabase) {
    const { error } = await supabase
      .from("usk_official_kits")
      .update({ generated_at: timestamp, status: "generated", updated_at: timestamp })
      .eq("slot", slot);
    if (error) throw error;
  }
  window.dispatchEvent(new CustomEvent(kitsUpdatedEvent));
}

export async function validateKit(slot: KitSlot) {
  const timestamp = new Date().toISOString();
  remoteKits = readKits().map((kit) =>
    kit.slot === slot
      ? { ...kit, validatedAt: timestamp, status: "official" as const, updatedAt: timestamp }
      : kit,
  );
  if (supabase) {
    const { error } = await supabase
      .from("usk_official_kits")
      .update({ validated_at: timestamp, status: "official", updated_at: timestamp })
      .eq("slot", slot);
    if (error) throw error;
  }
  window.dispatchEvent(new CustomEvent(kitsUpdatedEvent));
}

export function useKits() {
  const [kits, setKits] = useState<OfficialKit[]>(() => getKits());
  useEffect(() => {
    kitsLoading = kitsLoading || loadRemoteKits();
    kitsLoading.then(() => setKits(getKits()));
    const sync = () => setKits(getKits());
    window.addEventListener(kitsUpdatedEvent, sync);
    return () => window.removeEventListener(kitsUpdatedEvent, sync);
  }, []);
  return kits;
}

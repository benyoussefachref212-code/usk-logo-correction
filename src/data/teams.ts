import { useEffect, useState } from "react";
import { publicAssetUrl, supabase } from "../lib/supabase";

export type KitPattern = "vertical" | "horizontal" | "diagonal" | "crest";

export type VirtualKit = {
  status: "pending" | "ready";
  generatedAt: string | null;
  logo: string | null;
  pattern: KitPattern;
  patternScale: number;
  patternAngle: number;
};

export type TeamIdentity = {
  primary: string;
  secondary: string;
  pattern: KitPattern;
  scale: number;
  angle: number;
  updatedAt: string | null;
};

export type Team = {
  id: string;
  abbreviation: string;
  name: string;
  logo?: string | null;
  identity?: TeamIdentity;
  virtualKit?: VirtualKit;
  colors: string;
  accent: string;
  stadium: string;
  city: string;
  competition: string;
  group: string;
  season: string;
};

const defaultIdentity: TeamIdentity = {
  primary: "#b51f32",
  secondary: "#10233f",
  pattern: "crest",
  scale: 18,
  angle: 0,
  updatedAt: null,
};

const defaultVirtualKit: VirtualKit = {
  status: "pending",
  generatedAt: null,
  logo: null,
  pattern: "crest",
  patternScale: 18,
  patternAngle: 0,
};

const defaultTeamMeta = { competition: "Championnat", group: "Groupe 1", season: "2024 / 25" };

const catalog = [
  [
    "usc",
    "USC",
    "الاتحاد الرياضي قرطاجني",
    "Carthage",
    "Stade municipal USC الاتحاد الرياضي قرطاجني",
    "#d7a928",
    "#122d70",
  ],
  [
    "ssz",
    "SSZ",
    "السّتر الرياضي بجروزونة",
    "Tunisia",
    "Stade municipal SSZ السّتر الرياضي بجروزونة",
    "#254d8d",
    "#e2bf38",
  ],
  [
    "usdj",
    "USDJ",
    "الاتحاد الرياضي بالجديدة",
    "Tunisia",
    "Stade municipal USDJ الاتحاد الرياضي بالجديدة",
    "#304671",
    "#e9eef5",
  ],
  ["usk", "USK", "الاتحاد الرياضي القليبي", "Tunisia", "Stade de Kelibia", "#bd2437", "#17356f"],
  [
    "gs",
    "GS",
    "قرمبالية الرياضية",
    "Tunisia",
    "Stade municipal GS قرمبالية الرياضية",
    "#edf3f8",
    "#5d789a",
  ],
  [
    "csmb",
    "CSMB",
    "النادي الرياضي بمنزل بوزلفة",
    "Tunisia",
    "Stade municipal CSMB النادي الرياضي بمنزل بوزلفة",
    "#3f8d55",
    "#b9c737",
  ],
  [
    "vsma",
    "VSMA",
    "الموج · منزل عبد الرحمان",
    "Tunisia",
    "Stade municipal VSMA الموج منزل عبد الرحمان",
    "#7eadd3",
    "#f0f4f7",
  ],
  [
    "fsrd",
    "FSRD",
    "الكوكب الرياضي بمنزل جميل",
    "Tunisia",
    "Stade municipal FSRD الكوكب الرياضي بمنزل جميل",
    "#148d54",
    "#d9f1d5",
  ],
  [
    "cfmt",
    "CFMT",
    "نادي كرة القدم بمنزل تميم",
    "Tunisia",
    "Stade Municipal de Menzel Temime",
    "#332e83",
    "#fff",
  ],
  [
    "jsm",
    "JSM",
    "الشبيبة الرياضية بمنوبة",
    "Tunisia",
    "Stade municipal JSM الشبيبة الرياضية بمنوبة",
    "#d22d36",
    "#e4b72b",
  ],
  [
    "asmo",
    "ASMO",
    "السهم الرياضي برأس الجبل",
    "Tunisia",
    "Stade municipal ASMO السهم الرياضي برأس الجبل",
    "#e47d28",
    "#242b4a",
  ],
  [
    "asoe",
    "ASOE",
    "المستقبل الرياضي بوادي الليل",
    "Tunisia",
    "Stade municipal ASOE المستقبل الرياضي بوادي الليل",
    "#4064bb",
    "#f3f4f8",
  ],
  [
    "asmh",
    "ASMH",
    "المستقبل الرياضي بالمحمدية",
    "Tunisia",
    "Stade municipal ASMH المستقبل الرياضي بالمحمدية",
    "#d0bc2c",
    "#1d9a52",
  ],
  [
    "samb",
    "SAMB",
    "الملعب الإفريقي بمنزل بورقيبة",
    "Tunisia",
    "Stade municipal SAMB الملعب الإفريقي بمنزل بورقيبة",
    "#4eaa8c",
    "#e9f4ef",
  ],
] as const;

export const officialTeams: Team[] = catalog.map(
  ([id, abbreviation, name, city, stadium, colors, accent]) => ({
    ...defaultTeamMeta,
    id,
    abbreviation,
    name,
    city,
    stadium,
    colors,
    accent,
  }),
);

function withTeamDefaults(team: Team): Team {
  const identity = team.identity || {
    ...defaultIdentity,
    primary: team.colors,
    secondary: team.accent,
  };
  const virtualKit = team.virtualKit || {
    ...defaultVirtualKit,
    logo: team.logo || null,
    pattern: identity.pattern,
    patternScale: identity.scale,
    patternAngle: identity.angle,
  };
  return { ...team, identity, virtualKit };
}

function fromRow(row: Record<string, unknown>): Team {
  const id = String(row["id"]);
  const catalogTeam = officialTeams.find((team) => team.id === id);
  const team: Team = {
    id,
    abbreviation: String(row["abbreviation"] || catalogTeam?.abbreviation || id),
    name: String(row["name"] || catalogTeam?.name || id),
    logo: publicAssetUrl(typeof row["logo_path"] === "string" ? row["logo_path"] : null),
    colors: String(row["colors"] || catalogTeam?.colors || "#b51f32"),
    accent: String(row["accent"] || catalogTeam?.accent || "#10233f"),
    stadium: String(row["stadium"] || catalogTeam?.stadium || "Stade municipal"),
    city: String(row["city"] || catalogTeam?.city || "Tunisia"),
    competition: String(row["competition"] || "Championnat"),
    group: String(row["group_name"] || "Groupe 1"),
    season: String(row["season"] || "2024 / 25"),
  };
  if (row["identity"]) team.identity = row["identity"] as TeamIdentity;
  if (row["virtual_kit"]) team.virtualKit = row["virtual_kit"] as VirtualKit;
  return withTeamDefaults(team);
}

const storageKey = "usk_teams";

async function loadTeams(): Promise<Team[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("usk_teams")
      .select(
        "id,abbreviation,name,logo_path,colors,accent,stadium,city,competition,group_name,season,identity,virtual_kit",
      )
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[team-logo] Database teams load failed", {
        "team id": null,
        "database error": error,
        "public URL": null,
      });
    }
    if (!error && data?.length) {
      const teams = data.map((row) => fromRow(row as Record<string, unknown>));
      localStorage.setItem(storageKey, JSON.stringify(teams));
      return teams;
    }
  }
  try {
    const local = localStorage.getItem(storageKey);
    if (local) return JSON.parse(local) as Team[];
  } catch (error) {
    if (import.meta.env.DEV) console.error("[v0] Could not read local teams", error);
  }
  return officialTeams.map(withTeamDefaults);
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>(() => officialTeams.map(withTeamDefaults));

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const loaded = await loadTeams();
      if (active) setTeams(loaded);
    };
    void refresh();
    const handleUpdate = () => void refresh();
    window.addEventListener("teams_updated", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("teams_updated", handleUpdate);
    };
  }, []);

  return teams;
}

export function getTeams(): Team[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Team[];
        if (Array.isArray(parsed) && parsed.length) return parsed.map(withTeamDefaults);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("[team-logo] Could not read cached teams", error);
    }
  }
  return officialTeams.map(withTeamDefaults);
}

function toRow(team: Team) {
  return {
    id: team.id,
    abbreviation: team.abbreviation,
    name: team.name,
    logo_path: team.logo || null,
    colors: team.colors,
    accent: team.accent,
    stadium: team.stadium,
    city: team.city,
    competition: team.competition,
    group_name: team.group,
    season: team.season,
    identity: team.identity || {},
    virtual_kit: team.virtualKit || {},
  };
}

export async function saveTeams(teams: Team[]) {
  const normalized = teams.map(withTeamDefaults);
  if (!supabase) {
    console.error("[team-logo] Database upsert skipped", {
      "team id": normalized.map((team) => team.id),
      "database error": "Supabase client unavailable",
      "public URL": normalized.map((team) => team.logo || null),
    });
    throw new Error("Supabase n’est pas configuré : les équipes ne peuvent pas être sauvegardées.");
  }
  const { error } = await supabase
    .from("usk_teams")
    .upsert(normalized.map(toRow), { onConflict: "id" });
  if (error) {
    console.error("[team-logo] Database upsert failed", {
      teamIds: normalized.map((team) => team.id),
      "database error": error,
    });
    throw new Error(`Impossible d’enregistrer les équipes : ${error.message}`);
  }
  localStorage.setItem(storageKey, JSON.stringify(normalized));
  window.dispatchEvent(new Event("teams_updated"));
}

export async function updateTeamLogo(teams: Team[], teamId: string, logoUrl: string) {
  const current = teams.find((team) => team.id === teamId);
  if (!current) throw new Error("Équipe introuvable.");
  if (!/^https?:\/\//.test(logoUrl)) throw new Error("L’URL publique du logo est invalide.");
  if (!supabase)
    throw new Error("Supabase n’est pas configuré : le logo ne peut pas être sauvegardé.");
  const virtualKit: VirtualKit = {
    ...withTeamDefaults(current).virtualKit!,
    status: "pending",
    generatedAt: null,
    logo: logoUrl,
  };
  const { error } = await supabase
    .from("usk_teams")
    .update({ logo_path: logoUrl, virtual_kit: virtualKit })
    .eq("id", teamId);
  if (error) {
    console.error("[team-logo] Database logo update failed", {
      "team id": teamId,
      "database error": error,
      "public URL": logoUrl,
    });
    throw new Error(`Impossible d’enregistrer le logo : ${error.message}`);
  }
  console.error("[team-logo] Database logo update succeeded", {
    "team id": teamId,
    "database error": null,
    "public URL": logoUrl,
  });
  await saveTeams(
    teams.map((team) => (team.id === teamId ? { ...team, logo: logoUrl, virtualKit } : team)),
  );
}

export async function generateVirtualKit(teams: Team[], teamId: string) {
  const team = teams.find((item) => item.id === teamId);
  if (!team) throw new Error("Équipe introuvable.");
  const base = withTeamDefaults(team);
  const virtualKit: VirtualKit = {
    ...base.virtualKit!,
    status: "ready",
    generatedAt: new Date().toISOString(),
    logo: base.logo || base.virtualKit?.logo || null,
  };
  await saveTeams(teams.map((item) => (item.id === teamId ? { ...base, virtualKit } : item)));
}

export function getVirtualKit(team: Team): VirtualKit {
  return withTeamDefaults(team).virtualKit!;
}

export function getTeamById(teams: Team[], id?: string | null) {
  return teams.find((team) => team.id === id);
}

export function getTeamStadium(team?: Team | null) {
  return team?.stadium?.trim() || "";
}

export function teamBadge(team: Team) {
  return { "--badge-primary": team.colors, "--badge-accent": team.accent } as React.CSSProperties;
}

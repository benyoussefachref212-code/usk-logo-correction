import { useEffect, useState } from "react";
import { publicAssetUrl, supabase, uploadAsset } from "../lib/supabase";

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

const defaultTeamMeta = {
  stadium: "",
  competition: "Championnat",
  group: "Groupe 1",
  season: "2024 / 25",
};

export const officialTeams: Team[] = [
  {
    ...defaultTeamMeta,
    city: "Carthage",
    stadium: "Stade municipal USC الاتحاد الرياضي قرطاجني",
    id: "usc",
    abbreviation: "USC",
    name: "الاتحاد الرياضي قرطاجني",
    logo: "teams/usc/logo-official.png",
    colors: "#d7a928",
    accent: "#122d70",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal SSZ السّتر الرياضي بجروزونة",
    id: "ssz",
    abbreviation: "SSZ",
    name: "السّتر الرياضي بجروزونة",
    logo: "teams/ssz/logo-official.png",
    colors: "#254d8d",
    accent: "#e2bf38",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal USDJ الاتحاد الرياضي بالجديدة",
    id: "usdj",
    abbreviation: "USDJ",
    name: "الاتحاد الرياضي بالجديدة",
    logo: "teams/usdj/logo-official.png",
    colors: "#304671",
    accent: "#e9eef5",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade de Kelibia",
    id: "usk",
    abbreviation: "USK",
    name: "الاتحاد الرياضي القليبي",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-dD2nDzcpk7udoFfBodPHC0h3A5TLdm.png",
    colors: "#bd2437",
    accent: "#17356f",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal GS قرمبالية الرياضية",
    id: "gs",
    abbreviation: "GS",
    name: "قرمبالية الرياضية",
    colors: "#edf3f8",
    accent: "#5d789a",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal CSMB النادي الرياضي بمنزل بوزلفة",
    id: "csmb",
    abbreviation: "CSMB",
    name: "النادي الرياضي بمنزل بوزلفة",
    colors: "#3f8d55",
    accent: "#b9c737",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal VSMA الموج منزل عبد الرحمان",
    id: "vsma",
    abbreviation: "VSMA",
    name: "الموج · منزل عبد الرحمان",
    colors: "#7eadd3",
    accent: "#f0f4f7",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal FSRD الكوكب الرياضي بمنزل جميل",
    id: "fsrd",
    abbreviation: "FSRD",
    name: "الكوكب الرياضي بمنزل جميل",
    colors: "#148d54",
    accent: "#d9f1d5",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade Municipal de Menzel Temime",
    id: "cfmt",
    abbreviation: "CFMT",
    name: "نادي كرة القدم بمنزل تميم",
    colors: "#332e83",
    accent: "#fff",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal JSM الشبيبة الرياضية بمنوبة",
    id: "jsm",
    abbreviation: "JSM",
    name: "الشبيبة الرياضية بمنوبة",
    colors: "#d22d36",
    accent: "#e4b72b",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal ASMO السهم الرياضي برأس الجبل",
    id: "asmo",
    abbreviation: "ASMO",
    name: "السهم الرياضي برأس الجبل",
    colors: "#e47d28",
    accent: "#242b4a",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal ASOE المستقبل الرياضي بوادي الليل",
    id: "asoe",
    abbreviation: "ASOE",
    name: "المستقبل الرياضي بوادي الليل",
    colors: "#4064bb",
    accent: "#f3f4f8",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal ASMH المستقبل الرياضي بالمحمدية",
    id: "asmh",
    abbreviation: "ASMH",
    name: "المستقبل الرياضي بالمحمدية",
    colors: "#d0bc2c",
    accent: "#1d9a52",
  },
  {
    ...defaultTeamMeta,
    city: "Tunisia",
    stadium: "Stade municipal SAMB الملعب الإفريقي بمنزل بورقيبة",
    id: "samb",
    abbreviation: "SAMB",
    name: "الملعب الإفريقي بمنزل بورقيبة",
    colors: "#4eaa8c",
    accent: "#e9f4ef",
  },
];

const storageKey = "usk-teams-v1";
let remoteTeams: Team[] | null = null;
let teamsLoading: Promise<void> | null = null;

function fromRow(row: Record<string, unknown>): Team {
  const id = String(row.id);
  const savedStadium = typeof row.stadium === "string" ? row.stadium.trim() : "";
  const catalogStadium = officialTeams.find((team) => team.id === id)?.stadium || "";
  const stadium =
    savedStadium && savedStadium.toLowerCase() !== "stade municipal"
      ? savedStadium
      : catalogStadium;
  return withTeamDefaults({
    id,
    abbreviation: String(row.abbreviation),
    name: String(row.name),
    logo: publicAssetUrl(row.logo_path as string | null),
    colors: String(row.colors || "#b51f32"),
    accent: String(row.accent || "#10233f"),
    stadium,
    city: String(row.city || "Tunisia"),
    competition: String(row.competition || "Championnat"),
    group: String(row.group_name || "Groupe 1"),
    season: String(row.season || "2024 / 25"),
    identity: (row.identity || {}) as TeamIdentity,
    virtualKit: (row.virtual_kit || {}) as VirtualKit,
  });
}

async function loadRemoteTeams() {
  if (!supabase || remoteTeams) return;
  const { data, error } = await supabase
    .from("usk_teams")
    .select(
      "id,abbreviation,name,logo_path,colors,accent,stadium,city,competition,group_name,season,identity,virtual_kit",
    )
    .order("created_at");
  if (!error && data?.length) remoteTeams = data.map(fromRow);
}
export function getTeamStadium(team?: Team | null) {
  return team?.stadium?.trim() || "";
}
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

function analyzeLogoDesign(logo: string | null): Promise<
  Pick<VirtualKit, "pattern" | "patternScale" | "patternAngle"> & {
    primary: string;
    secondary: string;
  }
> {
  if (!logo || typeof window === "undefined") {
    return Promise.resolve({
      pattern: "crest",
      patternScale: 18,
      patternAngle: 0,
      primary: "#b51f32",
      secondary: "#10233f",
    });
  }
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 48;
      canvas.height = 48;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context)
        return resolve({
          pattern: "crest",
          patternScale: 18,
          patternAngle: 0,
          primary: "#b51f32",
          secondary: "#10233f",
        });
      context.drawImage(image, 0, 0, 48, 48);
      const pixels = context.getImageData(0, 0, 48, 48).data;
      const colors = new Map<string, number>();
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] < 180) continue;
        const red = Math.round(pixels[index] / 32) * 32;
        const green = Math.round(pixels[index + 1] / 32) * 32;
        const blue = Math.round(pixels[index + 2] / 32) * 32;
        const color = `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
        colors.set(color, (colors.get(color) || 0) + 1);
      }
      const palette = [...colors.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)
        .filter((color) => color !== "#ffffff");
      const rowChanges = Array.from({ length: 47 }, (_, row) =>
        Array.from({ length: 48 }, (_, column) => {
          const a = (row * 48 + column) * 4;
          const b = ((row + 1) * 48 + column) * 4;
          return (
            Math.abs(pixels[a] - pixels[b]) +
            Math.abs(pixels[a + 1] - pixels[b + 1]) +
            Math.abs(pixels[a + 2] - pixels[b + 2])
          );
        }).reduce((sum, value) => sum + value, 0),
      ).reduce((sum, value) => sum + value, 0);
      const columnChanges = Array.from({ length: 47 }, (_, column) =>
        Array.from({ length: 48 }, (_, row) => {
          const a = (row * 48 + column) * 4;
          const b = (row * 48 + column + 1) * 4;
          return (
            Math.abs(pixels[a] - pixels[b]) +
            Math.abs(pixels[a + 1] - pixels[b + 1]) +
            Math.abs(pixels[a + 2] - pixels[b + 2])
          );
        }).reduce((sum, value) => sum + value, 0),
      ).reduce((sum, value) => sum + value, 0);
      const diagonalChanges = Array.from({ length: 47 }, (_, row) =>
        Array.from({ length: 47 }, (_, column) => {
          const a = (row * 48 + column) * 4;
          const b = ((row + 1) * 48 + column + 1) * 4;
          return (
            Math.abs(pixels[a] - pixels[b]) +
            Math.abs(pixels[a + 1] - pixels[b + 1]) +
            Math.abs(pixels[a + 2] - pixels[b + 2])
          );
        }).reduce((sum, value) => sum + value, 0),
      ).reduce((sum, value) => sum + value, 0);
      const strongest = Math.max(rowChanges, columnChanges, diagonalChanges);
      const pattern =
        strongest === columnChanges
          ? "vertical"
          : strongest === rowChanges
            ? "horizontal"
            : strongest === diagonalChanges
              ? "diagonal"
              : "crest";
      resolve({
        pattern,
        patternScale: Math.max(12, Math.min(28, Math.round(2200 / Math.max(strongest, 1)))),
        patternAngle: pattern === "diagonal" ? 28 : 0,
        primary: palette[0] || "#b51f32",
        secondary: palette[1] || "#10233f",
      });
    };
    image.onerror = () => resolve({ pattern: "crest", patternScale: 18, patternAngle: 0 });
    image.src = logo;
  });
}

function withTeamDefaults(team: Partial<Team> & Pick<Team, "id" | "abbreviation" | "name">): Team {
  const storedLogo = typeof team.logo === "string" && team.logo.length > 0 ? team.logo : null;
  const logo = publicAssetUrl(storedLogo);
  const identity = {
    ...defaultIdentity,
    primary: team.identity?.primary || team.colors || defaultIdentity.primary,
    secondary: team.identity?.secondary || team.accent || defaultIdentity.secondary,
    ...(team.identity || {}),
  } as TeamIdentity;
  const virtualKit = {
    ...defaultVirtualKit,
    ...(team.virtualKit || {}),
    logo: logo || team.virtualKit?.logo || null,
    pattern: team.virtualKit?.pattern || identity.pattern,
    patternScale: team.virtualKit?.patternScale || identity.scale,
    patternAngle: team.virtualKit?.patternAngle || identity.angle,
  } as VirtualKit;
  return {
    ...defaultTeamMeta,
    city: "Tunisia",
    colors: "#b51f32",
    accent: "#10233f",
    ...team,
    logo,
    identity,
    virtualKit,
  };
}

function cloneTeams(teams: Team[]) {
  return teams.map((team) =>
    withTeamDefaults({ ...team, virtualKit: team.virtualKit ? { ...team.virtualKit } : undefined }),
  );
}

export function getTeams(): Team[] {
  return cloneTeams(remoteTeams || officialTeams);
}

export function getTeamById(teams: Team[], id?: string | null) {
  return teams.find((team) => team.id === id);
}

export function findTeam(teams: Team[], value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  return (
    teams.find(
      (team) =>
        team.id === normalized ||
        team.name.toLowerCase() === normalized ||
        team.abbreviation.toLowerCase() === normalized,
    ) ||
    officialTeams.find(
      (team) =>
        team.id === normalized ||
        team.name.toLowerCase() === normalized ||
        team.abbreviation.toLowerCase() === normalized,
    )
  );
}
export async function saveTeams(teams: Team[]) {
  const normalized = cloneTeams(teams);
  remoteTeams = normalized;
  if (supabase) {
    const rows = normalized.map((team) => ({
      id: team.id,
      abbreviation: team.abbreviation,
      name: team.name,
      logo_path: team.logo && !team.logo.startsWith("data:") ? team.logo : null,
      colors: team.colors,
      accent: team.accent,
      stadium: team.stadium,
      city: team.city,
      competition: team.competition,
      group_name: team.group,
      season: team.season,
      identity: team.identity || {},
      virtual_kit: team.virtualKit || {},
    }));
    const { error } = await supabase.from("usk_teams").upsert(rows);
    if (error) throw error;
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("usk-teams-updated"));
}

export function getVirtualKit(team: Team): VirtualKit {
  return team.virtualKit || { ...defaultVirtualKit, logo: team.logo || null };
}

export async function updateTeamLogo(teams: Team[], teamId: string, logo: string | null) {
  const design = await analyzeLogoDesign(logo);
  await saveTeams(
    teams.map((team) =>
      team.id === teamId
        ? {
            ...team,
            logo,
            colors: design.primary,
            accent: design.secondary,
            identity: {
              primary: design.primary,
              secondary: design.secondary,
              pattern: design.pattern,
              scale: design.patternScale,
              angle: design.patternAngle,
              updatedAt: new Date().toISOString(),
            },
            virtualKit: {
              ...getVirtualKit(team),
              ...design,
              status: "pending",
              generatedAt: null,
              logo,
            },
          }
        : team,
    ),
  );
}

export async function generateVirtualKit(teams: Team[], teamId: string) {
  const team = teams.find((candidate) => candidate.id === teamId);
  if (!team) return;
  const design = await analyzeLogoDesign(team.logo || getVirtualKit(team).logo);
  saveTeams(
    teams.map((candidate) =>
      candidate.id === teamId
        ? {
            ...candidate,
            identity: {
              ...candidate.identity,
              primary: design.primary,
              secondary: design.secondary,
              pattern: design.pattern,
              scale: design.patternScale,
              angle: design.patternAngle,
              updatedAt: new Date().toISOString(),
            },
            colors: design.primary,
            accent: design.secondary,
            virtualKit: {
              ...getVirtualKit(candidate),
              ...design,
              status: "ready",
              generatedAt: new Date().toISOString(),
              logo: candidate.logo || null,
            },
          }
        : candidate,
    ),
  );
}
export function resetTeams() {
  saveTeams(officialTeams);
}
export function useTeams() {
  const [teams, setTeams] = useState<Team[]>(getTeams);
  useEffect(() => {
    let active = true;
    teamsLoading = teamsLoading || loadRemoteTeams();
    teamsLoading.then(() => {
      if (active) setTeams(getTeams());
    });
    const sync = () => setTeams(getTeams());
    window.addEventListener("usk-teams-updated", sync);
    return () => {
      active = false;
      window.removeEventListener("usk-teams-updated", sync);
    };
  }, []);
  return teams;
}

export function teamBadge(team: Team) {
  return {
    background: `linear-gradient(135deg, ${team.colors}, ${team.accent})`,
    color: team.accent === "#fff" ? "#fff" : "#fff",
  };
}

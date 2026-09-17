export type MatchStatus = "upcoming" | "live" | "finished" | "postponed" | "cancelled";
export type MatchResult = "V" | "N" | "D" | "N/A";

export type Match = {
  id: string;
  date: string;
  time: string;
  homeTeamId?: string;
  opponentTeamId?: string;
  opponent: string;
  opponentShort: string;
  opponentLogo?: string;
  competition: string;
  home: boolean;
  stadium: string;
  status: MatchStatus;
  scoreFor?: number;
  scoreAgainst?: number;
  startedAt?: string;
  pausedAt?: string;
  elapsedSeconds?: number;
  result?: MatchResult;
  referee?: string;
  assistantReferee1?: string;
  assistantReferee2?: string;
  fourthReferee?: string;
};

export const defaultMatches: Match[] = [
  {
    id: "m-1",
    date: "2025-04-19",
    time: "16:00",
    opponent: "AS Kelibia",
    opponentShort: "AK",
    competition: "Championnat · Journée 18",
    home: true,
    stadium: "Stade de Kelibia",
    status: "upcoming",
  },
  {
    id: "m-2",
    date: "2025-04-27",
    time: "15:00",
    opponent: "ES Hammamet",
    opponentShort: "EH",
    competition: "Championnat · Journée 19",
    home: false,
    stadium: "Stade Municipal Hammamet",
    status: "upcoming",
  },
  {
    id: "m-3",
    date: "2025-05-07",
    time: "18:30",
    opponent: "CS Bizerte",
    opponentShort: "CB",
    competition: "Coupe de Tunisie",
    home: true,
    stadium: "Stade de Kelibia",
    status: "upcoming",
  },
  {
    id: "m-4",
    date: "2025-05-11",
    time: "15:00",
    opponent: "JS Korba",
    opponentShort: "JK",
    competition: "Championnat · Journée 20",
    home: false,
    stadium: "Stade de Korba",
    status: "upcoming",
  },
  {
    id: "m-5",
    date: "2025-04-12",
    time: "15:00",
    opponent: "JS Korba",
    opponentShort: "JK",
    competition: "Championnat · Journée 17",
    home: false,
    stadium: "Stade de Korba",
    status: "finished",
    scoreFor: 3,
    scoreAgainst: 0,
    result: "V",
  },
  {
    id: "m-6",
    date: "2025-04-05",
    time: "16:00",
    opponent: "CS Sfaxien",
    opponentShort: "CS",
    competition: "Championnat · Journée 16",
    home: true,
    stadium: "Stade de Kelibia",
    status: "finished",
    scoreFor: 1,
    scoreAgainst: 1,
    result: "N",
  },
];

import { useEffect, useState } from "react";
import { supabase, publicAssetUrl } from "../lib/supabase";

const legacyOpponentIds: Record<string, string> = {
  "CS Sfaxien": "csmb",
  "ES Hammamet": "vsma",
};
let remoteMatches: Match[] = defaultMatches;
let matchesLoading: Promise<void> | null = null;
const matchesUpdatedEvent = "usk-matches-updated";

export function getElapsedSeconds(match: Match, now = Date.now()) {
  const base = match.elapsedSeconds ?? 0;
  if (match.status !== "live" || !match.startedAt || match.pausedAt) return base;
  return base + Math.max(0, Math.floor((now - Date.parse(match.startedAt)) / 1000));
}

export function formatElapsedSeconds(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function fromRow(raw: Record<string, unknown>): Match {
  const row = raw as Record<string, string | number | boolean | null | undefined>;
  return {
    id: String(row.id),
    date: String(row.date),
    time: String(row.time),
    ...(row.home_team_id ? { homeTeamId: String(row.home_team_id) } : {}),
    ...(row.opponent_team_id || legacyOpponentIds[String(row.opponent)]
      ? { opponentTeamId: row.opponent_team_id || legacyOpponentIds[String(row.opponent)] }
      : {}),
    opponent: String(row.opponent),
    opponentShort: String(row.opponent_short),
    ...(publicAssetUrl(row.opponent_logo_path as string | null)
      ? { opponentLogo: publicAssetUrl(row.opponent_logo_path as string | null)! }
      : {}),
    competition: String(row.competition),
    home: Boolean(row.home),
    stadium: String(row.stadium),
    status: row.status as MatchStatus,
    ...(row.score_for !== null && row.score_for !== undefined
      ? { scoreFor: Number(row.score_for) }
      : {}),
    ...(row.score_against !== null && row.score_against !== undefined
      ? { scoreAgainst: Number(row.score_against) }
      : {}),
    ...(row.started_at ? { startedAt: String(row.started_at) } : {}),
    ...(row.paused_at ? { pausedAt: String(row.paused_at) } : {}),
    ...(row.elapsed_seconds !== null && row.elapsed_seconds !== undefined
      ? { elapsedSeconds: Number(row.elapsed_seconds) }
      : {}),
    ...(row.result ? { result: row.result as MatchResult } : {}),
    ...(row.referee ? { referee: String(row.referee) } : {}),
    ...(row.assistant_referee_1 ? { assistantReferee1: String(row.assistant_referee_1) } : {}),
    ...(row.assistant_referee_2 ? { assistantReferee2: String(row.assistant_referee_2) } : {}),
    ...(row.fourth_referee ? { fourthReferee: String(row.fourth_referee) } : {}),
  };
}
async function loadRemoteMatches() {
  if (!supabase) return;
  const { data, error } = await supabase.from("usk_matches").select("*").order("date");
  if (error) return;
  if (data?.length) {
    remoteMatches = data.map(fromRow);
    return;
  }

  // The database schema intentionally stores only the columns represented below.
  // Keep the preview usable when the first seed upsert is rejected by a stale
  // PostgREST schema cache instead of letting the rejected promise escape setup.
  try {
    await saveMatches(defaultMatches);
  } catch (seedError) {
    console.error("[v0] Match seed skipped:", seedError);
  }
}
export function getMatches(): Match[] {
  return remoteMatches.map((match) => ({ ...match }));
}
export async function updateMatchStatus(matchId: string, status: MatchStatus) {
  const current = remoteMatches.find((match) => match.id === matchId);
  if (!current) throw new Error("Match introuvable");

  if (supabase) {
    const { error } = await supabase
      .from("usk_matches")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", matchId);
    if (error) {
      throw Object.assign(new Error(error.message), {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
  }

  remoteMatches = remoteMatches.map((match) =>
    match.id === matchId ? { ...match, status } : { ...match },
  );
  if (typeof window !== "undefined") window.dispatchEvent(new Event(matchesUpdatedEvent));
}

export async function updateMatch(matchId: string, patch: Partial<Match>) {
  const current = remoteMatches.find((match) => match.id === matchId);
  if (!current) throw new Error("Match introuvable");
  const next = { ...current, ...patch };
  if (supabase) {
    const row = {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.scoreFor !== undefined ? { score_for: patch.scoreFor } : {}),
      ...(patch.scoreAgainst !== undefined ? { score_against: patch.scoreAgainst } : {}),
      ...(patch.startedAt !== undefined ? { started_at: patch.startedAt } : {}),
      ...(patch.pausedAt !== undefined ? { paused_at: patch.pausedAt } : {}),
      ...(patch.elapsedSeconds !== undefined ? { elapsed_seconds: patch.elapsedSeconds } : {}),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("usk_matches").update(row).eq("id", matchId);
    if (error)
      throw Object.assign(new Error(error.message), {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
  }
  remoteMatches = remoteMatches.map((match) => (match.id === matchId ? next : match));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(matchesUpdatedEvent));
  return next;
}

export async function saveMatches(matches: Match[]) {
  if (supabase) {
    const rows = matches.map((match) => ({
      id: match.id,
      date: match.date,
      time: match.time,
      home_team_id: match.homeTeamId || null,
      opponent_team_id: match.opponentTeamId || null,
      opponent: match.opponent,
      opponent_short: match.opponentShort,
      opponent_logo_path:
        match.opponentLogo && !match.opponentLogo.startsWith("data:") ? match.opponentLogo : null,
      competition: match.competition,
      home: match.home,
      stadium: match.stadium,
      status: match.status,
      score_for: match.scoreFor ?? null,
      score_against: match.scoreAgainst ?? null,
      started_at: match.startedAt ?? null,
      paused_at: match.pausedAt ?? null,
      elapsed_seconds: match.elapsedSeconds ?? null,
      result: match.result ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("usk_matches").upsert(rows, { onConflict: "id" });
    if (error) {
      throw Object.assign(new Error(error.message), {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }
  }
  remoteMatches = matches.map((match) => ({ ...match }));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(matchesUpdatedEvent));
}
export function useMatches() {
  const [matches, setMatches] = useState<Match[]>(getMatches);
  useEffect(() => {
    matchesLoading = matchesLoading || loadRemoteMatches();
    matchesLoading.then(() => setMatches(getMatches()));
    const sync = () => setMatches(getMatches());
    window.addEventListener(matchesUpdatedEvent, sync);
    const channel = supabase
      ?.channel("usk-matches-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "usk_matches" }, (payload) => {
        if (payload.eventType === "DELETE") {
          remoteMatches = remoteMatches.filter((match) => match.id !== String(payload.old.id));
        } else if (payload.new) {
          const next = fromRow(payload.new as Record<string, unknown>);
          const existing = remoteMatches.find((match) => match.id === next.id);
          remoteMatches = existing
            ? remoteMatches.map((match) => (match.id === next.id ? { ...match, ...next } : match))
            : [...remoteMatches, next];
        }
        remoteMatches = [...remoteMatches].sort((a, b) => a.date.localeCompare(b.date));
        sync();
      })
      .subscribe();
    return () => {
      window.removeEventListener(matchesUpdatedEvent, sync);
      if (channel) void supabase?.removeChannel(channel);
    };
  }, []);
  return matches;
}
export function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
export function matchResult(match: Match): MatchResult {
  if (match.result && match.result !== "N/A") return match.result;
  if (match.scoreFor === undefined || match.scoreAgainst === undefined) return "N/A";
  return match.scoreFor > match.scoreAgainst
    ? "V"
    : match.scoreFor < match.scoreAgainst
      ? "D"
      : "N";
}
export function createMatchId() {
  return `m-${Date.now()}`;
}
export function normalizeMatch(form: Omit<Match, "id">): Omit<Match, "id"> {
  if (form.status !== "finished") {
    const {
      scoreFor: _scoreFor,
      scoreAgainst: _scoreAgainst,
      result: _result,
      ...withoutScore
    } = form;
    return withoutScore;
  }
  const scoreFor = Number.isFinite(form.scoreFor) ? form.scoreFor : undefined;
  const scoreAgainst = Number.isFinite(form.scoreAgainst) ? form.scoreAgainst : undefined;
  return {
    ...form,
    scoreFor,
    scoreAgainst,
    result:
      scoreFor === undefined || scoreAgainst === undefined
        ? "N/A"
        : scoreFor > scoreAgainst
          ? "V"
          : scoreFor < scoreAgainst
            ? "D"
            : "N",
  };
}

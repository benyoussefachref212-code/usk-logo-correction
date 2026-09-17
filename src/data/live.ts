import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type LiveEvent = {
  id: string;
  minute: number;
  kind: "goal" | "yellow" | "red" | "sub" | "info";
  team: "USK" | "ADVERSAIRE";
  text: string;
};

export type LiveState = {
  matchId: string;
  minute: number;
  phase: "first" | "half-time" | "second" | "finished";
  homeScore: number;
  awayScore: number;
  events: LiveEvent[];
};

export const defaultLiveState: LiveState = {
  matchId: "",
  minute: 0,
  phase: "first",
  homeScore: 0,
  awayScore: 0,
  events: [],
};

const liveUpdatedEvent = "usk-live-updated";
let remoteLiveState: LiveState = defaultLiveState;
let loading: Promise<void> | null = null;
// The optional live-state table is not part of the deployed schema, so keep live state local until it exists.
let liveStateTableAvailable = false;

function isMissingLiveStateTable(error: { code?: string; message?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01" || error?.message?.includes("usk_live_states");
}

function fromRow(row: Record<string, unknown>): LiveState {
  return {
    matchId: String(row["match_id"]),
    minute: Number(row["minute"] ?? 0),
    phase: row["phase"] as LiveState["phase"],
    homeScore: Number(row["home_score"] ?? 0),
    awayScore: Number(row["away_score"] ?? 0),
    events: Array.isArray(row["events"]) ? (row["events"] as LiveEvent[]) : [],
  };
}

export function getLiveState() {
  return { ...remoteLiveState, events: [...remoteLiveState.events] };
}

export async function loadLiveState(matchId?: string) {
  if (!supabase || !liveStateTableAvailable) return getLiveState();
  const query = supabase
    .from("usk_live_states")
    .select("*")
    .eq("match_id", matchId || remoteLiveState.matchId)
    .order("updated_at", { ascending: false })
    .limit(1);
  const { data, error } = await query;
  if (isMissingLiveStateTable(error)) liveStateTableAvailable = false;
  if (!error && data?.[0]) remoteLiveState = fromRow(data[0]);
  if (matchId && remoteLiveState.matchId !== matchId) remoteLiveState = { ...remoteLiveState, matchId };
  return getLiveState();
}

export async function saveLiveState(state: LiveState) {
  remoteLiveState = { ...state, events: [...state.events] };
  if (supabase && liveStateTableAvailable && state.matchId) {
    const { error } = await supabase.from("usk_live_states").upsert({
      id: `live-${state.matchId}`,
      match_id: state.matchId,
      minute: state.minute,
      phase: state.phase,
      home_score: state.homeScore,
      away_score: state.awayScore,
      events: state.events,
      updated_at: new Date().toISOString(),
    });
    if (isMissingLiveStateTable(error)) liveStateTableAvailable = false;
    else if (error) throw error;
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(liveUpdatedEvent));
}

export function useLiveState() {
  const [state, setState] = useState(getLiveState);
  useEffect(() => {
    loading = loading || loadLiveState().then(() => undefined);
    loading.then(() => setState(getLiveState()));
    const sync = () => setState(getLiveState());
    window.addEventListener(liveUpdatedEvent, sync);
    return () => window.removeEventListener(liveUpdatedEvent, sync);
  }, []);
  return state;
}

export async function refreshLiveState() {
  await loadLiveState();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(liveUpdatedEvent));
  return getLiveState();
}

export const liveStateUpdatedEvent = liveUpdatedEvent;

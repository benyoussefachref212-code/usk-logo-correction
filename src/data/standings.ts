import { useEffect, useState } from "react";
import { getMatches, type Match } from "./matches";
import { getTeams, type Team } from "./teams";

export type StandingForm = "V" | "N" | "D";
export type StandingTeam = {
  id: string;
  teamId?: string;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: StandingForm[];
};

const key = "usk-standings-v1";
const eventName = "usk-standings-updated";
const defaults: StandingTeam[] = [
  {
    id: "sahel",
    team: "ES Sahel",
    played: 18,
    wins: 13,
    draws: 3,
    losses: 2,
    goalsFor: 35,
    goalsAgainst: 14,
    form: ["V", "V", "N", "V", "V"],
  },
  {
    id: "usk",
    team: "USK Kelibia",
    played: 18,
    wins: 11,
    draws: 5,
    losses: 2,
    goalsFor: 31,
    goalsAgainst: 16,
    form: ["V", "N", "V", "V", "V"],
  },
  {
    id: "sfaxien",
    team: "CS Sfaxien",
    played: 18,
    wins: 10,
    draws: 5,
    losses: 3,
    goalsFor: 28,
    goalsAgainst: 17,
    form: ["N", "V", "D", "V", "V"],
  },
  {
    id: "marsa",
    team: "AS Marsa",
    played: 18,
    wins: 9,
    draws: 6,
    losses: 3,
    goalsFor: 26,
    goalsAgainst: 18,
    form: ["V", "D", "V", "N", "V"],
  },
  {
    id: "korba",
    team: "JS Korba",
    played: 18,
    wins: 8,
    draws: 5,
    losses: 5,
    goalsFor: 24,
    goalsAgainst: 20,
    form: ["D", "V", "N", "D", "V"],
  },
  {
    id: "hammamet",
    team: "ES Hammamet",
    played: 18,
    wins: 6,
    draws: 7,
    losses: 5,
    goalsFor: 20,
    goalsAgainst: 21,
    form: ["N", "D", "V", "D", "N"],
  },
];

const legacyTeamIds: Record<string, string> = {
  "USK Kelibia": "usk",
  "ES Sahel": "ssz",
  "CS Sfaxien": "csmb",
  "AS Marsa": "usc",
  "ES Hammamet": "vsma",
};

function normalizeSeasonLabel(value: string) {
  const match = value.match(/(\d{4})\s*[\/\-–]\s*(\d{4})/);
  return match ? `${match[1]} / ${match[2]}` : value.trim();
}

function teamIdFor(match: Match, side: "home" | "away", teams: Team[]) {
  if (side === "home" && match.homeTeamId) return match.homeTeamId;
  if (side === "away" && match.opponentTeamId) return match.opponentTeamId;
  if (side === "home" && match.home) return "usk";
  if (side === "away" && !match.home) return "usk";

  const needle = match.opponent.trim().toLocaleLowerCase("fr-FR");
  const opponent = teams.find(
    (team) =>
      [team.id, team.abbreviation, team.name].some(
        (value) => value.trim().toLocaleLowerCase("fr-FR") === needle,
      ),
  );
  return opponent?.id;
}

function matchSeason(match: Match) {
  const season = match.competition
    .split(" · ")
    .find((part) => /^\d{4}\s*[\/\-–]\s*\d{4}$/.test(part.trim()));
  return normalizeSeasonLabel(season?.trim() || "2025 / 2026");
}

export function calculateStandingsFromMatches(
  teams: Team[],
  matches: Match[],
  season?: string,
): StandingTeam[] {
  const rows = new Map<string, StandingTeam>();
  teams.forEach((team) => {
    rows.set(team.id, {
      id: team.id,
      teamId: team.id,
      team: team.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      form: [],
    });
  });

  matches
    .filter(
      (match) =>
        match.status === "finished" &&
        (!season || matchSeason(match) === normalizeSeasonLabel(season)),
    )
    .forEach((match) => {
      const homeId = teamIdFor(match, "home", teams);
      const awayId = teamIdFor(match, "away", teams);
      const home = homeId && rows.get(homeId);
      const away = awayId && rows.get(awayId);
      if (!home || !away || home.id === away.id) return;
      const scoreFor = Number.isFinite(match.scoreFor) ? match.scoreFor! : 0;
      const scoreAgainst = Number.isFinite(match.scoreAgainst) ? match.scoreAgainst! : 0;
      const homeGoals = match.home ? scoreFor : scoreAgainst;
      const awayGoals = match.home ? scoreAgainst : scoreFor;
      const homeForm: StandingForm =
        homeGoals > awayGoals ? "V" : homeGoals < awayGoals ? "D" : "N";
      const awayForm: StandingForm = homeForm === "V" ? "D" : homeForm === "D" ? "V" : "N";
      home.played += 1;
      away.played += 1;
      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;
      if (homeForm === "V") home.wins += 1;
      else if (homeForm === "D") home.losses += 1;
      else home.draws += 1;
      if (awayForm === "V") away.wins += 1;
      else if (awayForm === "D") away.losses += 1;
      else away.draws += 1;
      home.form = [...home.form, homeForm].slice(-5);
      away.form = [...away.form, awayForm].slice(-5);
    });

  return sortStandings([...rows.values()]);
}

export function getStandings(): StandingTeam[] {
  if (typeof window === "undefined") return defaults;
  const matches = getMatches();
  if (
    matches.some(
      (match) =>
        match.status === "finished" &&
        Number.isFinite(match.scoreFor) &&
        Number.isFinite(match.scoreAgainst),
    )
  ) {
    return calculateStandingsFromMatches(getTeams(), matches);
  }
  try {
    const stored = window.localStorage.getItem(key);
    const rows = stored ? JSON.parse(stored) : defaults;
    return Array.isArray(rows)
      ? rows.map((row) => ({ ...row, teamId: row.teamId || legacyTeamIds[row.team] }))
      : defaults;
  } catch {
    return defaults;
  }
}

export function saveStandings(teams: StandingTeam[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(teams));
  window.dispatchEvent(new Event(eventName));
}

export function sortStandings(teams: StandingTeam[]) {
  return [...teams].sort(
    (a, b) =>
      points(b) - points(a) || goalDifference(b) - goalDifference(a) || b.goalsFor - a.goalsFor,
  );
}

export function points(team: StandingTeam) {
  return team.wins * 3 + team.draws;
}
export function goalDifference(team: StandingTeam) {
  return team.goalsFor - team.goalsAgainst;
}
export function useStandings() {
  const [teams, setTeams] = useState(getStandings);
  useEffect(() => {
    const sync = () => setTeams(getStandings());
    window.addEventListener(eventName, sync);
    window.addEventListener("usk-matches-updated", sync);
    window.addEventListener("usk-teams-updated", sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener("usk-matches-updated", sync);
      window.removeEventListener("usk-teams-updated", sync);
    };
  }, []);
  return sortStandings(teams);
}

export { defaults as defaultStandings };

import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getVirtualKit, useTeams, type Team } from "../data/teams";
import { useKits } from "../data/kits";
import {
  calculateStandingsFromMatches,
  defaultStandings,
  points,
  saveStandings,
  sortStandings,
  useStandings,
  type StandingTeam,
} from "../data/standings";
import { useMatches } from "../data/matches";
import "../usk.css";
import { TeamLogo } from "../components/TeamLogo";

const emptyTeam: Omit<StandingTeam, "id"> = {
  team: "",
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  form: [],
};

const DEFAULT_SEASON = "2026 / 2027";
const SEASON_STORAGE_KEY = "usk-admin-selected-season";
const DEFAULT_POULE = "1";
const POULE_STORAGE_KEY = "usk-standings-poule";
const DEFAULT_COMPETITION = "CHAMPIONNAT RÉGIONAL";
const COMPETITION_STORAGE_KEY = "usk-standings-competition";

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLocaleLowerCase("fr-FR")
    .trim();
}

function normalizeSeason(value: string) {
  const match = value.match(/(\d{4})\s*[\/\-–]\s*(\d{4})/);
  return match ? `${match[1]} / ${match[2]}` : value.trim();
}

function TeamStandingsVisual({
  team,
  kitImage,
}: {
  team: Team;
  kitImage?: string | null | undefined;
}) {
  const virtualKit = getVirtualKit(team);
  const logo = team.logo || virtualKit.logo;
  return (
    <div className="reference-club-visual" aria-hidden="true">
      <div className="reference-club-crest">
        {logo ? <TeamLogo src={logo} name={team.name} abbreviation={team.abbreviation} alt="" /> : <b>{team.abbreviation}</b>}
      </div>
      {kitImage ? (
        <img className="reference-club-kit-image" src={kitImage} alt="" />
      ) : (
        <div
          className={`virtual-shirt-preview reference-club-kit pattern-${virtualKit.pattern}`}
          style={
            {
              "--kit-primary": team.colors,
              "--kit-accent": team.accent,
              "--kit-scale": `${virtualKit.patternScale}px`,
              "--kit-angle": `${virtualKit.patternAngle}deg`,
            } as React.CSSProperties
          }
        >
          {logo ? <TeamLogo src={logo} name={team.name} abbreviation={team.abbreviation} alt="" /> : <b>{team.abbreviation}</b>}
        </div>
      )}
    </div>
  );
}

function AdminClassementPage() {
  const leagueTeams = useTeams();
  const matches = useMatches();
  const kits = useKits();

  // Le classement est calculé uniquement à partir des matchs terminés de la saison choisie.
  const [season, setSeason] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return normalizeSeason(localStorage.getItem(SEASON_STORAGE_KEY) || DEFAULT_SEASON) || DEFAULT_SEASON;
    }
    return DEFAULT_SEASON;
  });
  const [seasonInput, setSeasonInput] = useState<string>(season);
  const standings = useMemo(
    () => calculateStandingsFromMatches(leagueTeams, matches, season),
    [leagueTeams, matches, season],
  );
  const teams = sortStandings(
    leagueTeams.map((team) => {
      const standing = standings.find((row) => row.teamId === team.id || row.id === team.id);
      return (
        standing || {
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
        }
      );
    }),
  );

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<StandingTeam | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<Omit<StandingTeam, "id">>(emptyTeam);

  const [poule, setPoule] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(POULE_STORAGE_KEY) || DEFAULT_POULE;
    }
    return DEFAULT_POULE;
  });
  const [pouleInput, setPouleInput] = useState<string>(poule);
  const [competition, setCompetition] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(COMPETITION_STORAGE_KEY) || DEFAULT_COMPETITION;
    }
    return DEFAULT_COMPETITION;
  });
  const [competitionInput, setCompetitionInput] = useState<string>(competition);

  const commitSeason = () => {
    const value = normalizeSeason(seasonInput) || DEFAULT_SEASON;
    setSeason(value);
    setSeasonInput(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(SEASON_STORAGE_KEY, value);
    }
  };

  const commitPoule = () => {
    const value = pouleInput.replace(/[^0-9]/g, "") || DEFAULT_POULE;
    setPoule(value);
    setPouleInput(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(POULE_STORAGE_KEY, value);
    }
  };

  const commitCompetition = () => {
    const value = competitionInput.trim() || DEFAULT_COMPETITION;
    setCompetition(value);
    setCompetitionInput(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(COMPETITION_STORAGE_KEY, value);
    }
  };

  const visible = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    return teams.filter((team) => normalizeSearchText(team.team).includes(normalizedQuery));
  }, [teams, query]);

  const open = (team?: StandingTeam) => {
    setEditing(team || null);
    setForm(team ? { ...team } : { ...emptyTeam });
    setEditorOpen(true);
  };
  const close = () => {
    setEditing(null);
    setEditorOpen(false);
  };
  const update = (field: keyof typeof emptyTeam, value: string) =>
    setForm((current) => ({ ...current, [field]: field === "team" ? value : Number(value) }));
  const save = () => {
    if (!form.team.trim()) return;
    const item = {
      ...form,
      team: form.team.trim(),
      id: editing?.id || `team-${Date.now()}`,
    } as StandingTeam;
    saveStandings(
      sortStandings(
        editing ? teams.map((team) => (team.id === editing.id ? item : team)) : [...teams, item],
      ),
    );
    close();
  };
  const remove = (id: string) => saveStandings(teams.filter((team) => team.id !== id));
  const reset = () => saveStandings(defaultStandings);

  // L'ordre du tableau suit le classement calculé, pas l'ordre du catalogue des équipes.
  const referenceRows = teams
    .map((standing) => {
    const team = leagueTeams.find((item) => item.id === (standing.teamId || standing.id));
    if (!team) return null;
    return {
      id: team.id,
      club: team,
      standing,
      abbreviation: team.abbreviation || standing?.team?.split(" ")[0] || team.id.toUpperCase(),
      // On utilise le nom arabe complet de l'équipe (comme USK)
      name: team.name || standing?.team || team.id,
    };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <section className="reference-standings-page">
      <div className="reference-standings-header">
        <div>
          <input
            className="reference-standings-kicker reference-standings-kicker-input"
            value={competitionInput}
            onChange={(event) => setCompetitionInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitCompetition();
              }
            }}
            onBlur={commitCompetition}
            aria-label="Nom du championnat"
          />
          <h1>
            Classement général <b>– POULE </b>
            <input
              className="reference-standings-season-input reference-standings-poule-input"
              type="number"
              min="1"
              value={pouleInput}
              onChange={(event) => setPouleInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitPoule();
                }
              }}
              onBlur={commitPoule}
              aria-label="Numéro de la poule"
            />
          </h1>
          <p className="reference-standings-season-line">
            <span>Classement général – Saison</span>
            <input
              className="reference-standings-season-input"
              value={seasonInput}
              onChange={(event) => setSeasonInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitSeason();
                }
              }}
              onBlur={commitSeason}
              placeholder="2025/2026"
              aria-label="Saison"
            />
          </p>
        </div>
        <label className="reference-standings-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une équipe"
          />
        </label>
      </div>
      <div className="reference-standings-panel">
        <div className="reference-standings-table-wrap">
          <div className="reference-standings-table reference-standings-head">
            <span>#</span>
            <span>CLUB</span>
            <span>J</span>
            <span>G</span>
            <span>N</span>
            <span>P</span>
            <span>BP</span>
            <span>BC</span>
            <span>DIFF</span>
            <span>PTS</span>
            <span>FORME</span>
          </div>
          {referenceRows
            .filter((row) => {
              const normalizedQuery = normalizeSearchText(query);
              return [row.name, row.abbreviation, row.club.city, row.club.stadium].some((value) =>
                normalizeSearchText(value).includes(normalizedQuery),
              );
            })
            .map((row, index) => {
              const stats = row.standing || {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                form: [],
              };
              const diff = stats.goalsFor - stats.goalsAgainst;
              return (
                <div
                  className={`reference-standings-table reference-standings-row zone-${
                    index === 0
                      ? "green"
                      : index === referenceRows.length - 1
                        ? "red"
                        : index === referenceRows.length - 2
                          ? "orange"
                          : "blue"
                  }${row.id === "usk" ? " is-usk" : ""}`}
                  key={row.id}
                >
                  <strong>{index + 1}</strong>
                  <div className="reference-club-cell">
                    <TeamStandingsVisual
                      team={row.club}
                      kitImage={
                        row.club.id === "usk"
                          ? kits.find((kit) => kit.slot === "home")?.image || null
                          : null
                      }
                    />
                    <div className="reference-club-copy">
                      <b>{row.abbreviation}</b>
                      <span dir="rtl" lang="ar">
                        {row.name}
                      </span>
                    </div>
                  </div>
                  <span>{stats.played}</span>
                  <span>{stats.wins}</span>
                  <span>{stats.draws}</span>
                  <span>{stats.losses}</span>
                  <span>{stats.goalsFor}</span>
                  <span>{stats.goalsAgainst}</span>
                  <span>
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </span>
                  <strong>{points(stats as StandingTeam)}</strong>
                  <div className="reference-form-dots">
                    {[...Array(3)].map((_, dot) => (
                      <i
                        key={dot}
                        className={
                          stats.form[dot] === "V"
                            ? "win"
                            : stats.form[dot] === "D"
                              ? "loss"
                              : "draw"
                        }
                      >
                        {stats.form[dot] || "—"}
                      </i>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
        <div className="reference-standings-legend">
          <span>
            <i className="legend-green" />
            Qualification
          </span>
          <span>
            <i className="legend-blue" />
            Milieu de tableau
          </span>
          <span>
            <i className="legend-orange" />
            Barrage
          </span>
          <span>
            <i className="legend-red" />
            Zone de relégation
          </span>
          <small>
            J : Joués &nbsp;|&nbsp; G : Victoires &nbsp;|&nbsp; N : Nuls &nbsp;|&nbsp; P : Défaites
            &nbsp;|&nbsp; BP : Buts pour &nbsp;|&nbsp; BC : Buts contre &nbsp;|&nbsp; DIFF :
            Différence &nbsp;|&nbsp; PTS : Points
          </small>
        </div>
      </div>
    </section>
  );
}

export const Route = createFileRoute("/admin/classement")({
  component: AdminClassementPage,
  head: () => ({ meta: [{ title: "Classement — Administration — USK" }] }),
});

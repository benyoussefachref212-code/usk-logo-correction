import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getTeamById, officialTeams, useTeams } from "../data/teams";
import {
  defaultStandings,
  goalDifference,
  points,
  saveStandings,
  sortStandings,
  useStandings,
  type StandingTeam,
} from "../data/standings";
import "../usk.css";

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
function AdminClassementPage() {
  const standings = useStandings();
  const leagueTeams = useTeams();
  const teams = sortStandings(leagueTeams.map((team) => {
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
  }));
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<StandingTeam | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<Omit<StandingTeam, "id">>(emptyTeam);
  const visible = useMemo(
    () => teams.filter((team) => team.team.toLowerCase().includes(query.toLowerCase())),
    [teams, query],
  );
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
  const referenceOrder = ["usc", "ssz", "usdj", "usk", "gs", "csmb", "vsma", "fsrd", "cfmt", "jsm", "asmo", "asoe", "asmh", "samb"];
  const referenceRows = referenceOrder.map((id) => {
    const club = getTeamById(leagueTeams, id) || getTeamById(officialTeams, id);
    const standing = teams.find((row) => row.teamId === id || row.id === id);
    return {
      id,
      club,
      standing,
      abbreviation: club?.abbreviation || standing?.team?.split(" ")[0] || id.toUpperCase(),
      name: club?.name || standing?.team || id,
    };
  });

  return (
    <section className="reference-standings-page">
      <div className="reference-standings-header">
        <div>
          <span className="reference-standings-kicker">CHAMPIONNAT RÉGIONAL</span>
          <h1>Classement général <b>– POULE 1</b></h1>
          <p>Classement général – Saison 2025/2026</p>
        </div>
        <label className="reference-standings-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une équipe" /></label>
      </div>
      <div className="reference-standings-panel">
        <div className="reference-standings-table-wrap">
          <div className="reference-standings-table reference-standings-head"><span>#</span><span>CLUB</span><span>J</span><span>G</span><span>N</span><span>P</span><span>BP</span><span>BC</span><span>DIFF</span><span>PTS</span><span>FORME</span></div>
          {referenceRows.filter((row) => row.name.toLowerCase().includes(query.toLowerCase())).map((row, index) => {
            const stats = row.standing || { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, form: [] };
            const diff = stats.goalsFor - stats.goalsAgainst;
            return <div className={`reference-standings-table reference-standings-row zone-${index < 4 ? "green" : index < 8 ? "blue" : "red"}${row.id === "usk" ? " is-usk" : ""}`} key={row.id}>
              <strong>{index + 1}</strong>
              <div className="reference-club-cell">{row.club?.logo ? <img src={row.club.logo} alt={`${row.abbreviation} logo`} /> : null}<div className="reference-club-copy"><b>{row.abbreviation}</b><span dir="rtl" lang="ar">{row.name}</span></div></div>
              <span>{stats.played}</span><span>{stats.wins}</span><span>{stats.draws}</span><span>{stats.losses}</span><span>{stats.goalsFor}</span><span>{stats.goalsAgainst}</span><span>{diff > 0 ? "+" : ""}{diff}</span><strong>{points(stats as StandingTeam)}</strong>
              <div className="reference-form-dots">{[...Array(3)].map((_, dot) => <i key={dot} className={stats.form[dot] === "V" ? "win" : stats.form[dot] === "D" ? "loss" : "draw"}>{stats.form[dot] || "—"}</i>)}</div>
            </div>;
          })}
        </div>
        <div className="reference-standings-legend"><span><i className="legend-green" />Qualification</span><span><i className="legend-blue" />Milieu de tableau</span><span><i className="legend-red" />Zone de relégation</span><small>J : Joués &nbsp;|&nbsp; G : Victoires &nbsp;|&nbsp; N : Nuls &nbsp;|&nbsp; P : Défaites &nbsp;|&nbsp; BP : Buts pour &nbsp;|&nbsp; BC : Buts contre &nbsp;|&nbsp; DIFF : Différence &nbsp;|&nbsp; PTS : Points</small></div>
      </div>

    </section>
  );
}
export const Route = createFileRoute("/admin/classement")({
  component: AdminClassementPage,
  head: () => ({ meta: [{ title: "Classement — Administration — USK" }] }),
});

import { createFileRoute } from "@tanstack/react-router";
import { Check, Trophy } from "lucide-react";
import { useStandings, points, goalDifference } from "../data/standings";
import { getTeamById, useTeams } from "../data/teams";
import { PublicShell } from "../components/PublicShell";
import "../usk.css";

export const Route = createFileRoute("/classement")({
  component: ClassementPage,
  head: () => ({
    meta: [
      { title: "Classement — USK" },
      { name: "description", content: "Le classement du championnat de l’USK." },
    ],
  }),
});
function ClassementPage() {
  const rows = useStandings();
  const teams = useTeams();
  const usk = rows.find((row) => row.id === "usk") || rows[0];
  const uskIndex = Math.max(
    0,
    rows.findIndex((row) => row.id === "usk"),
  );
  return (
    <PublicShell
      kicker="CHAMPIONNAT"
      title="Classement"
      description="La position de l’USK au classement du championnat, mise à jour après chaque journée."
      icon={Trophy}
    >
      <div className="public-board">
        <div className="board-toolbar">
          <div>
            <strong>Ligue Nationale · 2024 / 25</strong>
            <span>Après la 18e journée</span>
          </div>
          <span className="usk-position">
            {uskIndex + 1}e · {points(usk)} points
          </span>
        </div>
        <div className="full-standings">
          <div className="full-standing-head">
            <span>#</span>
            <span>Équipe</span>
            <span>J</span>
            <span>Diff.</span>
            <span>Pts</span>
            <span>Forme</span>
          </div>
          {rows.map((row, index) => (
            <div className={`full-standing-row ${row.id === "usk" ? "is-usk" : ""}`} key={row.id}>
              <span className="standing-rank">{index + 1}</span>
              <strong>{getTeamById(teams, row.teamId)?.name || row.team}</strong>
              <span>{row.played}</span>
              <span>
                {goalDifference(row) > 0 ? "+" : ""}
                {goalDifference(row)}
              </span>
              <b>{points(row)}</b>
              <span className="form-dots">
                {row.form.map((form, i) => (
                  <i className={`form-${form}`} key={`${row.id}-${i}`}>
                    {form}
                  </i>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="board-note">
          <Check size={18} />
          <span>
            <strong>L’USK est actuellement {uskIndex + 1}e.</strong> Chaque match compte pour
            poursuivre la course en tête.
          </span>
        </div>
      </div>
    </PublicShell>
  );
}
export default ClassementPage;

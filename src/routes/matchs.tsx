import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { getMatches, formatMatchDate, matchResult, type Match } from "../data/matches";
import { getTeamById, useTeams } from "../data/teams";
import { useLiveState, type LiveState } from "../data/live";
import { PublicShell } from "../components/PublicShell";
import { UskLogo } from "../components/UskLogo";
import "../usk.css";

const formatTime = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60).toString().padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
const matchElapsed = (match: Match) => {
  const base = match.elapsedSeconds ?? 0;
  return base + (match.status === "live" && match.startedAt && !match.pausedAt
    ? Math.max(0, Math.floor((Date.now() - Date.parse(match.startedAt)) / 1000))
    : 0);
};
export const Route = createFileRoute("/matchs")({
  component: MatchsPage,
  head: () => ({ meta: [{ title: "Matchs — USK Union Sportive de Kelibia" }] }),
});
function UskCrest({ team }: { team?: ReturnType<typeof useTeams>[number] }) {
  return team?.logo ? (
    <img className="crest crest-small" src={team.logo} alt={`Logo ${team.name}`} />
  ) : (
    <UskLogo />
  );
}
function AwayCrest({ match, team }: { match: Match; team?: ReturnType<typeof useTeams>[number] }) {
  const logo = team?.logo || match.opponentLogo;
  return logo ? (
    <img className="crest crest-small" src={logo} alt={team?.name || match.opponent} />
  ) : (
    <div
      className="away-crest"
      style={
        team ? { background: `linear-gradient(135deg, ${team.colors}, ${team.accent})` } : undefined
      }
    >
      {team?.abbreviation || match.opponentShort}
    </div>
  );
}
function MatchRow({ match, liveState }: { match: Match; liveState: LiveState }) {
  const teams = useTeams();
  const homeTeam = getTeamById(teams, match.homeTeamId) || getTeamById(teams, "usk");
  const awayTeam = getTeamById(teams, match.opponentTeamId);
  const result = matchResult(match);
  const isLive = match.status === "live";
  return (
    <div className="fixture-row">
      {match.status === "finished" && (
        <span className={`outcome-badge outcome-${result}`}>{result}</span>
      )}
      <div className="upcoming-date">
        <strong>{new Date(`${match.date}T12:00:00`).getDate()}</strong>
        <span>
          {new Intl.DateTimeFormat("fr-FR", { month: "short" })
            .format(new Date(`${match.date}T12:00:00`))
            .toUpperCase()}
        </span>
      </div>
      <div className="fixture-opp">
        {match.home ? <UskCrest team={homeTeam} /> : <AwayCrest match={match} team={awayTeam} />}
        <div className="fixture-opp-copy">
          <strong>
            {match.home
              ? `${homeTeam?.abbreviation || "USK"} — ${awayTeam?.abbreviation || match.opponentShort}`
              : `${awayTeam?.abbreviation || match.opponentShort} — ${homeTeam?.abbreviation || "USK"}`}
          </strong>
          <span>
            {match.competition} · {formatMatchDate(match.date)}
          </span>
        </div>
      </div>
      <div className="fixture-meta">
        <span className={`venue-tag ${match.home ? "venue-home" : "venue-away"}`}>
          <MapPin size={11} />
          {match.home ? "Domicile" : "Extérieur"}
        </span>
        {match.status === "upcoming" ? (
          <time>
            <Clock3 size={12} />
            {match.time}
          </time>
        ) : match.status === "live" ? (
          <span className="result-final-score">
            {isLive
              ? `${match.scoreFor ?? 0} – ${match.scoreAgainst ?? 0}`
              : "–"}
          </span>
        ) : (
          <span className="result-final-score">
            {match.home
              ? `${match.scoreFor} – ${match.scoreAgainst}`
              : `${match.scoreAgainst} – ${match.scoreFor}`}
          </span>
        )}
        <span
          className={`status ${match.status === "upcoming" ? "status-upcoming" : match.status === "live" ? "status-live" : `outcome-text-${result}`}`}
        >
          {match.status === "upcoming"
            ? "À venir"
            : match.status === "live"
              ? isLive
                ? `${formatTime(matchElapsed(match))}`
                : "En direct"
              : result === "V"
                ? "Victoire"
                : result === "D"
                  ? "Défaite"
                  : "Nul"}
        </span>
      </div>
    </div>
  );
}
function MatchsPage() {
  const teams = useTeams();
  const liveState = useLiveState();
  const [matches, setMatches] = useState<Match[]>(() => getMatches());
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setClockTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const refresh = () => setMatches(getMatches());
    window.addEventListener("usk-matches-updated", refresh);
    return () => window.removeEventListener("usk-matches-updated", refresh);
  }, []);
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished");
  const next = live[0] || upcoming[0];
  const nextHomeTeam = next && (getTeamById(teams, next.homeTeamId) || getTeamById(teams, "usk"));
  const nextAwayTeam = next && getTeamById(teams, next.opponentTeamId);
  return (
    <PublicShell
      kicker="CALENDRIER & RÉSULTATS"
      title="Matchs"
      description="Tous les matchs de l’USK : championnat, coupe et rencontres amicales, à domicile comme à l’extérieur."
      icon={CalendarDays}
    >
      {next && (
        <div className="next-match-hero">
          <div className="next-match-hero-head">
            <span className="section-kicker">
              {next.status === "live" ? "MATCH EN DIRECT" : "PROCHAIN MATCH"}
            </span>
            <span className={`venue-pill ${next.home ? "venue-home" : "venue-away"}`}>
              <MapPin size={12} />
              {next.home ? "DOMICILE" : "EXTÉRIEUR"}
            </span>
          </div>
          <div className="next-match-comp">{next.competition}</div>
          <div className="next-match-teams">
            <div className="next-match-team">
              <UskCrest team={nextHomeTeam} />
              <strong>{nextHomeTeam?.abbreviation || "USK"}</strong>
              <span>{nextHomeTeam?.city || "Kelibia"}</span>
            </div>
            <div className="next-match-vs">{next.status === "live" ? `${next.scoreFor ?? 0} - ${next.scoreAgainst ?? 0}` : next.status === "live" ? "LIVE" : "VS"}</div>
            <div className="next-match-team">
              <AwayCrest match={next} team={nextAwayTeam} />
              <strong>{nextAwayTeam?.abbreviation || next.opponentShort}</strong>
              <span>{nextAwayTeam?.city || next.opponent}</span>
            </div>
          </div>
          <div className="next-match-meta">
            <span>
              <CalendarDays size={14} />
              {formatMatchDate(next.date)}
            </span>
            <span>
              <Clock3 size={14} />
              {next.status === "live" ? `${formatTime(matchElapsed(match))}` : next.status === "live" ? "Match en cours" : `Coup d’envoi ${next.time}`}
            </span>
            <span>
              <MapPin size={14} />
              {next.stadium}
            </span>
          </div>
          <Link to="/match-center" className="button button-red next-match-btn">
            Détails du match <ArrowRight size={16} />
          </Link>
        </div>
      )}
      {live.length > 0 && (
        <>
          <div className="section-heading fixtures-heading">
            <div>
              <span className="section-kicker">LIVE</span>
              <h2>En direct</h2>
            </div>
          </div>
          <div className="panel-block fixtures-list">
            {live.map((m) => (
              <MatchRow match={m} key={m.id} liveState={liveState} />
            ))}
          </div>
        </>
      )}
      {
        <div className="section-heading fixtures-heading">
          <div>
            <span className="section-kicker">À VENIR</span>
            <h2>Prochains matchs</h2>
          </div>
        </div>
      }
      <div className="panel-block fixtures-list">
        {upcoming.map((m) => (
          <MatchRow match={m} key={m.id} liveState={liveState} />
        ))}
      </div>
      <div className="section-heading fixtures-heading">
        <div>
          <span className="section-kicker">RÉSULTATS</span>
          <h2>Derniers résultats</h2>
        </div>
      </div>
      <div className="panel-block fixtures-list">
        {finished.map((m) => (
          <MatchRow match={m} key={m.id} liveState={liveState} />
        ))}
      </div>
    </PublicShell>
  );
}

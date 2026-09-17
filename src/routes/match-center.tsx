import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpDown,
  CalendarDays,
  Clock3,
  Flag,
  MapPin,
  Radio,
  Shirt,
  Square,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getMatches } from "../data/matches";
import { getLiveState, refreshLiveState } from "../data/live";
import { PublicShell } from "../components/PublicShell";
import { UskLogo } from "../components/UskLogo";
import "../usk.css";

export const Route = createFileRoute("/match-center")({
  component: MatchCenterPage,
  head: () => ({
    meta: [
      { title: "Centre de match — USK Union Sportive de Kelibia" },
      {
        name: "description",
        content:
          "Suivez le match de l’Union Sportive de Kelibia : score en direct, compositions, événements et statistiques.",
      },
      { property: "og:title", content: "Centre de match — USK Union Sportive de Kelibia" },
      {
        property: "og:description",
        content: "Score, compositions, événements et statistiques du match de l’USK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type TabId = "apercu" | "composition" | "evenements" | "stats";

const tabs: { id: TabId; label: string }[] = [
  { id: "apercu", label: "Aperçu" },
  { id: "composition", label: "Composition" },
  { id: "evenements", label: "Événements" },
  { id: "stats", label: "Statistiques" },
];

const fallbackMatch = {
  competition: "Championnat · Journée 17",
  date: "Samedi 12 Avril 2025",
  time: "16:00",
  stadium: "Stade de Kelibia",
  status: "live" as "live" | "upcoming" | "finished",
  minute: "67'",
  home: { name: "USK", city: "Kelibia", score: 2 },
  away: { name: "EBT", city: "El Bathan", letters: "EB", score: 1 },
};

const homeXI = [
  { num: 1, name: "S. Ben Salah", pos: "Gardien" },
  { num: 4, name: "M. Trabelsi", pos: "Défenseur" },
  { num: 5, name: "K. Mansouri", pos: "Défenseur" },
  { num: 3, name: "A. Gharbi", pos: "Défenseur" },
  { num: 2, name: "Y. Hmidi", pos: "Défenseur" },
  { num: 8, name: "F. Ayari", pos: "Milieu" },
  { num: 6, name: "N. Bouzid", pos: "Milieu" },
  { num: 10, name: "H. Khelifi (C)", pos: "Milieu" },
  { num: 7, name: "I. Mbarek", pos: "Attaquant" },
  { num: 9, name: "O. Dridi", pos: "Attaquant" },
  { num: 11, name: "W. Jelassi", pos: "Attaquant" },
];

const homeSubs = [
  { num: 16, name: "R. Fkih", pos: "Gardien" },
  { num: 13, name: "B. Sassi", pos: "Défenseur" },
  { num: 14, name: "T. Ammar", pos: "Milieu" },
  { num: 17, name: "C. Ben Ali", pos: "Milieu" },
  { num: 19, name: "M. Saidi", pos: "Attaquant" },
];

const awayXI = [
  { num: 1, name: "L. Guediche", pos: "Gardien" },
  { num: 2, name: "S. Ayed", pos: "Défenseur" },
  { num: 5, name: "M. Kaabi", pos: "Défenseur" },
  { num: 6, name: "H. Romdhani", pos: "Défenseur" },
  { num: 3, name: "A. Slama", pos: "Défenseur" },
  { num: 8, name: "K. Zouari", pos: "Milieu" },
  { num: 10, name: "F. Nasri (C)", pos: "Milieu" },
  { num: 4, name: "I. Kacem", pos: "Milieu" },
  { num: 9, name: "D. Belhaj", pos: "Attaquant" },
  { num: 11, name: "G. Msakni", pos: "Attaquant" },
  { num: 7, name: "A. Jendoubi", pos: "Attaquant" },
];

const awaySubs = [
  { num: 30, name: "W. Ben Amor", pos: "Gardien" },
  { num: 15, name: "N. Gafsi", pos: "Défenseur" },
  { num: 20, name: "Y. Chaabeni", pos: "Milieu" },
  { num: 21, name: "S. Mhenni", pos: "Attaquant" },
  { num: 27, name: "M. Ferjani", pos: "Attaquant" },
];

type EventKind = "goal" | "yellow" | "red" | "sub" | "kickoff" | "halftime" | "fulltime";

const events: {
  minute: string;
  kind: EventKind;
  team?: "home" | "away";
  title: string;
  detail: string;
}[] = [
  {
    minute: "1'",
    kind: "kickoff",
    title: "Coup d’envoi",
    detail: "Le match débute au Stade de Kelibia.",
  },
  {
    minute: "12'",
    kind: "goal",
    team: "home",
    title: "BUUUT ! USK",
    detail: "O. Dridi ouvre le score d’une tête plongeante.",
  },
  {
    minute: "30'",
    kind: "yellow",
    team: "away",
    title: "Carton jaune",
    detail: "K. Zouari (EBT) averti pour une faute tactique.",
  },
  {
    minute: "44'",
    kind: "goal",
    team: "away",
    title: "But EBT",
    detail: "D. Belhaj égalise sur une frappe lointaine.",
  },
  {
    minute: "45'",
    kind: "halftime",
    title: "Mi-temps",
    detail: "Les équipes rentrent aux vestiaires sur le score de 1 – 1.",
  },
  {
    minute: "60'",
    kind: "sub",
    team: "home",
    title: "Remplacement USK",
    detail: "M. Saidi remplace W. Jelassi.",
  },
  {
    minute: "63'",
    kind: "goal",
    team: "home",
    title: "BUUUT ! USK",
    detail: "M. Saidi, tout juste entré, redonne l’avantage aux siens.",
  },
  {
    minute: "67'",
    kind: "yellow",
    team: "home",
    title: "Carton jaune",
    detail: "N. Bouzid (USK) écope d’un avertissement.",
  },
];

const statPlaceholders = [
  "Possession",
  "Tirs (cadrés)",
  "Corners",
  "Fautes",
  "Passes réussies",
  "Hors-jeu",
];

function EventIcon({ kind }: { kind: EventKind }) {
  if (kind === "goal") return <Trophy size={15} />;
  if (kind === "yellow" || kind === "red") return <Square size={13} fill="currentColor" />;
  if (kind === "sub") return <ArrowUpDown size={15} />;
  if (kind === "kickoff") return <Flag size={15} />;
  return <Clock3 size={15} />;
}

function LineupList({
  players,
  title,
}: {
  players: { num: number; name: string; pos: string }[];
  title: string;
}) {
  return (
    <div className="lineup-block">
      <span className="lineup-block-title">{title}</span>
      {players.map((p) => (
        <div className="lineup-row" key={p.num}>
          <span className="lineup-num">{p.num}</span>
          <strong>{p.name}</strong>
          <span className="lineup-pos">{p.pos}</span>
        </div>
      ))}
    </div>
  );
}

function MatchCenterPage() {
  const [tab, setTab] = useState<TabId>("apercu");
  const [live, setLive] = useState(getLiveState);
  const [matchData, setMatchData] = useState(fallbackMatch);
  useEffect(() => {
    const sync = () => {
      setLive(getLiveState());
      void refreshLiveState();
      const current = getMatches().find((item) => item.status === "live");
      if (current) setMatchData((value) => ({ ...value, competition: current.competition, stadium: current.stadium, home: { ...value.home, score: current.scoreFor ?? value.home.score }, away: { ...value.away, score: current.scoreAgainst ?? value.away.score } }));
    };
    window.addEventListener("usk-live-updated", sync); window.addEventListener("usk-matches-updated", sync); sync();
    return () => { window.removeEventListener("usk-live-updated", sync); window.removeEventListener("usk-matches-updated", sync); };
  }, []);
  const liveSeconds = live.minute ?? 0;
  const liveTimeStr = `${Math.floor(liveSeconds / 60).toString().padStart(2, "0")}:${(liveSeconds % 60).toString().padStart(2, "0")}`;
  const match = { ...matchData, minute: liveTimeStr, status: live.phase === "finished" ? "finished" as const : live.phase === "half-time" ? "upcoming" as const : "live" as const, home: { ...matchData.home, score: live.homeScore ?? matchData.home.score }, away: { ...matchData.away, score: live.awayScore ?? matchData.away.score } };

  return (
    <PublicShell
      kicker="CENTRE DE MATCH"
      title="USK — EBT"
      description="Score en direct, compositions, événements et statistiques de la rencontre."
      icon={Radio}
    >
      {/* MATCH HEADER */}
      <div className="next-match-hero mc-hero">
        <div className="next-match-hero-head">
          <span className="section-kicker">{match.competition}</span>
          {match.status === "live" ? (
            <span className="live-badge mc-live">
              <span className="live-dot" />
              EN DIRECT · {match.minute}
            </span>
          ) : (
            <span className="status status-upcoming">À venir</span>
          )}
        </div>
        <div className="mc-scoreboard">
          <div className="next-match-team">
            <UskLogo />
            <strong>{match.home.name}</strong>
            <span>{match.home.city}</span>
          </div>
          <div className="mc-score">
            <span>{match.home.score}</span>
            <em>–</em>
            <span>{match.away.score}</span>
          </div>
          <div className="next-match-team">
            <div className="away-crest mc-away-crest">{match.away.letters}</div>
            <strong>{match.away.name}</strong>
            <span>{match.away.city}</span>
          </div>
        </div>
        <div className="next-match-meta">
          <span>
            <CalendarDays size={14} />
            {match.date}
          </span>
          <span>
            <Clock3 size={14} />
            Coup d’envoi {match.time}
          </span>
          <span>
            <MapPin size={14} />
            {match.stadium}
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className="mc-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "mc-tab active" : "mc-tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "apercu" && (
        <div className="mc-panel">
          <div className="overview-grid mc-overview-grid">
            <div className="overview-card">
              <div className="overview-icon red-icon">
                <Trophy size={19} />
              </div>
              <span>Compétition</span>
              <strong className="mc-info-value">{match.competition}</strong>
            </div>
            <div className="overview-card">
              <div className="overview-icon blue-icon">
                <CalendarDays size={19} />
              </div>
              <span>Date</span>
              <strong className="mc-info-value">{match.date}</strong>
            </div>
            <div className="overview-card">
              <div className="overview-icon gold-icon">
                <Clock3 size={19} />
              </div>
              <span>Coup d’envoi</span>
              <strong className="mc-info-value">{match.time}</strong>
            </div>
            <div className="overview-card">
              <div className="overview-icon red-icon">
                <MapPin size={19} />
              </div>
              <span>Stade</span>
              <strong className="mc-info-value">{match.stadium}</strong>
            </div>
          </div>
          <div className="panel-block mc-note">
            <Shirt size={18} />
            <p>
              Rencontre comptant pour la 17ᵉ journée du championnat. L’USK mène actuellement{" "}
              {match.home.score} – {match.away.score} à la {match.minute} minute. Les statistiques
              détaillées seront publiées après le coup de sifflet final.
            </p>
          </div>
        </div>
      )}

      {/* LINEUP */}
      {tab === "composition" && (
        <div className="mc-panel">
          <div className="mc-lineups">
            <div className="panel-block mc-lineup-team">
              <div className="mc-lineup-head">
                <UskLogo />
                <strong>USK Kelibia</strong>
                <span>4 – 3 – 3</span>
              </div>
              <LineupList players={homeXI} title="Titulaires" />
              <LineupList players={homeSubs} title="Remplaçants" />
            </div>
            <div className="panel-block mc-lineup-team">
              <div className="mc-lineup-head">
                <div className="away-crest away-crest-sm">EB</div>
                <strong>EBT El Bathan</strong>
                <span>4 – 4 – 2</span>
              </div>
              <LineupList players={awayXI} title="Titulaires" />
              <LineupList players={awaySubs} title="Remplaçants" />
            </div>
          </div>
        </div>
      )}

      {/* EVENTS */}
      {tab === "evenements" && (
        <div className="mc-panel">
          <div className="panel-block mc-timeline">
            {[...events].reverse().map((e) => (
              <div
                className={`timeline-row timeline-${e.kind} ${e.team ? `timeline-${e.team}` : ""}`}
                key={e.minute + e.title}
              >
                <span className="timeline-minute">{e.minute}</span>
                <span className="timeline-icon">
                  <EventIcon kind={e.kind} />
                </span>
                <div className="timeline-copy">
                  <strong>{e.title}</strong>
                  <span>{e.detail}</span>
                </div>
              </div>
            ))}
            <div className="timeline-row timeline-fulltime timeline-pending">
              <span className="timeline-minute">90'</span>
              <span className="timeline-icon">
                <Clock3 size={15} />
              </span>
              <div className="timeline-copy">
                <strong>Coup de sifflet final</strong>
                <span>À venir — match en cours.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATISTICS */}
      {tab === "stats" && (
        <div className="mc-panel">
          <div className="mc-stats-grid">
            {statPlaceholders.map((label) => (
              <div className="panel-block mc-stat-card" key={label}>
                <span className="mc-stat-label">{label}</span>
                <div className="mc-stat-placeholder" />
                <small>Statistiques disponibles après le match</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to="/matchs" className="outline-button mc-back">
        <ArrowLeft size={16} /> Retour aux matchs
      </Link>
    </PublicShell>
  );
}

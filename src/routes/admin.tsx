import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  ClipboardList,
  Home,
  Image,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Radio,
  Search,
  Settings,
  Shirt,
  ShieldCheck,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { getMatches, formatMatchDate } from "../data/matches";
import { flattenPlayers, getStoredPlayerSections } from "../data/players";
import { getStandings, points } from "../data/standings";
import { AdminModeSwitch } from "../components/AdminModeSwitch";
import { UskLogo } from "../components/UskLogo";
import { supabase } from "../lib/supabase";

function AdminAuthBoundary() {
  return <AdminDashboardPage onSignOut={() => void supabase?.auth.signOut()} />;
}

const managementSections = [
  ["Accueil", Home, "/admin"],
  ["Effectif", Users, "/admin/effectif"],
  ["Équipes", Users, "/admin/equipes"],
  ["Tenues", Shirt, "/admin/tenues"],
  ["Matchs", CalendarDays, "/admin/matchs"],
  ["Live match", Radio, "/admin/live-match"],
  ["Classement", Trophy, "/admin/classement"],
] as const;
const shortcutSections = [
  ["Gérer l’effectif", Users, "/admin/effectif"],
  ["Ajouter un joueur", Users, "/admin/effectif"],
  ["Voir le calendrier", CalendarDays, "/admin/matchs"],
  ["Voir les statistiques", BarChart3, "/admin"],
] as const;

function TeamMark({ className = "" }: { className?: string }) {
  return <UskLogo className={`reference-admin-crest ${className}`} />;
}

function AdminDashboardPage({ onSignOut }: { onSignOut: () => void }) {
  const location = useLocation();
  const [dataVersion, setDataVersion] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const isDashboard = location.pathname === "/admin";

  useEffect(() => {
    setIsHydrated(true);
    const refresh = () => setDataVersion((version) => version + 1);
    const events = [
      "usk:data-updated",
      "usk-effectif-updated",
      "usk-matches-updated",
      "usk-teams-updated",
      "usk-kits-updated",
      "usk-standings-updated",
      "usk-live-updated",
    ];
    window.addEventListener("storage", refresh);
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => {
      window.removeEventListener("storage", refresh);
      events.forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, []);

  void dataVersion;
  const players = isHydrated ? flattenPlayers(getStoredPlayerSections()) : [];
  const matches = isHydrated ? getMatches() : [];
  const standings = isHydrated ? getStandings() : [];
  const upcoming = matches.find((match) => match.status === "upcoming");
  const finished = matches.filter((match) => match.status === "finished").slice(0, 4);
  const activePath = location.pathname;
  const isActive = (to: string) => {
    if (to === "/admin") return activePath === "/admin";
    return activePath === to || activePath.startsWith(`${to}/`);
  };

  return (
    <div className="reference-admin-shell">
      <aside className="reference-admin-sidebar">
        <Link to="/" className="reference-admin-brand">
          <TeamMark />
          <span>
            <strong>USK</strong>
            <small>
              UNION SPORTIVE
              <br />
              DE KELIBIA
            </small>
          </span>
        </Link>
        <nav className="reference-admin-nav" aria-label="Administration">
          {managementSections.map(([label, Icon, to]) => (
            <Link
              key={label}
              to={to}
              className={`reference-admin-nav-item${isActive(to) ? " active" : ""}`}
            >
              <Icon size={22} />
              <span>{label}</span>
              {label === "Effectif" && (
                <ChevronDown size={16} className="reference-admin-chevron" />
              )}
            </Link>
          ))}
        </nav>
        <div className="reference-admin-sidebar-art">
          <span>
            Plus qu&apos;un club,
            <br />
            <em>une famille</em>
          </span>
          <i />
        </div>
      </aside>

      <div className="reference-admin-main">
        <header className="reference-admin-topbar">
          <button className="reference-admin-mobile-menu" aria-label="Ouvrir le menu">
            <Menu size={22} />
          </button>
          <label className="reference-admin-search">
            <Search size={20} />
            <input placeholder="Rechercher un joueur, un match, ..." aria-label="Rechercher" />
          </label>
          <div className="reference-admin-account">
            <button aria-label="Notifications" className="reference-admin-bell">
              <Bell size={24} />
              <b>3</b>
            </button>
            <i />
            <button
              type="button"
              className="admin-quiet-button"
              onClick={() => {
                void supabase?.auth.signOut();
                onSignOut();
              }}
            >
              Déconnexion
            </button>
            <AdminModeSwitch />
          </div>
        </header>

        {isDashboard && (
          <main className="reference-admin-content">
            <section className="reference-admin-grid-top">
              <div className="reference-admin-hero">
                <TeamMark className="hero-crest" />
                <div>
                  <strong>USK</strong>
                  <span>
                    UNION SPORTIVE
                    <br />
                    DE KELIBIA
                  </span>
                  <p>Ensemble vers de nouveaux horizons</p>
                  <i />
                </div>
              </div>
              <div className="reference-admin-club">
                <div>
                  <TeamMark />
                  <span>
                    <strong>USK</strong>
                    <small>Union Sportive de Kelibia</small>
                  </span>
                </div>
                <p>
                  <MapPin size={19} />
                  Kelibia, Tunisie
                </p>
                <p>
                  <ShieldCheck size={19} />
                  Stade de Kelibia
                </p>
                <p>
                  <CalendarDays size={19} />
                  Fondation : 1959
                </p>
              </div>
            </section>

            <section className="reference-admin-kpis">
              {[
                [Users, players.length, "Joueurs", "+2 cette semaine"],
                [ShieldCheck, 4, "Entraîneurs", "Aucun changement"],
                [CalendarDays, matches.length, "Matchs joués", "+2 victoires"],
                [Trophy, 2, "Victoires", "25%"],
              ].map(([Icon, value, label, note]) => (
                <div className="reference-admin-kpi" key={label as string}>
                  <span>
                    <Icon size={25} />
                  </span>
                  <div>
                    <strong>{value}</strong>
                    <small>{label}</small>
                    <em>{note}</em>
                  </div>
                </div>
              ))}
            </section>

            <section className="reference-admin-dashboard-columns">
              <div className="reference-admin-left-stack">
                <article className="reference-admin-panel reference-admin-results">
                  <header>
                    <h2>Derniers matchs</h2>
                    <a href="#results">Voir tous</a>
                  </header>
                  {finished.map((match) => (
                    <div className="reference-admin-match-row" key={match.id}>
                      <time>
                        {formatMatchDate(match.date)}
                        <small>{match.competition.split(" · ")[0]}</small>
                      </time>
                      <TeamMark />
                      <strong>USK</strong>
                      <b>
                        {match.home ? match.scoreFor : match.scoreAgainst} -{" "}
                        {match.home ? match.scoreAgainst : match.scoreFor}
                      </b>
                      <span className="reference-admin-opponent">{match.opponent}</span>
                      <span className="reference-admin-status">
                        {match.result === "N" ? "Nul" : "Victoire"}
                      </span>
                    </div>
                  ))}
                </article>
                <article className="reference-admin-quote">
                  <span>“</span>
                  <p>
                    “La force d’une équipe
                    <br />
                    réside dans son unité.”
                  </p>
                  <i />
                  <small>USK</small>
                </article>
              </div>
              <article className="reference-admin-panel reference-admin-standings">
                <header>
                  <h2>Classement Ligue 2</h2>
                  <a href="#standings">Voir tous</a>
                </header>
                <div className="reference-admin-table-head">
                  <span>#</span>
                  <span>Équipe</span>
                  <span>Pts</span>
                </div>
                {standings.slice(0, 5).map((team, index) => (
                  <div
                    className={`reference-admin-table-row${team.team.toLowerCase().includes("usk") ? " selected" : ""}`}
                    key={team.id}
                  >
                    <span>{index + 1}</span>
                    <TeamMark />
                    <strong>{team.team}</strong>
                    <b>{points(team)}</b>
                  </div>
                ))}
              </article>
            </section>

            <aside className="reference-admin-right-rail">
              <article className="reference-admin-panel reference-admin-next">
                <header>
                  <h2>Prochain match</h2>
                  <a href="#matches">Voir tous</a>
                </header>
                {upcoming ? (
                  <>
                    <div className="reference-admin-versus">
                      <TeamMark />
                      <strong>USK</strong>
                      <b>VS</b>
                      <span>{upcoming.opponent}</span>
                    </div>
                    <p>
                      <CalendarDays size={18} />
                      {formatMatchDate(upcoming.date)} &nbsp;|&nbsp; {upcoming.time}
                    </p>
                    <p>
                      <MapPin size={18} />
                      {upcoming.stadium}
                    </p>
                    <Link to="/admin/matchs">
                      Voir les détails <ArrowRight size={17} />
                    </Link>
                  </>
                ) : (
                  <p>Aucun match programmé.</p>
                )}
              </article>
              <article className="reference-admin-panel reference-admin-shortcuts">
                <h2>Raccourcis</h2>
                {shortcutSections.map(([label, Icon, to]) => (
                  <Link key={label} to={to}>
                    <Icon size={23} />
                    <span>{label}</span>
                    <ArrowRight size={18} />
                  </Link>
                ))}
              </article>
            </aside>
          </main>
        )}
        <Outlet />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminAuthBoundary,
  head: () => ({ meta: [{ title: "Administration — USK" }] }),
});

void CircleDollarSign;
void Clapperboard;
void ClipboardList;
void Image;
void LayoutDashboard;
void MessageCircle;
void Radio;
void Shirt;
void Vote;

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, BarChart3, CalendarDays, ChevronDown, ChevronUp, Home, Search, Settings, Shirt, Shield, ShirtIcon, Users, Trophy, Newspaper } from "lucide-react";
import { getOfficialHomeKit } from "../data/kits";
import { AdminModeSwitch } from "../components/AdminModeSwitch";
import { UskLogo } from "../components/UskLogo";
import { defaultPlayerSections, readPlayerSections, type Player } from "../data/players";
import "../usk.css";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({ meta: [{ title: "USK — Gestion de l’effectif" }] }),
});

const nav = [
  [Home, "Tableau de bord", "/"], [Users, "Le Club", "/plus"], [Shield, "Gestion de l’effectif", "/"],
  [Shirt, "Tenues", "/tenues"], [CalendarDays, "Matchs", "/matchs"], [BarChart3, "Statistiques", "/classement"], [Settings, "Paramètres", "/plus"],
] as const;
const lowerNav = [[Newspaper, "Actualités", "/news"], [CalendarDays, "Calendrier", "/matchs"], [Users, "Communauté", "/plus"], [Settings, "Paramètres", "/plus"]] as const;
const categoryLabels = ["Tous", "Gardiens", "Défenseurs", "Milieux", "Attaquants"];
function playerCategory(position: string) {
  const value = position.toLowerCase();
  if (value.includes("gardien")) return "Gardiens";
  if (value.includes("défenseur") || value.includes("latéral")) return "Défenseurs";
  if (value.includes("milieu")) return "Milieux";
  return "Attaquants";
}

function Crest() {
  return <UskLogo />;
}

function HomePage() {
  const [players, setPlayers] = useState<Player[]>(() => defaultPlayerSections.flatMap((section) => section.players));
  const [category, setCategory] = useState("Tous");
  const [query, setQuery] = useState("");
  const homeKit = getOfficialHomeKit();

  useEffect(() => {
    const refresh = () => setPlayers(readPlayerSections().flatMap((section) => section.players));
    window.addEventListener("usk-effectif-updated", refresh);
    return () => window.removeEventListener("usk-effectif-updated", refresh);
  }, []);

  const filtered = useMemo(() => players.filter((player) => {
    const matchesCategory = category === "Tous" || playerCategory(player.position) === category;
    return matchesCategory && player.name.toLowerCase().includes(query.toLowerCase());
  }), [players, category, query]);

  return (
    <div className="roster-dashboard">
      <aside className="roster-sidebar">
        <Link to="/" className="roster-brand"><Crest /><span><strong>USK</strong><small>UNION SPORTIVE<br />DE KELIBIA</small></span></Link>
        <div className="roster-nav-label">ESPACE CLUB</div>
        <nav className="roster-nav" aria-label="Navigation principale">
          {nav.map(([Icon, label, to], index) => <Link key={label} to={to} className={index === 2 ? "active" : ""}><Icon size={18} />{label}{label === "Le Club" && <ChevronDown size={15} className="nav-chevron" />}</Link>)}
        </nav>
        <div className="roster-nav secondary-nav">{lowerNav.map(([Icon, label, to]) => <Link key={label} to={to}><Icon size={18} />{label}</Link>)}</div>
        <div className="roster-sidebar-footer"><strong>USK</strong><span>KELIBIA</span><small>36.8656° N　11.0966° E</small></div>
      </aside>
      <div className="roster-main">
        <header className="roster-topbar"><div className="roster-topbar-mark">Plus qu&apos;un club,<br /><em>une famille</em><i /></div><div className="roster-user"><button aria-label="Notifications"><Bell size={21} /><b>3</b></button><AdminModeSwitch /></div></header>
        <main className="roster-content">
          <section className="roster-heading"><div className="roster-heading-copy"><div className="roster-title"><Users size={31} /><div><h1>Gestion de l’effectif</h1><p>Consultez et gérez les joueurs de l&apos;équipe première. Tous les joueurs portent automatiquement<br className="desktop-only" /> la tenue officielle du club.</p></div></div></div><div className="roster-kit"><div className="mini-kit">{homeKit.image ? <img src={homeKit.image} alt="Tenue officielle" /> : <ShirtIcon size={36} />}</div><div><strong>Tenue officielle</strong><span>Maillot domicile</span><small><i /> Active</small></div><Link to="/tenues">Voir la tenue <ChevronDown size={15} /></Link></div></section>
          <section className="roster-toolbar"><div className="roster-tabs">{categoryLabels.map((label) => <button key={label} className={category === label ? "active" : ""} onClick={() => setCategory(label)}>{label} <span>{label === "Tous" ? players.length : players.filter((p) => playerCategory(p.position) === label).length}</span></button>)}</div><label className="roster-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un joueur..." /></label></section>
          <section className="roster-grid" aria-label="Joueurs de l’effectif">{filtered.map((player) => <article className="roster-card" key={player.id}><div className="roster-photo"><span className="roster-number">{player.num}</span><img src={player.photo} alt={player.name} /></div><div className="roster-card-info"><strong>{player.name}</strong><span>{player.position}</span><b>◉</b></div></article>)}</section>
        </main>
      </div>
    </div>
  );
}

export default HomePage;

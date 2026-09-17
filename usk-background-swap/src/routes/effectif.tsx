import { createFileRoute } from "@tanstack/react-router";
import { Ruler, User, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PublicShell } from "../components/PublicShell";
import { getKit, useKits } from "../data/kits";
import {
  getStoredPlayerSections,
  normalizePlayerSections,
  PLAYER_UPDATE_EVENT,
  type Player,
  type PlayerSection,
} from "../data/players";
import "../usk.css";

export const Route = createFileRoute("/effectif")({
  component: EffectifPage,
  head: () => ({
    meta: [
      { title: "Effectif — Union Sportive de Kelibia" },
      {
        name: "description",
        content: "Découvrez l’effectif complet de l’Union Sportive de Kelibia.",
      },
    ],
  }),
});

function HomeKitLayer({
  kit,
  className = "",
}: {
  kit: ReturnType<typeof getKit>;
  className?: string;
}) {
  if (!kit.image) return null;
  return (
    <span className={`player-home-kit-wrap ${className}`} aria-hidden="true">
      <img className="player-home-kit" src={kit.image} alt="" width={1024} height={1024} />
    </span>
  );
}

function PlayerProfile({
  player,
  kit,
  onClose,
}: {
  player: Player;
  kit: ReturnType<typeof getKit>;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const stats = [
    { label: "Matchs", value: player.stats.matches },
    { label: "Buts", value: player.stats.goals },
    { label: "Passes décisives", value: player.stats.assists },
    { label: "Cartons jaunes", value: player.stats.yellow },
    { label: "Cartons rouges", value: player.stats.red },
  ];
  return (
    <div
      className="player-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Profil de ${player.name}`}
    >
      <div className="player-modal" onClick={(event) => event.stopPropagation()}>
        <button className="player-modal-close" onClick={onClose} aria-label="Fermer">
          <X size={18} />
        </button>
        <div className="player-modal-hero">
          <span className="player-modal-num">{player.num}</span>
          <img src={player.photo} alt={player.name} width={1024} height={1024} />
          <HomeKitLayer kit={kit} className="player-modal-kit" />
        </div>
        <div className="player-modal-body">
          <span className="section-kicker">{player.position}</span>
          <h2 className="player-modal-name">{player.name}</h2>
          <div className="player-modal-info">
            <span>
              <User size={13} />
              {player.age} ans
            </span>
            <span>
              <Ruler size={13} />
              {player.height}
            </span>
            <span>Pied {player.foot.toLowerCase()}</span>
          </div>
          <span className="lineup-block-title">Statistiques · Saison 2024/25</span>
          <div className="player-modal-stats">
            {stats.map((stat) => (
              <div className="player-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EffectifPage() {
  const [sections, setSections] = useState<PlayerSection[]>(() =>
    normalizePlayerSections(getStoredPlayerSections()),
  );
  const kits = useKits();
  const homeKit = kits.find((kit) => kit.slot === "home") || getKit("home");
  const [selected, setSelected] = useState<Player | null>(null);
  useEffect(() => {
    const sync = () => setSections(normalizePlayerSections(getStoredPlayerSections()));
    window.addEventListener(PLAYER_UPDATE_EVENT, sync);
    return () => window.removeEventListener(PLAYER_UPDATE_EVENT, sync);
  }, []);
  return (
    <PublicShell
      kicker="L’ÉQUIPE"
      title="Effectif"
      description="Les joueurs de l’Union Sportive de Kelibia pour la saison 2024/25, poste par poste."
      icon={Users}
    >
      {!homeKit.image && (
        <div className="squad-kit-required" role="status">
          <strong>Tenue Home non configurée</strong>
          <span>
            La configuration de l’effectif sera complète dès que le maillot domicile officiel sera
            ajouté dans Administration → Tenues.
          </span>
        </div>
      )}
      {sections.map((section) => (
        <div className="squad-section" key={section.title}>
          <div className="section-heading fixtures-heading squad-heading">
            <div>
              <span className="section-kicker">{section.title.toUpperCase()}</span>
              <h2>{section.title}</h2>
            </div>
            <span className="squad-count">{section.players.length} joueurs</span>
          </div>
          <div className="squad-grid">
            {section.players.map((player) => (
              <button className="player-card" key={player.id} onClick={() => setSelected(player)}>
                <div className="player-card-photo">
                  <span className="player-card-num">{player.num}</span>
                  <img
                    src={player.photo}
                    alt={player.name}
                    loading="lazy"
                    width={1024}
                    height={1024}
                  />
                  <HomeKitLayer kit={homeKit} />
                </div>
                <div className="player-card-info">
                  <strong>{player.name}</strong>
                  <span>{player.position}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
      {selected && (
        <PlayerProfile player={selected} kit={homeKit} onClose={() => setSelected(null)} />
      )}
    </PublicShell>
  );
}

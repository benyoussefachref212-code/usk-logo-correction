import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock3, Radio, Trophy } from "lucide-react";
import { PublicShell } from "../components/PublicShell";
import { UskLogo } from "../components/UskLogo";
import "../usk.css";
export const Route = createFileRoute("/live-match")({
  component: LiveMatchPage,
  head: () => ({
    meta: [
      { title: "Live Match — USK" },
      { name: "description", content: "Suivez le match de l’USK en direct." },
    ],
  }),
});
function LiveMatchPage() {
  return (
    <PublicShell
      kicker="MATCH CENTER"
      title="Live Match"
      description="Suivez les temps forts et les statistiques du match de l’USK en direct."
      icon={Radio}
    >
      <div className="live-page-card">
        <div className="live-page-top">
          <span className="live-badge">
            <span className="live-dot" />
            EN DIRECT
          </span>
          <span>Championnat · Journée 17</span>
          <span>
            <Clock3 size={15} />
            67&apos;
          </span>
        </div>
        <div className="live-page-teams">
          <div>
            <UskLogo />
            <strong>USK</strong>
            <span>Kelibia</span>
          </div>
          <b>
            2 <small>–</small> 1
          </b>
          <div>
            <div className="away-crest">EB</div>
            <strong>EBT</strong>
            <span>Béni Khiar</span>
          </div>
        </div>
        <div className="live-events">
          <div>
            <time>61&apos;</time>
            <span>Remplacement · USK</span>
          </div>
          <div>
            <time>48&apos;</time>
            <span>But · USK Kelibia</span>
          </div>
          <div>
            <time>32&apos;</time>
            <span>But · EBT</span>
          </div>
        </div>
        <Link to="/match-center" className="button button-red">
          Ouvrir le Match Center <ArrowRight size={16} />
        </Link>
      </div>
      <div className="live-unavailable">
        <Trophy size={20} />
        <div>
          <strong>Le prochain direct sera annoncé ici</strong>
          <span>Activez les notifications dans Plus pour ne rien manquer.</span>
        </div>
      </div>
    </PublicShell>
  );
}
export default LiveMatchPage;

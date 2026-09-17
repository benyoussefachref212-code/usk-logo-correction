import { createFileRoute } from "@tanstack/react-router";
import { Shirt, Sparkles } from "lucide-react";
import { PublicShell } from "../components/PublicShell";
import { useKits } from "../data/kits";

function TenuesPage() {
  const kits = useKits().filter((kit) => kit.image);
  return (
    <PublicShell
      kicker="IDENTITÉ DU CLUB"
      title="Tenues officielles"
      description="Les couleurs de l’USK, sur le terrain et au-delà."
      icon={Shirt}
    >
      <div className={`public-kits-grid kit-count-${kits.length}`}>
        {kits.length ? (
          kits.map((kit, index) => (
            <article
              className="public-kit-card"
              key={kit.slot}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="public-kit-stage">
                <span className="public-kit-badge">
                  <Sparkles size={13} /> {kit.label}
                </span>
                <img
                  src={kit.image!}
                  alt={`${kit.title} officiel de l’Union Sportive de Kelibia`}
                />
              </div>
              <div className="public-kit-copy">
                <span className="section-kicker">USK · ÉDITION OFFICIELLE</span>
                <h2>{kit.title}</h2>
                <p>{kit.description}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="panel-block subpage-empty">
            <div className="subpage-empty-icon">
              <Shirt size={26} />
            </div>
            <strong>Les tenues arrivent bientôt</strong>
            <span>Les visuels officiels seront publiés prochainement.</span>
          </div>
        )}
      </div>
    </PublicShell>
  );
}

export const Route = createFileRoute("/tenues")({
  component: TenuesPage,
  head: () => ({ meta: [{ title: "Tenues officielles — USK" }] }),
});

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Camera,
  ChevronRight,
  Info,
  Instagram,
  MapPin,
  MoreHorizontal,
  Trophy,
  Users,
  ShieldCheck,
} from "lucide-react";
import { PublicShell } from "../components/PublicShell";
import "../usk.css";
export const Route = createFileRoute("/plus")({
  component: PlusPage,
  head: () => ({
    meta: [
      { title: "Plus — USK" },
      {
        name: "description",
        content: "Découvrez tous les univers de l’Union Sportive de Kelibia.",
      },
    ],
  }),
});
const links = [
  { icon: BookOpen, title: "Histoire du club", text: "1946 · Une passion qui se transmet" },
  { icon: Trophy, title: "Palmarès", text: "Nos moments forts et nos trophées" },
  { icon: Camera, title: "Galerie", text: "Les images de la vie sang et marine" },
  { icon: Bell, title: "Notifications", text: "Ne manquez aucun rendez-vous" },
  { icon: Users, title: "Académie", text: "Former les talents de demain" },
  { icon: Info, title: "Infos pratiques", text: "Stade, contact et réseaux sociaux" },
];
function PlusPage() {
  return (
    <PublicShell
      kicker="L’UNIVERS USK"
      title="Plus"
      description="Le club, l’académie et tous les espaces de la vie sang et marine."
      icon={MoreHorizontal}
    >
      <div className="plus-grid">
        {links.map(({ icon: Icon, title, text }) => (
          <Link to="/plus" className="plus-card" key={title}>
            <span className="plus-card-icon">
              <Icon size={22} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            <ChevronRight size={18} />
          </Link>
        ))}
      </div>
      <Link to="/admin" className="plus-admin-link">
        <span className="plus-admin-icon">
          <ShieldCheck size={22} />
        </span>
        <span className="plus-admin-copy">
          <strong>Administration</strong>
          <small>Accéder au centre de gestion de l’application USK</small>
        </span>
        <ChevronRight size={18} />
      </Link>
      <div className="plus-contact">
        <div>
          <span className="section-kicker">NOUS REJOINDRE</span>
          <h2>Une ville, un club, une seule voix.</h2>
          <p>Retrouvez l’USK au Stade de Kelibia et sur nos réseaux.</p>
        </div>
        <div className="plus-contact-links">
          <span>
            <MapPin size={16} />
            Stade de Kelibia
          </span>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <Instagram size={16} />
            Instagram
          </a>
        </div>
      </div>
    </PublicShell>
  );
}
export default PlusPage;

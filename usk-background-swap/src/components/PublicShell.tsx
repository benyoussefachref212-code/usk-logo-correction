import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AdminModeSwitch } from "./AdminModeSwitch";
import { AppTabBar } from "./AppTabBar";
import { UskLogo } from "./UskLogo";

export function PublicShell({
  kicker,
  title,
  description,
  icon: Icon,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <div className="app-shell public-subpage usk-platform-shell">
      <header className="site-header usk-platform-header">
        <div className="header-inner">
          <Link to="/" className="brand-button" aria-label="Retour à l'accueil">
            <UskLogo />
            <span className="brand-copy">
              <strong>Union Sportive de Kelibia</strong>
              <em>Fondé en 1946</em>
            </span>
          </Link>
          <nav className="main-nav">
            <Link
              to="/"
              className="nav-link"
              activeOptions={{ exact: true }}
              activeProps={{ className: "nav-link active" }}
            >
              Accueil
            </Link>
            <Link to="/matchs" className="nav-link" activeProps={{ className: "nav-link active" }}>
              Matchs
            </Link>
            <Link
              to="/effectif"
              className="nav-link"
              activeProps={{ className: "nav-link active" }}
            >
              Effectif
            </Link>
            <Link
              to="/classement"
              className="nav-link"
              activeProps={{ className: "nav-link active" }}
            >
              Classement
            </Link>
            <Link to="/tenues" className="nav-link" activeProps={{ className: "nav-link active" }}>
              Tenues
            </Link>
            <Link
              to="/live-match"
              className="nav-link"
              activeProps={{ className: "nav-link active" }}
            >
              Live Match
            </Link>
            <Link to="/news" className="nav-link" activeProps={{ className: "nav-link active" }}>
              News
            </Link>
            <Link to="/plus" className="nav-link" activeProps={{ className: "nav-link active" }}>
              Plus
            </Link>
          </nav>
          <AdminModeSwitch />
        </div>
      </header>

      <main className="subpage-main">
        <section className="content-section subpage-hero">
          <span className="section-kicker">{kicker}</span>
          <h1 className="subpage-title">{title}</h1>
          <p className="subpage-desc">{description}</p>
        </section>
        <section className="content-section subpage-body">
          {children ?? (
            <div className="panel-block subpage-empty">
              <div className="subpage-empty-icon">
                <Icon size={26} />
              </div>
              <strong>Contenu à venir</strong>
              <span>Cette section sera bientôt disponible. Revenez vite&nbsp;!</span>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <UskLogo />
        <span>© 2025 USK — Union Sportive de Kelibia</span>
      </footer>

      <AppTabBar />
    </div>
  );
}

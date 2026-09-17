import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, MoreHorizontal, Trophy, Users } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Accueil", exact: true },
  { to: "/matchs", icon: CalendarDays, label: "Matchs" },
  { to: "/effectif", icon: Users, label: "Effectif" },
  { to: "/classement", icon: Trophy, label: "Classement" },
  { to: "/plus", icon: MoreHorizontal, label: "Plus" },
] as const;

export function AppTabBar() {
  return (
    <nav className="app-tabbar usk-mobile-nav" aria-label="Navigation principale">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="app-tabbar-item"
          activeProps={{ className: "app-tabbar-item active" }}
          activeOptions={{ exact: "exact" in item ? item.exact : false }}
        >
          <item.icon size={21} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

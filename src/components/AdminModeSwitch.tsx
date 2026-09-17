import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, UserRound } from "lucide-react";

export function AdminModeSwitch() {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const destination = isAdmin ? "/" : "/admin";
  const label = isAdmin ? "Public" : "Admin";

  return (
    <Link
      to={destination}
      className={`admin-mode-switch${isAdmin ? " is-admin" : ""}`}
      aria-label={`Basculer vers le mode ${label}`}
      title={`Basculer vers le mode ${label}`}
      preload="render"
    >
      <span className="admin-mode-avatar" aria-hidden="true">
        <UserRound size={16} />
      </span>
      <strong>{label}</strong>
      <ChevronDown size={15} aria-hidden="true" />
    </Link>
  );
}

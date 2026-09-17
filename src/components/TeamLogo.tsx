import { useMemo, useState } from "react";
import { publicAssetUrl } from "../lib/supabase";

type TeamLogoProps = {
  src?: string | null;
  name: string;
  abbreviation?: string;
  className?: string;
  alt?: string;
};

export const fallbackLogo = (label: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b51f32"/><stop offset="1" stop-color="#10233f"/></linearGradient></defs><path fill="url(#g)" d="M48 5 82 17v27c0 23-14 39-34 47C28 83 14 67 14 44V17z"/><circle cx="48" cy="43" r="23" fill="#fff" opacity=".95"/><text x="48" y="50" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#10233f">${label.slice(0, 4).toUpperCase()}</text></svg>`)}`;

export function resolveTeamLogo(src: string | null | undefined) {
  if (!src) return null;
  if (src.startsWith("/") || src.startsWith("./") || src.startsWith("../")) {
    const path = src.replace(/^\.\//, "/").replace(/^\.\.\//, "/");
    return path.startsWith("/images/") || path.startsWith("/assets/") || /\.(svg|png|jpe?g|webp)$/i.test(path)
      ? path
      : publicAssetUrl(src);
  }
  return publicAssetUrl(src);
}

export function TeamLogo({ src, name, abbreviation, className, alt }: TeamLogoProps) {
  const resolved = useMemo(() => resolveTeamLogo(src), [src]);
  const [failed, setFailed] = useState(false);
  return (
    <img
      className={className}
      src={failed || !resolved ? fallbackLogo(abbreviation || name) : resolved}
      alt={alt ?? `Logo ${name}`}
      onError={() => setFailed(true)}
    />
  );
}

export function teamLogoUrl(src: string | null | undefined) {
  return resolveTeamLogo(src) || fallbackLogo("TEAM");
}
EOF

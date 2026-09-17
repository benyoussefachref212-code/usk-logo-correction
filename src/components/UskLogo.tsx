import type { ImgHTMLAttributes } from "react";

export function UskLogo({ className = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      className={`reference-admin-crest usk-official-logo ${className}`.trim()}
      src="/usk-official-logo.png"
      alt={props.alt ?? "Union Sportive de Kelibia"}
    />
  );
}

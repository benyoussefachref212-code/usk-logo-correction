import type { ImgHTMLAttributes } from "react";

export function UskLogo({ className = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      className={`reference-admin-crest usk-official-logo ${className}`.trim()}
      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-dD2nDzcpk7udoFfBodPHC0h3A5TLdm.png"
      alt={props.alt ?? "Union Sportive de Kelibia"}
    />
  );
}

import * as React from "react";

/**
 * Logo Prétoire — balance de la justice stylisée à la couleur principale
 * (var --couleur-principale, white-label). Affiché dans la sidebar.
 */
export function PretoireLogo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Prétoire"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="11"
        fill="var(--couleur-principale)"
      />
      <g
        stroke="var(--couleur-principale-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        <line x1="24" y1="11" x2="24" y2="37" />
        <line x1="17" y1="37" x2="31" y2="37" />
        <line x1="13" y1="17" x2="35" y2="17" />
        <line x1="13" y1="17" x2="9" y2="26" />
        <line x1="13" y1="17" x2="17" y2="26" />
        <line x1="35" y1="17" x2="31" y2="26" />
        <line x1="35" y1="17" x2="39" y2="26" />
      </g>
      <path
        d="M7 26 a6 3 0 0 0 12 0 Z"
        fill="var(--couleur-accent)"
      />
      <path
        d="M29 26 a6 3 0 0 0 12 0 Z"
        fill="var(--couleur-accent)"
      />
      <circle cx="24" cy="17" r="3" fill="var(--couleur-accent)" />
    </svg>
  );
}

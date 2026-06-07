import * as React from "react";

/**
 * Logo « maison » du Barreau du Cameroun.
 * Balance de la justice + silhouette stylisée du Cameroun, aux couleurs
 * vert #007A5E / rouge #CE1126 / jaune #FCD116. Utilisé sur la page de login.
 */
export function LogoBarreauCameroun({
  className,
  size = 96,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Barreau du Cameroun"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cercle aux 3 couleurs (drapeau) */}
      <defs>
        <linearGradient id="drapeau" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#007A5E" />
          <stop offset="33%" stopColor="#007A5E" />
          <stop offset="33%" stopColor="#CE1126" />
          <stop offset="66%" stopColor="#CE1126" />
          <stop offset="66%" stopColor="#FCD116" />
          <stop offset="100%" stopColor="#FCD116" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="58" fill="#ffffff" stroke="url(#drapeau)" strokeWidth="4" />

      {/* Silhouette stylisée du Cameroun (forme triangulaire) */}
      <path
        d="M40 30 L78 36 L74 62 L66 96 L52 78 L44 64 L38 48 Z"
        fill="#007A5E"
        opacity="0.12"
      />

      {/* Balance de la justice */}
      <g stroke="#1a1d1c" strokeWidth="2.4" strokeLinecap="round" fill="none">
        {/* Mât */}
        <line x1="60" y1="26" x2="60" y2="92" />
        {/* Socle */}
        <line x1="46" y1="92" x2="74" y2="92" />
        {/* Fléau */}
        <line x1="34" y1="40" x2="86" y2="40" />
        {/* Suspensions */}
        <line x1="34" y1="40" x2="28" y2="58" />
        <line x1="34" y1="40" x2="40" y2="58" />
        <line x1="86" y1="40" x2="80" y2="58" />
        <line x1="86" y1="40" x2="92" y2="58" />
      </g>

      {/* Pivot étoile jaune (étoile du drapeau) */}
      <circle cx="60" cy="40" r="5" fill="#FCD116" stroke="#1a1d1c" strokeWidth="1.5" />

      {/* Plateaux */}
      <path d="M24 58 a10 5 0 0 0 20 0 Z" fill="#007A5E" />
      <path d="M76 58 a10 5 0 0 0 20 0 Z" fill="#CE1126" />
    </svg>
  );
}

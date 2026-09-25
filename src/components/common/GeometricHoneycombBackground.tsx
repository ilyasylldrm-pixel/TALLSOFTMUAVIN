import React from "react";
import { useTheme } from "../../context/ThemeContext";

export interface GeometricHoneycombBackgroundProps {
  id?: string;
  className?: string;
}

export const GeometricHoneycombBackground: React.FC<GeometricHoneycombBackgroundProps> = ({
  id = "honeycomb-geom",
  className = "",
}) => {
  const { theme } = useTheme();
  const primary = theme.primaryColor || "#0f6bae";

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Seamless Honeycomb (Bal Peteği) Tessellation Pattern - Dense Corporate Geometric */}
          <pattern
            id={`${id}-pattern`}
            width="56"
            height="96"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(0.38)"
          >
            {/* Hexagon wireframe grid */}
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L28 96 M0 48 L0 80 L28 96 L56 80 L56 48"
              fill="none"
              stroke={primary}
              strokeWidth="0.9"
              strokeOpacity="0.14"
            />
            {/* 3D Isometric Axes inside primary hexagon */}
            <path
              d="M28 0 L28 32 M56 16 L28 32 L0 16"
              fill="none"
              stroke={primary}
              strokeWidth="0.7"
              strokeOpacity="0.1"
            />
            {/* 3D Isometric Axes inside lower hexagon */}
            <path
              d="M28 64 L28 96 M56 80 L28 96 L0 80"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.7"
              strokeOpacity="0.1"
            />
            {/* Filled accent facets */}
            <polygon
              points="28,0 56,16 28,32 0,16"
              fill={primary}
              fillOpacity="0.025"
            />
            <polygon
              points="28,64 56,80 28,96 0,80"
              fill="#38bdf8"
              fillOpacity="0.02"
            />
            {/* Precision Micro Nodes */}
            <circle cx="28" cy="32" r="1.8" fill={primary} fillOpacity="0.18" />
            <circle cx="28" cy="96" r="1.6" fill="#38bdf8" fillOpacity="0.16" />
          </pattern>

          {/* Mask to softly display honeycomb on the RIGHT side with gentle density */}
          <linearGradient id={`${id}-mask-right`} x1="100%" y1="20%" x2="0%" y2="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.26" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <mask id={`${id}-honeycomb-mask`}>
            <rect width="100%" height="100%" fill={`url(#${id}-mask-right)`} />
          </mask>

          {/* Gradients for floating geometric shapes */}
          <linearGradient id={`${id}-shape-grad1`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.24" />
            <stop offset="100%" stopColor="#dae2fd" stopOpacity="0.04" />
          </linearGradient>

          <linearGradient id={`${id}-shape-grad2`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
            <stop offset="60%" stopColor={primary} stopOpacity="0.12" />
            <stop offset="100%" stopColor="#dae2fd" stopOpacity="0.03" />
          </linearGradient>

          <linearGradient id={`${id}-stroke-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.45" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#dae2fd" stopOpacity="0.08" />
          </linearGradient>
          {/* Ambient Center Gradient Glow - Yumuşatılmış İnce Geçiş (Softened Subtle Transition) */}
          <radialGradient id={`${id}-center-ambient`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.05" />
            <stop offset="35%" stopColor={primary} stopOpacity="0.03" />
            <stop offset="70%" stopColor="#dae2fd" stopOpacity="0.01" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Bal Peteği (Honeycomb) Tiled Base Layer - Sağ Tarafta (Concentrated on the RIGHT) */}
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-pattern)`}
          mask={`url(#${id}-honeycomb-mask)`}
        />

        {/* 2. Gradyan Ortada (Center Atmospheric Gradient Bridge) */}
        <rect
          x="20%"
          y="0"
          width="60%"
          height="100%"
          fill={`url(#${id}-center-ambient)`}
          className="pointer-events-none"
        />

        {/* 3. İlk Eklenen Geometrik Desenler: Sol Tarafta (Major Concentrated LEFT Cluster) */}
        <g className="transform -translate-x-4 sm:translate-x-2 md:translate-x-6 lg:translate-x-8 translate-y-[-12px] sm:translate-y-[-4px]">
          {/* Concentric Technical Circles / Radar Rings */}
          <circle
            cx="80"
            cy="76"
            r="130"
            fill="none"
            stroke={primary}
            strokeWidth="1"
            strokeDasharray="4 6"
            strokeOpacity="0.16"
          />
          <circle
            cx="80"
            cy="76"
            r="92"
            fill="none"
            stroke={primary}
            strokeWidth="0.9"
            strokeOpacity="0.14"
          />
          <circle
            cx="80"
            cy="76"
            r="56"
            fill={`url(#${id}-shape-grad1)`}
            stroke={primary}
            strokeWidth="1"
            strokeOpacity="0.22"
          />
          <circle
            cx="80"
            cy="76"
            r="28"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeDasharray="2 4"
            strokeOpacity="0.24"
          />

          {/* Primary 3D Isometric Cube / Hexagon on Left */}
          <g transform="translate(68, 56)">
            {/* Outer Hexagon Shell */}
            <polygon
              points="0,-44 38.1,-22 38.1,22 0,44 -38.1,22 -38.1,-22"
              fill={`url(#${id}-shape-grad2)`}
              stroke={`url(#${id}-stroke-grad)`}
              strokeWidth="1.6"
            />
            {/* 3D Isometric Axes */}
            <line x1="0" y1="0" x2="0" y2="44" stroke={primary} strokeWidth="1.3" strokeOpacity="0.28" />
            <line x1="0" y1="0" x2="38.1" y2="-22" stroke={primary} strokeWidth="1.3" strokeOpacity="0.28" />
            <line x1="0" y1="0" x2="-38.1" y2="-22" stroke={primary} strokeWidth="1.3" strokeOpacity="0.28" />
            {/* Top Facet Highlight */}
            <polygon
              points="0,0 38.1,-22 0,-44 -38.1,-22"
              fill={primary}
              fillOpacity="0.065"
            />
            {/* Left Facet Subtle Shade */}
            <polygon
              points="0,0 -38.1,-22 -38.1,22 0,44"
              fill="#005289"
              fillOpacity="0.04"
            />
          </g>

          {/* Secondary Isometric Hexagon (Top-Left Accent) */}
          <g transform="translate(24, 18)">
            <polygon
              points="0,-22 19.1,-11 19.1,11 0,22 -19.1,11 -19.1,-11"
              fill={`url(#${id}-shape-grad1)`}
              stroke={primary}
              strokeWidth="1.1"
              strokeOpacity="0.22"
            />
            <line x1="0" y1="0" x2="0" y2="22" stroke={primary} strokeWidth="0.9" strokeOpacity="0.22" />
            <line x1="0" y1="0" x2="19.1" y2="-11" stroke={primary} strokeWidth="0.9" strokeOpacity="0.22" />
            <line x1="0" y1="0" x2="-19.1" y2="-11" stroke={primary} strokeWidth="0.9" strokeOpacity="0.22" />
          </g>

          {/* Tertiary Wireframe Hexagon (Lower-Left Accent) */}
          <g transform="translate(142, 115)">
            <polygon
              points="0,-26 22.5,-13 22.5,13 0,26 -22.5,13 -22.5,-13"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="3 4"
              strokeOpacity="0.26"
            />
            <line x1="0" y1="0" x2="0" y2="26" stroke="#38bdf8" strokeWidth="0.9" strokeOpacity="0.2" />
            <line x1="0" y1="0" x2="22.5" y2="-13" stroke="#38bdf8" strokeWidth="0.9" strokeOpacity="0.2" />
            <line x1="0" y1="0" x2="-22.5" y2="-13" stroke="#38bdf8" strokeWidth="0.9" strokeOpacity="0.2" />
            <circle cx="0" cy="0" r="2" fill={primary} fillOpacity="0.35" />
          </g>

          {/* Rotated Diamond / Precision Target Node */}
          <g transform="translate(138, 26) rotate(45)">
            <rect
              x="-16"
              y="-16"
              width="32"
              height="32"
              fill={`url(#${id}-shape-grad1)`}
              stroke={primary}
              strokeWidth="1.2"
              strokeOpacity="0.25"
              rx="3"
            />
            <circle cx="0" cy="0" r="2.5" fill={primary} fillOpacity="0.4" />
            <line x1="-20" y1="0" x2="20" y2="0" stroke={primary} strokeWidth="0.8" strokeDasharray="2 2" strokeOpacity="0.24" />
            <line x1="0" y1="-20" x2="0" y2="20" stroke={primary} strokeWidth="0.8" strokeDasharray="2 2" strokeOpacity="0.24" />
          </g>

          {/* Constellation Nodes & Connecting Dotted Vector Rays */}
          <circle cx="24" cy="18" r="3" fill="#38bdf8" fillOpacity="0.38" />
          <line x1="24" y1="18" x2="68" y2="34" stroke={primary} strokeWidth="0.9" strokeDasharray="3 3" strokeOpacity="0.22" />

          <circle cx="138" cy="26" r="3.2" fill={primary} fillOpacity="0.35" />
          <line x1="106.1" y1="34" x2="138" y2="26" stroke={primary} strokeWidth="0.9" strokeDasharray="2 3" strokeOpacity="0.24" />

          <circle cx="142" cy="115" r="2.8" fill="#38bdf8" fillOpacity="0.36" />
          <line x1="68" y1="100" x2="142" y2="115" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="3 3" strokeOpacity="0.2" />

          {/* Precision Alignment Crosshairs and Marks */}
          <g transform="translate(-10, 80)">
            <line x1="-7" y1="0" x2="7" y2="0" stroke={primary} strokeWidth="1.1" strokeOpacity="0.32" />
            <line x1="0" y1="-7" x2="0" y2="7" stroke={primary} strokeWidth="1.1" strokeOpacity="0.32" />
          </g>

          <g transform="translate(195, 65)">
            <line x1="-6" y1="0" x2="6" y2="0" stroke={primary} strokeWidth="1" strokeOpacity="0.25" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke={primary} strokeWidth="1" strokeOpacity="0.25" />
            <circle cx="0" cy="0" r="1.5" fill={primary} fillOpacity="0.35" />
          </g>

          {/* Coordinate Angle Degree Arc */}
          <path
            d="M 170 30 A 90 90 0 0 1 200 85"
            fill="none"
            stroke={primary}
            strokeWidth="0.85"
            strokeDasharray="2 4"
            strokeOpacity="0.18"
          />
        </g>
      </svg>
    </div>
  );
};

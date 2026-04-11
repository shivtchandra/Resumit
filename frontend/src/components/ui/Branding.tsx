"use client";

import React from "react";

/* ── Glass Pill ── */
type GlassPillProps = {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
};

const sizeMap = {
  sm: { padding: "5px 14px", fontSize: "9px", letterSpacing: "0.16em" },
  md: { padding: "8px 18px", fontSize: "10px", letterSpacing: "0.18em" },
  lg: { padding: "10px 24px", fontSize: "12px", letterSpacing: "0.20em" },
} as const;

export function GlassPill({ children, size = "md", className = "", style }: GlassPillProps) {
  const sz = sizeMap[size];
  return (
    <span
      className={`glass-pill ${className}`}
      style={{ padding: sz.padding, fontSize: sz.fontSize, letterSpacing: sz.letterSpacing, ...style }}
    >
      {children}
    </span>
  );
}

/* ── Display Heading (Instrument Serif) ── */
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "p" | "span";

type DisplayHeadingProps = {
  children: React.ReactNode;
  as?: HeadingTag;
  muted?: boolean;          // renders in muted colour
  className?: string;
  style?: React.CSSProperties;
};

export function DisplayHeading({
  children,
  as: Tag = "h2",
  muted = false,
  className = "",
  style,
}: DisplayHeadingProps) {
  return (
    <Tag
      className={`display-heading ${className}`}
      style={{
        color: muted ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.92)",
        lineHeight: 1.05,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

export function TekDevBadge({ fixed = false }: { fixed?: boolean }) {
  const pill = (
    <a
      href="https://tekkdevv.com"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "9999px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(3,2,8,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: "7px 16px 7px 14px",
        textDecoration: "none",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(3,2,8,0.88)";
        (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(3,2,8,0.72)";
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
    >
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.38)",
      }}>
        Built by
      </span>
      <span style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: "15px",
        fontWeight: 400,
        color: "rgba(255,255,255,0.82)",
        letterSpacing: "-0.2px",
        lineHeight: 1,
      }}>
        TekkDevv
      </span>
    </a>
  );

  if (fixed) {
    return (
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 100 }}>
        {pill}
      </div>
    );
  }

  return pill;
}

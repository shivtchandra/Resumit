import { useId } from 'react';

/** 16:9-style night landscape — public/landing-hero-bg.png (subject right, sky left) */
export const LANDING_HERO_IMAGE = '/dreamy_hero_bg.jpg';

/** Sparse coords in viewBox 0–100; radii small for soft pinpoints */
const STAR_POINTS: [number, number, number][] = [
    [8, 10, 0.12],
    [14, 18, 0.1],
    [22, 8, 0.14],
    [11, 28, 0.09],
    [19, 35, 0.11],
    [28, 22, 0.1],
    [32, 14, 0.13],
    [6, 42, 0.08],
    [17, 48, 0.1],
    [26, 40, 0.09],
    [34, 32, 0.12],
    [12, 55, 0.08],
    [24, 52, 0.11],
    [31, 58, 0.09],
    [38, 44, 0.1],
    [9, 62, 0.07],
    [20, 68, 0.09],
    [29, 72, 0.08],
    [15, 78, 0.1],
    [33, 66, 0.09],
];

/**
 * Cinematic hero: DOF-blurred photo, strong left read lane, soft star veil (glow),
 * muted palette, smooth fade to navy — SaaS UI integrated, not pasted.
 */
export function LandingDreamyHeroBackdrop() {
    const gid = useId().replace(/:/g, '');
    const filterGlow = `hero-star-glow-${gid}`;

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {/* Photo plane — depth-of-field; subject stays right via anchor */}
            <div className="landing-hero-photo-plane absolute inset-[-12px] will-change-transform">
                <div
                    className="absolute inset-0 bg-cover bg-no-repeat brightness-[0.85] saturate-[1.1] contrast-[1.05]"
                    style={{
                        backgroundImage: `url(${LANDING_HERO_IMAGE})`,
                        backgroundPosition: 'center 22%',
                    }}
                />
            </div>

            {/* Left text zone: extra matte so headline area stays minimal / low detail */}
            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background: `linear-gradient(
            90deg,
            rgba(3, 6, 18, 0.42) 0%,
            rgba(5, 10, 25, 0.22) 38%,
            transparent 62%
          )`,
                }}
            />

            {/* Primary read lane — dark navy for type */}
            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background: `linear-gradient(
            to right,
            rgba(5, 10, 25, 0.97) 0%,
            rgba(5, 10, 25, 0.9) 28%,
            rgba(5, 10, 25, 0.48) 56%,
            rgba(5, 10, 25, 0.06) 80%,
            transparent 100%
          )`,
                }}
            />

            {/* Zenith wash — deep blue night sky */}
            <div className="absolute inset-0 z-[1] bg-linear-to-b from-[#0a1020]/48 via-transparent to-transparent" />

            {/* Stars are in the image itself — no redundant SVG overlay needed now */}

            {/* Warm accent — right, ties UI amber; very soft */}
            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background:
                        'radial-gradient(circle at 74% 76%, rgba(255, 185, 90, 0.09) 0%, transparent 44%)',
                }}
            />

            <div
                className="absolute inset-0 z-[1] opacity-55"
                style={{
                    background:
                        'radial-gradient(ellipse 100% 50% at 50% 100%, rgba(253, 186, 116, 0.038) 0%, transparent 56%)',
                }}
            />

            {/* Right column balance */}
            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background:
                        'linear-gradient(270deg, rgba(5, 10, 25, 0.38) 0%, rgba(5, 10, 25, 0.08) 36%, transparent 66%)',
                }}
            />

            {/* Fade into page navy */}
            <div className="absolute inset-0 z-[2] bg-linear-to-b from-transparent via-transparent to-[#05070A]/94" />
        </div>
    );
}

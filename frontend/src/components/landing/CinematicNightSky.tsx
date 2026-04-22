import { useId } from 'react';

/**
 * Abstract full-viewport night sky using dreamy_hero_bg.jpg.
 * Top half for hero, bottom half for page background.
 */
export const DREAMY_BG_IMAGE = '/dreamy_hero_bg.jpg';
/** ViewBox 0–100: r in ~0.04–0.11 keeps stars minimal on all screens */
const STAR_SEEDS: [number, number, number, number][] = [
    [8, 6, 0.07, 0.14],
    [18, 14, 0.055, 0.1],
    [32, 9, 0.08, 0.12],
    [44, 18, 0.06, 0.09],
    [58, 7, 0.075, 0.11],
    [71, 15, 0.058, 0.08],
    [84, 5, 0.065, 0.1],
    [93, 22, 0.052, 0.07],
    [12, 28, 0.078, 0.13],
    [27, 34, 0.056, 0.09],
    [39, 26, 0.082, 0.11],
    [52, 31, 0.06, 0.08],
    [66, 24, 0.068, 0.1],
    [78, 35, 0.054, 0.07],
    [91, 29, 0.07, 0.09],
    [7, 42, 0.076, 0.12],
    [22, 48, 0.057, 0.08],
    [35, 44, 0.062, 0.1],
    [48, 51, 0.085, 0.13],
    [61, 46, 0.059, 0.09],
    [74, 52, 0.066, 0.1],
    [88, 41, 0.055, 0.08],
    [15, 58, 0.072, 0.11],
    [33, 63, 0.053, 0.07],
    [46, 59, 0.08, 0.12],
    [59, 66, 0.06, 0.09],
    [72, 61, 0.058, 0.08],
    [86, 57, 0.07, 0.1],
    [9, 72, 0.065, 0.1],
    [28, 78, 0.052, 0.07],
    [41, 74, 0.075, 0.11],
    [54, 81, 0.06, 0.09],
    [67, 76, 0.064, 0.1],
    [81, 83, 0.051, 0.07],
    [95, 71, 0.068, 0.09],
    [19, 88, 0.074, 0.11],
    [38, 92, 0.056, 0.08],
    [55, 89, 0.063, 0.1],
    [73, 94, 0.058, 0.09],
    [90, 87, 0.061, 0.1],
];

export function CinematicNightSky() {
    const blurId = useId().replace(/:/g, '');
    const filterId = `star-soft-${blurId}`;

    return (
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
            {/* Base wash — matches hero extension (#05070A / #0B1120) */}
            {/* Base image layer — bottom half of the dreamy composition */}
            <div 
                className="absolute inset-0 bg-cover bg-no-repeat opacity-40 grayscale-[0.2] brightness-[0.6]"
                style={{
                    backgroundImage: `url(${DREAMY_BG_IMAGE})`,
                    backgroundPosition: 'center bottom',
                }}
            />

            <div
                className="absolute inset-0 bg-linear-to-b from-[#0B1120] via-transparent to-[#030508]"
                style={{ opacity: 0.92 }}
            />

            {/* Soft zenith glow (cool moonlight) */}
            <div
                className="absolute inset-0 opacity-70"
                style={{
                    background:
                        'radial-gradient(ellipse 85% 55% at 50% -5%, rgba(125, 211, 252, 0.09) 0%, transparent 55%)',
                }}
            />

            {/* Very subtle horizon warmth — echoes prior amber scene without competing */}
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    background:
                        'radial-gradient(ellipse 100% 45% at 50% 100%, rgba(180, 83, 9, 0.045) 0%, transparent 50%)',
                }}
            />

            {/* Side depth — smooth vignette for readability */}
            <div
                className="absolute inset-0 opacity-90"
                style={{
                    background:
                        'radial-gradient(ellipse 95% 80% at 50% 45%, transparent 0%, rgba(2, 3, 8, 0.55) 100%)',
                }}
            />

            {/* Minimal stars */}
            <svg
                className="absolute inset-0 h-full w-full opacity-[0.32]"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <title>Night sky</title>
                {STAR_SEEDS.map(([cx, cy, r, o], i) => (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="rgb(226 232 240)" opacity={o} />
                ))}
            </svg>

            {/* Micro-glow on a few brighter points */}
            <svg
                className="absolute inset-0 h-full w-full opacity-[0.12]"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" />
                    </filter>
                </defs>
                {[
                    [48, 14],
                    [27, 31],
                    [71, 22],
                    [15, 48],
                    [59, 66],
                ].map(([cx, cy], i) => (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={0.08}
                        fill="rgb(254 252 232)"
                        opacity={0.35}
                        filter={`url(#${filterId})`}
                    />
                ))}
            </svg>

            {/* Bottom grounding — barely deepens toward scroll edge */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#05070A]/45" />
        </div>
    );
}

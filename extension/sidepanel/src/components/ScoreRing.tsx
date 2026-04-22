interface Props {
  score: number; // 0–100
  size?: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#14b8a6';
  if (score >= 40) return '#f59e0b';
  return '#f87171';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Needs Work';
  return 'Poor Match';
}

export function ScoreRing({ score, size = 120 }: Props) {
  const r = size * 0.42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        }} />
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={size * 0.07}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={size * 0.07}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.4s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size * 0.24, fontWeight: 900, color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: size * 0.09, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
            Match
          </span>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>
        {scoreLabel(score)}
      </span>
    </div>
  );
}

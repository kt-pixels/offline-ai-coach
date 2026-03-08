function ProgressRing({ value = 0, max = 100, label = 'Progress', sublabel }) {
  const clamped = Math.max(0, Math.min(value, max));
  const radius = 56;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clamped / max) * circumference;

  return (
    <div className="relative h-32 w-32">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="rgba(148,163,184,0.2)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f8dff" />
            <stop offset="100%" stopColor="#28d8c4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="font-sans text-xl font-semibold text-slate-100">{Math.round((clamped / max) * 100)}%</p>
        <p className="text-[11px] text-slate-400">{label}</p>
        {sublabel ? <p className="mt-1 text-[10px] text-slate-500">{sublabel}</p> : null}
      </div>
    </div>
  );
}

export default ProgressRing;

function ProgressRing({ value = 0, max = 100, label = 'Progress' }) {
  const safeValue = Math.min(max, Math.max(0, value));
  const radius = 52;
  const stroke = 9;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeValue / max) * circumference;

  return (
    <div className="progress-ring">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="url(#ringGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38f2d0" />
            <stop offset="100%" stopColor="#31a7ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ring-center">
        <strong>{Math.round((safeValue / max) * 100)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default ProgressRing;

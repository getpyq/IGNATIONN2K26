export function ChanduaCrown({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M0 24C14 24 14 6 28 6C42 6 42 24 56 24C70 24 70 6 84 6C98 6 98 24 112 24C126 24 126 6 140 6C154 6 154 24 168 24C182 24 182 6 196 6C210 6 210 24 224 24C238 24 238 6 252 6C266 6 266 24 280 24"
        stroke="#1b1b1b"
        strokeWidth="2.5"
        fill="#e0a526"
      />
      {[28, 84, 140, 196, 252].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy={15}
          r={3.5}
          fill="#8e1b1b"
          stroke="#1b1b1b"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

export function ChanduaMedallion({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="40"
        cy="40"
        r="36"
        fill="#8e1b1b"
        stroke="#1b1b1b"
        strokeWidth="2.5"
      />
      <circle
        cx="40"
        cy="40"
        r="27"
        fill="#fff4e2"
        stroke="#1b1b1b"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <polygon
        points="40,14 47,33 66,40 47,47 40,66 33,47 14,40 33,33"
        fill="#e0a526"
        stroke="#1b1b1b"
        strokeWidth="2"
      />
      <circle
        cx="40"
        cy="40"
        r="6"
        fill="#3e9b47"
        stroke="#1b1b1b"
        strokeWidth="2"
      />
    </svg>
  );
}

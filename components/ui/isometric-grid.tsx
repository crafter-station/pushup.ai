export function IsometricGrid() {
  // Generate isometric hex grid lines using SVG
  const size = 40;
  const h = size * Math.sqrt(3);

  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="iso-grid"
          width={size * 2}
          height={h}
          patternUnits="userSpaceOnUse"
        >
          {/* Isometric diamond lines */}
          <line
            x1={0}
            y1={h / 2}
            x2={size}
            y2={0}
            stroke="var(--grid)"
            strokeWidth="0.5"
          />
          <line
            x1={size}
            y1={0}
            x2={size * 2}
            y2={h / 2}
            stroke="var(--grid)"
            strokeWidth="0.5"
          />
          <line
            x1={0}
            y1={h / 2}
            x2={size}
            y2={h}
            stroke="var(--grid)"
            strokeWidth="0.5"
          />
          <line
            x1={size}
            y1={h}
            x2={size * 2}
            y2={h / 2}
            stroke="var(--grid)"
            strokeWidth="0.5"
          />
          {/* Horizontal center line */}
          <line
            x1={0}
            y1={h / 2}
            x2={size * 2}
            y2={h / 2}
            stroke="var(--grid)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#iso-grid)" />
    </svg>
  );
}

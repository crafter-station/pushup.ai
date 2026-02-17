export function LenticularStripes() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {/* Layer 1 — Silhouette: radial gradients suggesting head + torso */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 18% 14% at 50% 30%, #3A3A3A 0%, transparent 100%)",
            "radial-gradient(ellipse 28% 30% at 50% 55%, #2A2A2A 0%, transparent 100%)",
            "radial-gradient(ellipse 16% 10% at 42% 44%, #333333 0%, transparent 100%)",
            "radial-gradient(ellipse 16% 10% at 58% 44%, #333333 0%, transparent 100%)",
          ].join(", "),
        }}
      />

      {/* Layer 2 — Vertical stripes: corrugated glass effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(0,0,0,0.85) 3px, rgba(0,0,0,0.85) 5px)",
        }}
      />
    </div>
  );
}

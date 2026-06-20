import React from 'react';

// A KIE (Kőszegi Időjárás Előrejelzés) örvény-jelképe SVG-ként újraépítve.
// Egy befelé tartó spirál (~3,5 fordulat) + egy különálló pont — a stroke
// `currentColor`-t használ, így gradiens fölött fehéren, máshol színesen is jó.
function buildSpiral(cx, cy, rStart, rEnd, turns, steps) {
  const pts = [];
  const totalAngle = turns * 2 * Math.PI;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = -Math.PI / 2 + t * totalAngle; // felülről indul
    const r = rStart + (rEnd - rStart) * t;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
}

export default function Logo({ className = 'w-6 h-6', strokeWidth = 6 }) {
  const spiral = buildSpiral(50, 50, 42, 5, 3.5, 240);
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <path
        d={spiral}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="66" r={strokeWidth * 0.85} fill="currentColor" />
    </svg>
  );
}

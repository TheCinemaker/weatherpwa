import React from 'react';

// Vékony "HUD" csík, rajta egy fénylő ponttal — azonnali vizuális kontextust
// ad egy számérték mellé (mennyire hideg/meleg, mennyire szeles), anélkül,
// hogy külön grafikont vagy oldalt kellene nyitni hozzá.

const DOT_STYLE = (leftPct) => ({
  left: `${leftPct}%`,
  transform: 'translate(-50%, -50%)',
  boxShadow: '0 0 8px 2px rgba(255,255,255,0.65), 0 0 2px rgba(255,255,255,0.9)',
});

// Kétpólusú skála, 0 középen: balra hidegben kékül, jobbra melegben pirosodik.
// Nem szimmetrikus tartomány (-25..0 és 0..40), mert a 0°C-nak középen a helye,
// függetlenül attól, hogy a két oldal fokban nem egyenlő hosszú.
export function TempGauge({ value, min = -25, max = 40 }) {
  if (value == null) return null;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = clamped <= 0 ? ((clamped - min) / (0 - min)) * 50 : 50 + (clamped / max) * 50;
  return (
    <div className="relative mt-2" aria-hidden="true">
      <div
        className="relative h-1.5 rounded-full overflow-visible"
        style={{ background: 'linear-gradient(90deg, #22d3ee 0%, #93c5fd 25%, #e5e7eb 50%, #fcd34d 75%, #f87171 100%)' }}
      >
        {/* nulla fok jelző csík középen */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-black/25" />
        <div className="absolute top-1/2 w-3 h-3 rounded-full bg-white border border-white/70" style={DOT_STYLE(pct)} />
      </div>
    </div>
  );
}

// Egypólusú skála 0-tól a megadott maximumig (alapértelmezett 120 km/h — nagyjából
// a széllökés-rekordok tartománya nálunk), nyugodttól viharosig balról jobbra.
export function WindGauge({ value, max = 120 }) {
  if (value == null) return null;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="relative mt-2" aria-hidden="true">
      <div
        className="relative h-1.5 rounded-full overflow-visible"
        style={{ background: 'linear-gradient(90deg, #5eead4 0%, #fcd34d 55%, #f87171 100%)' }}
      >
        <div className="absolute top-1/2 w-3 h-3 rounded-full bg-white border border-white/70" style={DOT_STYLE(pct)} />
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Flame,
  Droplet
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

// Élénk gradiens-paletta: minden metrika két-színű átmenetet kap.
export const CHART_CONFIGS = [
  { key: 'T',          label: 'Hőmérséklet',  icon: Thermometer, unit: '°C',  grad: ['#5eead4', '#0891b2'] },
  { key: 'U',          label: 'Páratartalom', icon: Droplets,    unit: '%',   grad: ['#22d3ee', '#06b6d4'] },
  { key: 'FF',         label: 'Szélsebesség', icon: Wind,        unit: 'km/h',grad: ['#5eead4', '#14b8a6'] },
  { key: 'FXY',        label: 'Széllökések',  icon: Wind,        unit: 'km/h',grad: ['#67e8f9', '#0d9488'] },
  { key: 'SLP',        label: 'Légnyomás',    icon: Gauge,       unit: 'hPa', grad: ['#38bdf8', '#06b6d4'] },
  { key: 'RR_1H',      label: 'Csapadék 1h',  icon: CloudRain,   unit: 'mm',  grad: ['#22d3ee', '#0d9488'], type: 'bar' },
  { key: 'HEAT_INDEX', label: 'Hőérzet',      icon: Flame,       unit: '°C',  grad: ['#67e8f9', '#0ea5e9'] },
  { key: 'HUMIDEX',    label: 'Humidex',       icon: Droplet,     unit: '',    grad: ['#38bdf8', '#0d9488'] },
];

// Hex → rgba segéd az áttetsző kitöltésekhez
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Megosztott chart-építők, hogy a ChartCard és a részletező modal ugyanazt használja.
export function makeChartData(config, timestamps, data) {
  if (!timestamps || !data || data.length === 0) return null;
  const { grad, type } = config;
  const [c0, c1] = grad;
  const isBar = type === 'bar';
  return {
    labels: timestamps,
    datasets: [{
      data,
      // Vízszintes vonal-szín a metrika átmenetéből
      borderColor: (ctx) => {
        const { chart } = ctx;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return c0;
        const g = c.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        g.addColorStop(0, c0);
        g.addColorStop(1, c1);
        return g;
      },
      backgroundColor: isBar
        ? (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return hexA(c0, 0.8);
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, hexA(c0, 0.95));
            g.addColorStop(1, hexA(c1, 0.75));
            return g;
          }
        : (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return hexA(c0, 0.15);
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, hexA(c0, 0.35));
            g.addColorStop(1, hexA(c1, 0.0));
            return g;
          },
      borderWidth: isBar ? 0 : 3,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: c1,
      fill: !isBar,
      tension: 0.4,
      borderRadius: isBar ? 6 : 0,
      spanGaps: true,
    }]
  };
}

export function makeChartOptions(config) {
  const { unit } = config;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 22, 20, 0.95)',
        borderColor: 'rgba(34, 211, 238, 0.25)',
        borderWidth: 1,
        padding: 12,
        titleColor: 'rgba(255, 255, 255, 0.7)',
        bodyColor: 'rgba(255, 255, 255, 1)',
        cornerRadius: 14,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            return ` ${val !== null && val !== undefined ? val.toFixed(2) : '–'} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          maxTicksLimit: 6,
          maxRotation: 0,
          color: 'rgba(255, 255, 255, 0.85)',
          font: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 10, weight: '600' }
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.85)',
          font: { family: '"Plus Jakarta Sans", system-ui, sans-serif', size: 10, weight: '600' },
          callback: (value) => `${value}${unit ? ' ' + unit : ''}`
        }
      }
    }
  };
}

export default function ChartCard({ config, timestamps, data, loading }) {
  const { label, icon: Icon, grad, type } = config;
  const isBar = type === 'bar';
  const gradient = `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`;

  const hasData = useMemo(() => data && data.length > 0 && data.some(v => v !== null && v !== undefined), [data]);
  const chartData = useMemo(() => makeChartData(config, timestamps, data), [config, timestamps, data]);
  const options = useMemo(() => makeChartOptions(config), [config]);

  return (
    <div className="glass-card rounded-apple-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-apple-inner flex items-center justify-center text-white shadow-sm" style={{ background: gradient }}>
            <Icon className="w-[18px] h-[18px]" />
          </div>
          <span className="text-sm font-extrabold text-white">{label}</span>
        </div>
        <div className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-night-200/60 uppercase tracking-wider">
          24h
        </div>
      </div>
      <div className="relative h-[160px] w-full">
        {hasData && chartData ? (
          isBar ? <Bar data={chartData} options={options} /> : <Line data={chartData} options={options} />
        ) : loading ? (
          <div className="w-full h-full bg-white/[0.03] rounded-apple-inner flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border-[3px] border-cyan2-400 border-t-transparent animate-spin" />
            <span className="text-[10px] font-bold text-night-200/45 uppercase tracking-widest">Diagram betöltése...</span>
          </div>
        ) : (
          <div className="w-full h-full bg-white/[0.03] rounded-apple-inner flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs font-bold text-night-200/55 mb-1">Nincs mérési adat</span>
            <span className="text-[10px] text-night-200/45 max-w-[200px] leading-relaxed">
              Az elmúlt 24 órában nem érkezett adat ettől a szenzortól.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

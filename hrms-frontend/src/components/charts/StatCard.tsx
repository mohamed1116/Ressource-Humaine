import { useState, useEffect, useRef } from 'react';

function AnimatedNumber({ end, duration = 2000, separator = ',' }: { end: number; duration?: number; separator?: string }) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number>(0);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCurrent(Math.round(eased * end));
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [end, duration]);

  return <>{current.toLocaleString('fr-FR')}</>;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'teal' | 'pink' | 'indigo';
  suffix?: string;
  prefix?: string;
  trend?: { value: number; isUp: boolean };
}

const colorMap = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    iconBg: 'bg-blue-400/30',
    shadow: 'shadow-blue-500/25',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-400/30',
    shadow: 'shadow-emerald-500/25',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
    iconBg: 'bg-rose-400/30',
    shadow: 'shadow-rose-500/25',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    iconBg: 'bg-orange-400/30',
    shadow: 'shadow-orange-500/25',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    iconBg: 'bg-purple-400/30',
    shadow: 'shadow-purple-500/25',
  },
  teal: {
    bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
    iconBg: 'bg-teal-400/30',
    shadow: 'shadow-teal-500/25',
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-500 to-pink-600',
    iconBg: 'bg-pink-400/30',
    shadow: 'shadow-pink-500/25',
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-400/30',
    shadow: 'shadow-indigo-500/25',
  },
};

export default function StatCard({ title, value, icon, color, suffix, prefix, trend }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`${colors.bg} ${colors.shadow} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-lg">{prefix}</span>}
            <span className="text-3xl font-bold">
              <AnimatedNumber end={value} duration={2500} />
            </span>
            {suffix && <span className="text-lg ml-1">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center mt-2 text-sm">
              <span className={trend.isUp ? 'text-green-200' : 'text-red-200'}>
                {trend.isUp ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="text-white/60 ml-1">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={`${colors.iconBg} rounded-xl p-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

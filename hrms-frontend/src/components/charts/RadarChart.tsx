import { RadarChart as ReRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarChartProps {
  data: Array<Record<string, unknown>>;
  title?: string;
  radars: Array<{ dataKey: string; color: string; name: string }>;
  height?: number;
}

export default function RadarChart({ data, title, radars, height = 300 }: RadarChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ReRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
            }}
          />
          {radars.map((radar) => (
            <Radar
              key={radar.dataKey}
              name={radar.name}
              dataKey={radar.dataKey}
              stroke={radar.color}
              fill={radar.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

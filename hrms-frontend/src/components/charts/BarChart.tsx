import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BarChartProps {
  data: Array<Record<string, unknown>>;
  title?: string;
  bars: Array<{ dataKey: string; color: string; name: string }>;
  height?: number;
  stacked?: boolean;
}

export default function BarChart({ data, title, bars, height = 300, stacked = false }: BarChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart data={data} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={[6, 6, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

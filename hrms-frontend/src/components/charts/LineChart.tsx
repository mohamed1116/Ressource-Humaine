import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface LineChartProps {
  data: Array<{ name: string; value: number; value2?: number }>;
  title?: string;
  color?: string;
  color2?: string;
  height?: number;
  showArea?: boolean;
}

export default function LineChart({ data, title, color = '#3b82f6', color2, height = 300, showArea = true }: LineChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              {color2 && (
                <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color2} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color2} stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#colorValue)" />
            {color2 && (
              <Area type="monotone" dataKey="value2" stroke={color2} strokeWidth={2.5} fill="url(#colorValue2)" />
            )}
          </AreaChart>
        ) : (
          <ReLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 4 }} />
            {color2 && <Line type="monotone" dataKey="value2" stroke={color2} strokeWidth={2.5} />}
          </ReLineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

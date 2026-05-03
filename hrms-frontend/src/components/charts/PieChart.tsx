import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  title?: string;
  height?: number;
  donut?: boolean;
}

export default function PieChart({ data, title, height = 300, donut = false }: PieChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RePieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={donut ? 60 : 0}
            outerRadius={100}
            paddingAngle={donut ? 5 : 2}
            dataKey="value"
            animationBegin={0}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => <span className="text-gray-600 text-sm">{value}</span>}
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

export default function AgeSexChart({ data }) {
  // Transform data for butterfly/tornado chart: male goes negative
  const chartData = data.map((d) => ({
    ageGroup: d.ageGroup,
    Male: -d.male,
    Female: d.female,
  }));

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.male, d.female))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        New Users&apos; Age/Sex
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 10 }}
            domain={[-maxVal * 1.1, maxVal * 1.1]}
            tickFormatter={(v) => Math.abs(v)}
          />
          <YAxis
            type="category"
            dataKey="ageGroup"
            tick={{ fontSize: 10 }}
            width={40}
          />
          <Tooltip
            formatter={(value, name) => [Math.abs(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Male" fill="#3b82f6" radius={[2, 0, 0, 2]} />
          <Bar dataKey="Female" fill="#ec4899" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

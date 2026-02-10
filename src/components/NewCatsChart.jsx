import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function NewCatsChart({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">New Cats</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="newCatsStray" name="Stray" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
          <Bar dataKey="newCatsHome" name="Home" stackId="a" fill="#a855f7" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

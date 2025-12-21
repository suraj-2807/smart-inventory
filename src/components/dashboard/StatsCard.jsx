export default function StatsCard({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
      <p className="text-green-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

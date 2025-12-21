export default function TopHeader({ title }) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-6">
      
      {/* Left */}
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">
          {new Date().toDateString()}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="text-gray-600 hover:text-black">🔍</button>
        <button className="text-gray-600 hover:text-black">🔔</button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-300"></div>
          <div className="text-sm">
            <p className="font-medium">Admin</p>
            <p className="text-gray-500 text-xs">System Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

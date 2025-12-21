export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white p-5">
      <h1 className="text-xl font-bold mb-8">Smart Inventory</h1>

      <ul className="space-y-4">
        <li className="hover:text-blue-400 cursor-pointer">Dashboard</li>
        <li className="hover:text-blue-400 cursor-pointer">Products</li>
        <li className="hover:text-blue-400 cursor-pointer">Orders</li>
        <li className="hover:text-blue-400 cursor-pointer">Staff</li>
        <li className="hover:text-blue-400 cursor-pointer">Reports</li>
      </ul>
    </div>
  );
}

export default function Notifications() {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="font-semibold mb-4">Recent Notifications</h3>

      <ul className="space-y-3 text-sm">
        <li>📦 Stock updated for Rice</li>
        <li>🚚 Order #102 delivered</li>
        <li>🛒 New order received</li>
      </ul>
    </div>
  );
}

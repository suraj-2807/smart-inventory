const notifications = [
  {
    id: 1,
    text: "Stock updated for Rice",
    time: "2 min ago",
    type: "stock",
  },
  {
    id: 2,
    text: "Order #102 delivered",
    time: "10 min ago",
    type: "success",
  },
  {
    id: 3,
    text: "New order received",
    time: "1 hour ago",
    type: "order",
  },
];

export default function Notifications() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Recent Notifications</h3>

      <div className="space-y-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 border-b pb-3 last:border-none"
          >
            <span className="text-lg">
              {n.type === "stock" && "📦"}
              {n.type === "success" && "✅"}
              {n.type === "order" && "🛒"}
            </span>

            <div>
              <p className="text-sm font-medium">{n.text}</p>
              <span className="text-xs text-gray-400">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

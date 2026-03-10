import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import { Bell, Truck, Package, CheckCircle, Clock } from "lucide-react";

export default function DeliveryNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const notifs = [];
      const storeId = getStoreId();

      // Build store-scoped query
      const buildQ = (col) =>
        storeId
          ? query(collection(db, col), where("storeId", "==", storeId))
          : collection(db, col);

      const ordersSnapshot = await getDocs(buildQ("orders"));
      const orders = ordersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

      // Packed orders ready for delivery
      orders.filter(o => o.status === "PACKED").slice(0, 3).forEach(order => {
        notifs.push({
          id: `assign-${order.id}`,
          text: `Ready for delivery — ${order.customerName || "Unknown"}`,
          time: getRelativeTime(order.createdAt),
          icon: <Package size={16} className="text-[#0a66c2]" />,
        });
      });

      // Out for delivery
      orders.filter(o => o.status === "OUT_FOR_DELIVERY").slice(0, 3).forEach(order => {
        notifs.push({
          id: `ofd-${order.id}`,
          text: `Out for delivery — ${order.customerName || "Unknown"}`,
          time: getRelativeTime(order.createdAt),
          icon: <Truck size={16} className="text-amber-500" />,
        });
      });

      // Recently delivered
      orders.filter(o => o.status === "DELIVERED").slice(0, 2).forEach(order => {
        notifs.push({
          id: `done-${order.id}`,
          text: `Delivered to ${order.customerName || "customer"}`,
          time: getRelativeTime(order.createdAt),
          icon: <CheckCircle size={16} className="text-green-500" />,
        });
      });

      setNotifications(notifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Recently";
    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#f8726a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Delivery Updates</h3>
            <span className="text-xs bg-[#0a66c2]/10 text-[#0a66c2] px-2 py-0.5 rounded-full font-medium">
              {unreadCount}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell size={20} className="mx-auto mb-2" />
                <p className="text-xs">No delivery updates</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-none">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{n.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{n.text}</p>
                      <span className="text-xs text-gray-400">{n.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

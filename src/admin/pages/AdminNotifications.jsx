import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId, getStoreName } from "@/services/storeHelper";
import AdminLayout from "../layouts/AdminLayout";
import { Bell, Package, AlertTriangle, CheckCircle, Trash2, ShoppingCart, Users, Clock, FileSpreadsheet } from "lucide-react";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const storeId = getStoreId();
      const allNotifs = [];

      const buildQ = (col) =>
        storeId
          ? query(collection(db, col), where("storeId", "==", storeId))
          : collection(db, col);

      // Fetch from notifications collection
      const notifsQ = buildQ("notifications");
      const notifsSnapshot = await getDocs(notifsQ);
      notifsSnapshot.docs.forEach((d) => {
        const data = d.data();
        const time = data.createdAt?.toDate?.() || new Date();
        allNotifs.push({
          id: d.id,
          text: data.message || data.type,
          type: data.type || "info",
          time,
          timeStr: formatTime(time),
          source: "notification",
        });
      });

      // Fetch recent orders
      const ordersSnapshot = await getDocs(buildQ("orders"));
      ordersSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        })
        .slice(0, 20)
        .forEach((order) => {
          const time = order.createdAt?.toDate?.() || new Date();
          allNotifs.push({
            id: `order-${order.id}`,
            text: `Order from ${order.customerName || "Unknown"} — ₹${order.totalAmount || 0} (${order.status})`,
            type: order.status === "DELIVERED" ? "success" : order.status === "NEW" ? "order" : "info",
            time,
            timeStr: formatTime(time),
            source: "order",
          });
        });

      // Low stock
      const productsSnapshot = await getDocs(buildQ("products"));
      productsSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.stock !== undefined && p.stock <= 5)
        .forEach((product) => {
          allNotifs.push({
            id: `stock-${product.id}`,
            text: `Low stock: ${product.name} (${product.stock} left)`,
            type: "warning",
            time: new Date(),
            timeStr: "Active",
            source: "stock",
          });
        });

      // Sort by time descending
      allNotifs.sort((a, b) => b.time - a.time);
      setNotifications(allNotifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = async (notif) => {
    if (notif.source !== "notification") return;
    try {
      await deleteDoc(doc(db, "notifications", notif.id));
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "order": return <ShoppingCart size={18} className="text-[#0a66c2]" />;
      case "success": return <CheckCircle size={18} className="text-green-500" />;
      case "warning": return <AlertTriangle size={18} className="text-[#f8726a]" />;
      case "product_created": return <Package size={18} className="text-blue-500" />;
      case "product_imported": return <FileSpreadsheet size={18} className="text-green-600" />;
      case "staff_added": return <Users size={18} className="text-purple-500" />;
      case "stock_updated": return <AlertTriangle size={18} className="text-amber-500" />;
      default: return <Bell size={18} className="text-gray-400" />;
    }
  };

  const filtered = filter === "all"
    ? notifications
    : notifications.filter((n) => {
        if (filter === "orders") return n.source === "order";
        if (filter === "stock") return n.source === "stock" || n.type === "stock_updated";
        if (filter === "system") return n.source === "notification";
        return true;
      });

  if (loading) {
    return (
      <AdminLayout title="Notifications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a66c2]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Notifications">
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {["all", "orders", "stock", "system"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-[#0a66c2] text-white shadow-lg shadow-[#0a66c2]/25"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Notification list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{notif.text}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {notif.timeStr}
                  </p>
                </div>
                {notif.source === "notification" && (
                  <button
                    onClick={() => handleDelete(notif)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getStoreId } from "@/services/storeHelper";
import DeliveryLayout from "../layouts/DeliveryLayout";
import { Truck, CheckCircle, Package, Phone, MapPin, User, Clock } from "lucide-react";

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, assigned, out_for_delivery

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const storeId = getStoreId();
      const q = storeId ? query(collection(db, "orders"), where("storeId", "==", storeId)) : collection(db, "orders");
      const ordersSnapshot = await getDocs(q);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get delivery-relevant orders
      const deliveryOrders = allOrders.filter(
        o => o.status === "ASSIGNED_TO_DELIVERY" || o.status === "OUT_FOR_DELIVERY"
      ).sort((a, b) => {
        const dateA = a.assignedAt?.toDate ? a.assignedAt.toDate() : new Date(0);
        const dateB = b.assignedAt?.toDate ? b.assignedAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      setOrders(deliveryOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleMarkOutForDelivery = async (orderId) => {
    if (!confirm("Mark this order as Out for Delivery?")) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "OUT_FOR_DELIVERY",
        outForDeliveryAt: new Date(),
      });
      alert("✅ Order marked as Out for Delivery!");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    if (!confirm("Mark this order as Delivered? This action cannot be undone.")) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "DELIVERED",
        deliveredAt: new Date(),
      });
      alert("✅ Order delivered successfully!");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (filter === "assigned") return orders.filter(o => o.status === "ASSIGNED_TO_DELIVERY");
    if (filter === "out_for_delivery") return orders.filter(o => o.status === "OUT_FOR_DELIVERY");
    return orders;
  };

  const filteredOrders = getFilteredOrders();

  return (
    <DeliveryLayout title="My Deliveries">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          My Deliveries
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {orders.filter(o => o.status === "ASSIGNED_TO_DELIVERY").length} assigned •{" "}
          {orders.filter(o => o.status === "OUT_FOR_DELIVERY").length} out for delivery
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex gap-2">
          {[
            { key: "all", label: "All", count: orders.length },
            { key: "assigned", label: "Assigned", count: orders.filter(o => o.status === "ASSIGNED_TO_DELIVERY").length },
            { key: "out_for_delivery", label: "Out for Delivery", count: orders.filter(o => o.status === "OUT_FOR_DELIVERY").length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f.key
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No deliveries found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No orders are currently assigned for delivery
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const total = order.items?.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ) || 0;
            const isAssigned = order.status === "ASSIGNED_TO_DELIVERY";
            const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg">
                        {order.customerName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {order.customerName || "Unknown"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.items?.length || 0} items • ₹{total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isAssigned
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                    }`}>
                      ● {isAssigned ? "Assigned" : "Out for Delivery"}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-6 space-y-3">
                  {order.customerPhone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <a href={`tel:${order.customerPhone}`} className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400">
                        {order.customerPhone}
                      </a>
                    </div>
                  )}

                  {(order.customerAddress || order.customerCity) && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {order.customerAddress}
                        {order.customerCity && `, ${order.customerCity}`}
                        {order.customerState && `, ${order.customerState}`}
                        {order.customerPincode && ` - ${order.customerPincode}`}
                      </span>
                    </div>
                  )}

                  {order.assignedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400">
                        Assigned {order.assignedAt?.toDate
                          ? order.assignedAt.toDate().toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ""}
                      </span>
                    </div>
                  )}

                  {/* Items preview */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Order Items</p>
                    {order.items?.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Total & Actions */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">Total Amount</span>
                    <span className="text-gray-900 dark:text-gray-100 text-lg">₹{total.toFixed(2)}</span>
                  </div>

                  {isAssigned && (
                    <button
                      onClick={() => handleMarkOutForDelivery(order.id)}
                      disabled={loading}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Truck size={18} />
                      Start Delivery
                    </button>
                  )}

                  {isOutForDelivery && (
                    <button
                      onClick={() => handleMarkDelivered(order.id)}
                      disabled={loading}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DeliveryLayout>
  );
}

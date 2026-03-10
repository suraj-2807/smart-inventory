import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getStoreId } from "@/services/storeHelper";
import DeliveryLayout from "../layouts/DeliveryLayout";
import { CheckCircle, Calendar, Truck, Search } from "lucide-react";

export default function DeliveryHistory() {
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  const fetchDeliveredOrders = async () => {
    try {
      const storeId = getStoreId();
      const q = storeId ? query(collection(db, "orders"), where("storeId", "==", storeId)) : collection(db, "orders");
      const snapshot = await getDocs(q);
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const delivered = allOrders
        .filter(o => o.status === "DELIVERED")
        .sort((a, b) => {
          const dateA = a.deliveredAt?.toDate ? a.deliveredAt.toDate() : new Date(0);
          const dateB = b.deliveredAt?.toDate ? b.deliveredAt.toDate() : new Date(0);
          return dateB - dateA;
        });

      setDeliveredOrders(delivered);
    } catch (error) {
      console.error("Error fetching delivered orders:", error);
    }
  };

  const getFilteredOrders = () => {
    let filtered = deliveredOrders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === "today") {
      filtered = filtered.filter(order => {
        const deliveredDate = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : null;
        return deliveredDate && deliveredDate >= today;
      });
    } else if (dateFilter === "week") {
      filtered = filtered.filter(order => {
        const deliveredDate = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : null;
        return deliveredDate && deliveredDate >= weekAgo;
      });
    } else if (dateFilter === "month") {
      filtered = filtered.filter(order => {
        const deliveredDate = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : null;
        return deliveredDate && deliveredDate >= monthAgo;
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const stats = {
    total: deliveredOrders.length,
    today: deliveredOrders.filter(order => {
      const deliveredDate = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deliveredDate && deliveredDate >= today;
    }).length,
    thisWeek: deliveredOrders.filter(order => {
      const deliveredDate = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : null;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      return deliveredDate && deliveredDate >= weekAgo;
    }).length,
  };

  return (
    <DeliveryLayout title="Delivery History">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Delivery History
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View all completed deliveries
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Delivered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivered Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="flex gap-2">
            {["all", "today", "week", "month"].map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                  dateFilter === f
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No delivery history found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || dateFilter !== "all"
              ? "Try adjusting your filters"
              : "Completed deliveries will appear here"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Delivered Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order, idx) => {
                  const total = order.items?.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ) || 0;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm font-semibold">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {order.customerName || "Unknown"}
                          </p>
                          {order.customerPhone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {order.customerPhone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {order.items?.length || 0} items
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {order.deliveredAt?.toDate ? (
                            <>
                              <p>{order.deliveredAt.toDate().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {order.deliveredAt.toDate().toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          ₹{total.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          ● Delivered
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DeliveryLayout>
  );
}

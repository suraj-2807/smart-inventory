import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import StaffLayout from "../layouts/StaffLayout";
import { Package, Calendar, CheckCircle, Search } from "lucide-react";

export default function StaffHistory() {
  const [packedOrders, setPackedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

  useEffect(() => {
    fetchPackedOrders();
  }, []);

  const fetchPackedOrders = async () => {
    try {
      const storeId = getStoreId();
      const q = storeId ? query(collection(db, "orders"), where("storeId", "==", storeId)) : collection(db, "orders");
      const snapshot = await getDocs(q);
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get orders that have been packed or beyond
      const packed = allOrders.filter(o => 
        o.status === "PACKED" || 
        o.status === "ASSIGNED_TO_DELIVERY" ||
        o.status === "OUT_FOR_DELIVERY" ||
        o.status === "DELIVERED"
      ).sort((a, b) => {
        // Sort by packedAt date, most recent first
        const dateA = a.packedAt?.toDate() || new Date(0);
        const dateB = b.packedAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      setPackedOrders(packed);
    } catch (error) {
      console.error("Error fetching packed orders:", error);
    }
  };

  const getFilteredOrders = () => {
    let filtered = packedOrders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === "today") {
      filtered = filtered.filter(order => {
        const packedDate = order.packedAt?.toDate();
        return packedDate && packedDate >= today;
      });
    } else if (dateFilter === "week") {
      filtered = filtered.filter(order => {
        const packedDate = order.packedAt?.toDate();
        return packedDate && packedDate >= weekAgo;
      });
    } else if (dateFilter === "month") {
      filtered = filtered.filter(order => {
        const packedDate = order.packedAt?.toDate();
        return packedDate && packedDate >= monthAgo;
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700 border-green-200";
      case "OUT_FOR_DELIVERY":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "ASSIGNED_TO_DELIVERY":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "PACKED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "DELIVERED":
        return "Delivered";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      case "ASSIGNED_TO_DELIVERY":
        return "Assigned to Delivery";
      case "PACKED":
        return "Packed";
      default:
        return status;
    }
  };

  // Stats
  const stats = {
    total: packedOrders.length,
    today: packedOrders.filter(order => {
      const packedDate = order.packedAt?.toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return packedDate && packedDate >= today;
    }).length,
    delivered: packedOrders.filter(o => o.status === "DELIVERED").length,
  };

  return (
    <StaffLayout title="Packed History">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Packed Orders History
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View all orders you have packed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Packed</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Packed Today</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by customer or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Date Filter */}
          <div className="flex gap-2">
            {["all", "today", "week", "month"].map(filter => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                  dateFilter === filter
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No packed orders found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || dateFilter !== "all" 
              ? "Try adjusting your filters"
              : "Start packing orders to see them here"}
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
                    Packed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {order.customerName || "Unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {order.items?.length || 0} items
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {order.packedAt?.toDate() ? (
                            <>
                              <p>{order.packedAt.toDate().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {order.packedAt.toDate().toLocaleTimeString('en-US', {
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          ● {getStatusDisplay(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          ₹{total.toFixed(2)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
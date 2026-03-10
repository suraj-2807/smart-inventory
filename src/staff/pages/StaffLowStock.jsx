import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import StaffLayout from "../layouts/StaffLayout";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";

export default function StaffLowStock() {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const storeId = getStoreId();
      const q = storeId ? query(collection(db, "products"), where("storeId", "==", storeId)) : collection(db, "products");
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);

      // Filter low stock products
      const lowStock = data.filter(p => {
        const limit = p.lowStockLimit || 10;
        return p.stock <= limit;
      }).sort((a, b) => a.stock - b.stock); // Sort by stock (lowest first)

      setLowStockProducts(lowStock);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const getUrgencyLevel = (product) => {
    const limit = product.lowStockLimit || 10;
    const percentage = (product.stock / limit) * 100;
    
    if (product.stock === 0) return "critical";
    if (percentage <= 25) return "urgent";
    if (percentage <= 50) return "warning";
    return "low";
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "critical":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-700 dark:text-red-400",
          badge: "bg-red-100 text-red-700 border-red-200"
        };
      case "urgent":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-200 dark:border-orange-800",
          text: "text-orange-700 dark:text-orange-400",
          badge: "bg-orange-100 text-orange-700 border-orange-200"
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-700 dark:text-yellow-400",
          badge: "bg-yellow-100 text-yellow-700 border-yellow-200"
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          text: "text-blue-700 dark:text-blue-400",
          badge: "bg-blue-100 text-blue-700 border-blue-200"
        };
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case "critical":
        return "Out of Stock";
      case "urgent":
        return "Urgent";
      case "warning":
        return "Warning";
      default:
        return "Low";
    }
  };

  return (
    <StaffLayout title="Low Stock Alerts">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Low Stock Alerts
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {lowStockProducts.length} products need attention
        </p>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            All stock levels are good
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No products currently below their low stock threshold
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {lowStockProducts.filter(p => p.stock === 0).length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Urgent</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {lowStockProducts.filter(p => {
                  const urgency = getUrgencyLevel(p);
                  return urgency === "urgent";
                }).length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Warning</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {lowStockProducts.filter(p => {
                  const urgency = getUrgencyLevel(p);
                  return urgency === "warning";
                }).length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {lowStockProducts.length}
              </p>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {lowStockProducts.map((product) => {
              const urgency = getUrgencyLevel(product);
              const colors = getUrgencyColor(urgency);
              const limit = product.lowStockLimit || 10;
              const percentage = product.stock === 0 ? 0 : (product.stock / limit) * 100;

              return (
                <div
                  key={product.id}
                  className={`${colors.bg} border ${colors.border} rounded-xl p-5`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={product.imageUrl || `https://ui-avatars.com/api/?name=${product.name}&background=random`}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.category || "General"} • ₹{product.price}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors.badge}`}>
                            {getUrgencyLabel(urgency)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Current Stock
                              </span>
                              <span className={`text-sm font-semibold ${colors.text}`}>
                                {product.stock} {product.unit || "pcs"}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  urgency === "critical" ? "bg-red-500" :
                                  urgency === "urgent" ? "bg-orange-500" :
                                  urgency === "warning" ? "bg-yellow-500" : "bg-blue-500"
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Low Stock Limit</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {limit} {product.unit || "pcs"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {product.stock === 0 && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                          ⚠️ Cannot fulfill orders - Immediate restocking required
                        </p>
                      </div>
                    </div>
                  )}

                  {urgency === "urgent" && product.stock > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-orange-600 dark:text-orange-400" />
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                          Only {product.stock} {product.unit || "pcs"} remaining - Restock soon
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </StaffLayout>
  );
}
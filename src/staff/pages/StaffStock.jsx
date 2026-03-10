import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import StaffLayout from "../layouts/StaffLayout";
import { Search, Package, AlertTriangle, CheckCircle, Pencil, X } from "lucide-react";

export default function StaffStock() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, low, ok
  const [editProduct, setEditProduct] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [updating, setUpdating] = useState(false);

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
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const getStockStatus = (product) => {
    const lowStockLimit = product.lowStockLimit || 10;
    if (product.stock === 0) return "out";
    if (product.stock <= lowStockLimit) return "low";
    return "ok";
  };

  const getStockColor = (status) => {
    switch (status) {
      case "out":
        return "bg-red-100 text-red-700 border-red-200";
      case "low":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "ok":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus === "low") {
      filtered = filtered.filter(p => {
        const status = getStockStatus(p);
        return status === "low" || status === "out";
      });
    } else if (filterStatus === "ok") {
      filtered = filtered.filter(p => getStockStatus(p) === "ok");
    }

    return filtered;
  };

  const handleUpdateStock = async () => {
    if (!editProduct || newStock === "") return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "products", editProduct.id), {
        stock: Number(newStock),
      });
      // Create notification
      const storeId = getStoreId();
      await addDoc(collection(db, "notifications"), {
        type: "stock_updated",
        message: `Stock updated: ${editProduct.name} → ${newStock} ${editProduct.unit || "pcs"}`,
        storeId: storeId || "",
        targetRole: "all",
        createdAt: serverTimestamp(),
      });
      setEditProduct(null);
      setNewStock("");
      fetchProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Error updating stock. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredProducts = getFilteredProducts();

  const stats = {
    total: products.length,
    low: products.filter(p => {
      const status = getStockStatus(p);
      return status === "low" || status === "out";
    }).length,
    ok: products.filter(p => getStockStatus(p) === "ok").length,
  };

  return (
    <StaffLayout title="Stock Status">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Stock Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View current stock levels for all products
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.low}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Good Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.ok}</p>
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus("low")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "low"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Low ({stats.low})
            </button>
            <button
              onClick={() => setFilterStatus("ok")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "ok"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Good ({stats.ok})
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl || `https://ui-avatars.com/api/?name=${product.name}&background=random`}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              {product.name}
                              {(() => {
                                const created = product.createdAt?.toDate?.() || (product.createdAt ? new Date(product.createdAt) : null);
                                if (created && (Date.now() - created.getTime()) < 48 * 60 * 60 * 1000) {
                                  return <span className="px-1.5 py-0.5 bg-[#0a66c2] text-white text-[10px] font-bold rounded uppercase tracking-wide">NEW</span>;
                                }
                                return null;
                              })()}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ₹{product.price}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {product.category || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px]">
                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  status === "ok" ? "bg-green-500" : 
                                  status === "low" ? "bg-orange-500" : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min((product.stock / (product.lowStockLimit || 10)) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {product.stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {product.unit || "pcs"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStockColor(status)}`}>
                          {status === "out" ? "● Out of Stock" : 
                           status === "low" ? "● Low Stock" : "● In Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setEditProduct(product);
                            setNewStock(product.stock.toString());
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Update Stock"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Update Modal */}
      {editProduct && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setEditProduct(null); setNewStock(""); }} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Update Stock</h3>
                <button onClick={() => { setEditProduct(null); setNewStock(""); }} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img
                  src={editProduct.imageUrl || `https://ui-avatars.com/api/?name=${editProduct.name}&background=random`}
                  alt={editProduct.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{editProduct.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current stock: {editProduct.stock} {editProduct.unit || "pcs"}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 text-lg font-semibold"
                  placeholder="Enter new stock quantity"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setEditProduct(null); setNewStock(""); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStock}
                  disabled={updating || newStock === ""}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </StaffLayout>
  );
}
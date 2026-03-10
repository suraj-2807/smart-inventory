import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import AdminLayout from "../layouts/AdminLayout";
import { Download, TrendingUp, Package, Users, ShoppingCart, Calendar, X } from "lucide-react";
import * as XLSX from "xlsx";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminReports() {
  const [selectedTab, setSelectedTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrdersByDateRange();
  }, [orders, dateRange, customStartDate, customEndDate]);

  const fetchData = async () => {
    try {
      const storeId = getStoreId();
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);
      const ordersSnap = await getDocs(buildQ("orders"));
      const productsSnap = await getDocs(buildQ("products"));
      const staffSnap = await getDocs(buildQ("staff"));

      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStaff(staffSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          setFilteredOrders(orders);
          return;
        }
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const filtered = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    setFilteredOrders(filtered);
  };

  const orderStats = {
    totalSales: filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    netSales: filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    totalOrders: filteredOrders.length,
    productsSold: filteredOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0),
    variationsSold: filteredOrders.reduce((sum, o) => {
      return sum + (o.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0);
    }, 0)
  };

  const productStats = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      if (productStats[item.name]) {
        productStats[item.name] += item.quantity;
      } else {
        productStats[item.name] = item.quantity;
      }
    });
  });

  const popularProducts = Object.entries(productStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const prepareChartData = () => {
    const chartData = {};
    
    filteredOrders.forEach(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!chartData[dateKey]) {
        chartData[dateKey] = { date: dateKey, sales: 0, orders: 0 };
      }
      
      chartData[dateKey].sales += order.totalAmount || 0;
      chartData[dateKey].orders += 1;
    });

    return Object.values(chartData).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  };

  const chartData = prepareChartData();

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Orders sheet - comprehensive data
    const ordersData = filteredOrders.map((order, idx) => ({
      "Order #": String(idx + 1001).padStart(4, '0'),
      "Customer": order.customerName || "N/A",
      "Phone": order.customerPhone || "N/A",
      "Email": order.customerEmail || "N/A",
      "Address": order.customerAddress || "N/A",
      "Items": order.items?.map(i => `${i.name} x${i.quantity}`).join(", ") || "N/A",
      "Item Count": order.items?.length || 0,
      "Total Amount": order.totalAmount || 0,
      "Status": order.status || "N/A",
      "Assigned To": order.assignedTo || "N/A",
      "Assigned Date": order.assignedDate || "N/A",
      "Payment Mode": order.paymentMode || "N/A",
      "Created Date": order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "N/A",
    }));
    const wsOrders = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

    // Products sheet
    const productsData = products.map(p => ({
      "Name": p.name || "N/A",
      "Price (₹)": p.price || 0,
      "Stock": p.stock || 0,
      "Category": p.category || "General",
      "Unit": p.unit || "pcs",
      "Active": p.isActive ? "Yes" : "No",
      "Created": p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : "N/A",
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

    // Staff sheet
    const staffData = staff.map(s => ({
      "Name": s.name || "N/A",
      "Email": s.email || "N/A",
      "Phone": s.phone || "N/A",
      "Role": s.role || "N/A",
      "Department": s.department || "N/A",
      "Status": s.status || "Active",
      "Hire Date": s.hireDate || "N/A",
      "Username": s.username || "N/A",
    }));
    const wsStaff = XLSX.utils.json_to_sheet(staffData);
    XLSX.utils.book_append_sheet(wb, wsStaff, "Staff");

    XLSX.writeFile(wb, `Store_Full_Export_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value === "custom") {
      setShowCustomDateModal(true);
    }
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setShowCustomDateModal(false);
      filterOrdersByDateRange();
    }
  };

  const getDateRangeText = () => {
    if (dateRange === "custom" && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
    }
    
    const rangeText = {
      today: "Today",
      week: "This Week",
      month: "This Month",
      year: "This Year"
    };
    
    return rangeText[dateRange] || "This Month";
  };

  if (loading) {
    return (
      <AdminLayout title="Reports & Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a66c2] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading reports...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reports & Analytics">
      {showCustomDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCustomDateModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyCustomDateRange}
                disabled={!customStartDate || !customEndDate}
                className="flex-1 px-4 py-2 bg-[#0a66c2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar size={20} className="text-gray-500 dark:text-gray-200" />
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all dark:border-gray-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-200">
            {getDateRangeText()}
          </span>
        </div>

        <button
          onClick={downloadExcel}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0a66c2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[#0a66c2]/30"
        >
          <Download size={18} />
          Download Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6 shadow-sm dark:bg-gray-800 dark:border-gray-800">
        <div className=" px-6 flex gap-8">
          <button
            onClick={() => setSelectedTab("orders")}
            className={`py-4 font-medium text-sm transition-colors relative ${
              selectedTab === "orders" ? "text-[#0a66c2]" : "text-gray-500 hover:text-gray-700 dark:text-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              Orders
            </div>
            {selectedTab === "orders" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a66c2]"></div>
            )}
          </button>

          <button
            onClick={() => setSelectedTab("products")}
            className={`py-4 font-medium text-sm transition-colors relative ${
              selectedTab === "products" ? "text-[#0a66c2]" : "text-gray-500 hover:text-gray-700 dark:text-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              Products
            </div>
            {selectedTab === "products" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a66c2]"></div>
            )}
          </button>

          <button
            onClick={() => setSelectedTab("staff")}
            className={`py-4 font-medium text-sm transition-colors relative ${
              selectedTab === "staff" ? "text-[#0a66c2]" : "text-gray-500 hover:text-gray-700 dark:text-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              Staff Performance
            </div>
            {selectedTab === "staff" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a66c2]"></div>
            )}
          </button>
        </div>
      </div>

      {selectedTab === "orders" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 dark:text-gray-200">Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-gray-600">Total sales</p>
                <p className="text-2xl font-bold text-gray-900">₹{orderStats.totalSales.toFixed(2)}</p>
                <p className="text-xs text-green-600 font-medium">↑ {filteredOrders.length > 0 ? '100%' : '0%'}</p>
              </div>

              <div className="space-y-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-gray-600">Net sales</p>
                <p className="text-2xl font-bold text-gray-900">₹{orderStats.netSales.toFixed(2)}</p>
                <p className="text-xs text-green-600 font-medium">↑ {filteredOrders.length > 0 ? '100%' : '0%'}</p>
              </div>

              <div className="space-y-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
                <p className="text-xs text-green-600 font-medium">↑ {filteredOrders.length > 0 ? '100%' : '0%'}</p>
              </div>

              <div className="space-y-2 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <p className="text-sm text-gray-600">Products sold</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.productsSold}</p>
                <p className="text-xs text-green-600 font-medium">↑ {filteredOrders.length > 0 ? '100%' : '0%'}</p>
              </div>

              <div className="space-y-2 p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                <p className="text-sm text-gray-600">Variations Sold</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.variationsSold}</p>
                <p className="text-xs text-green-600 font-medium">↑ {filteredOrders.length > 0 ? '100%' : '0%'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Sales Trend</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#0a66c2" 
                      strokeWidth={3}
                      dot={{ fill: '#0a66c2', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Package size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No sales data for the selected date range</p>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0a66c2] rounded-sm"></div>
                    <span className="text-sm text-gray-600">Current Period</span>
                  </div>
                  <span className="text-sm font-semibold">₹{orderStats.netSales.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="orders" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f8726a" />
                        <stop offset="100%" stopColor="#0a66c2" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <ShoppingCart size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No order data for the selected date range</p>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0a66c2] rounded-sm"></div>
                    <span className="text-sm text-gray-600">Current Period</span>
                  </div>
                  <span className="text-sm font-semibold">{orderStats.totalOrders} orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "products" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Product Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div className="space-y-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-green-600">
                  {products.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="space-y-2 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {products.filter(p => p.stock > 0 && p.stock < 10).length}
                </p>
              </div>
              <div className="space-y-2 p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.stock === 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Products</h3>
              <div className="space-y-4">
                {popularProducts.length > 0 ? (
                  popularProducts.map(([name, count], idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0a66c2] rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-[#0a66c2] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(count / popularProducts[0][1]) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{count} sold</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <TrendingUp size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No product data available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <Package size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">In Stock</p>
                      <p className="text-sm text-gray-600">Available products</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {products.filter(p => p.stock > 10).length}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-md">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Low Stock</p>
                      <p className="text-sm text-gray-600">Less than 10 units</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {products.filter(p => p.stock > 0 && p.stock < 10).length}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                      <Package size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Out of Stock</p>
                      <p className="text-sm text-gray-600">Needs restocking</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {products.filter(p => p.stock === 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === "staff" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Staff Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
              <div className="space-y-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-green-600">
                  {staff.filter(s => s.status === "Active").length}
                </p>
              </div>
              <div className="space-y-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-gray-600">On Duty Today</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Products Packaged</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Package size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No packaging data for the selected date range</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Products Delivered</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ShoppingCart size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No delivery data for the selected date range</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Members</h3>
            <div className="space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-200">
                  <div className="flex items-center gap-3">
                    {member.profileImageUrl ? (
                      <img
                        src={member.profileImageUrl}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#0a66c2] flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {member.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.role} • {member.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">0 packaged</p>
                    <p className="text-sm text-gray-600">0 delivered</p>
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <Users size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No staff members found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
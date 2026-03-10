import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getStoreId } from "@/services/storeHelper";
import StaffLayout from "../layouts/StaffLayout";
import { Package, CheckCircle, AlertTriangle, Boxes, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    ordersToPack: 0,
    packedToday: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [chartData, setChartData] = useState({
    weekly: [],
    categoryStock: [],
    orderStatus: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const storeId = getStoreId();
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);

      // Get orders
      const ordersSnapshot = await getDocs(buildQ("orders"));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const ordersToPack = allOrders.filter(o => o.status === "NEW").length;
      
      // Get packed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const packedToday = allOrders.filter(o => {
        if (o.status === "PACKED" && o.packedAt?.toDate) {
          const packedDate = o.packedAt.toDate();
          return packedDate >= today;
        }
        return false;
      }).length;

      // Get products
      const productsSnapshot = await getDocs(buildQ("products"));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => p.stock <= (p.lowStockLimit || 10)).length;

      setStats({
        ordersToPack,
        packedToday,
        lowStockItems,
        totalProducts,
      });

      // Prepare chart data
      prepareChartData(allOrders, products);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const prepareChartData = (orders, products) => {
    // Weekly packing activity (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const packedCount = orders.filter(o => {
        if (o.packedAt?.toDate) {
          const packedDate = o.packedAt.toDate();
          return packedDate >= date && packedDate < nextDay;
        }
        return false;
      }).length;

      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        packed: packedCount,
      });
    }

    // Category-wise stock levels
    const categoryMap = {};
    products.forEach(p => {
      const category = p.category || 'General';
      if (!categoryMap[category]) {
        categoryMap[category] = { category, stock: 0, products: 0 };
      }
      categoryMap[category].stock += p.stock;
      categoryMap[category].products += 1;
    });
    const categoryStock = Object.values(categoryMap);

    // Order status distribution
    const statusMap = {
      'NEW': 0,
      'PACKED': 0,
      'ASSIGNED_TO_DELIVERY': 0,
      'OUT_FOR_DELIVERY': 0,
      'DELIVERED': 0,
    };
    orders.forEach(o => {
      if (statusMap[o.status] !== undefined) {
        statusMap[o.status]++;
      }
    });
    const orderStatus = [
      { name: 'To Pack', value: statusMap.NEW, color: '#f59e0b' },
      { name: 'Packed', value: statusMap.PACKED, color: '#3b82f6' },
      { name: 'Assigned', value: statusMap.ASSIGNED_TO_DELIVERY, color: '#6366f1' },
      { name: 'Out for Delivery', value: statusMap.OUT_FOR_DELIVERY, color: '#8b5cf6' },
      { name: 'Delivered', value: statusMap.DELIVERED, color: '#10b981' },
    ];

    setChartData({
      weekly: last7Days,
      categoryStock,
      orderStatus,
    });
  };

  const statCards = [
    {
      title: "Orders to Pack",
      value: stats.ordersToPack,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
      change: "+12%",
      trend: "up"
    },
    {
      title: "Packed Today",
      value: stats.packedToday,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      change: "+8%",
      trend: "up"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
      change: "-3%",
      trend: "down"
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Boxes,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400",
      change: "+5%",
      trend: "up"
    },
  ];

  return (
    <StaffLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {(() => { try { const a = JSON.parse(localStorage.getItem("staffAuth") || "{}"); return a.fullname || "Staff"; } catch { return "Staff"; } })()}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's your inventory overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  card.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {card.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {card.change}
                </div>
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Packing Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Weekly Packing Activity
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="packed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Order Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.orderStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Stock Levels */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Stock Levels by Category
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.categoryStock}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="category" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="stock" stroke="#8b5cf6" strokeWidth={2} />
            <Line type="monotone" dataKey="products" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/staff/orders"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 transition-colors">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Pack Orders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.ordersToPack} pending
              </p>
            </div>
          </a>

          <a
            href="/staff/stock"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
          >
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 group-hover:bg-purple-200 transition-colors">
              <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">View Stock</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.totalProducts} products
              </p>
            </div>
          </a>

          <a
            href="/staff/low-stock"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
          >
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900 group-hover:bg-orange-200 transition-colors">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Low Stock</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.lowStockItems} alerts
              </p>
            </div>
          </a>
        </div>
      </div>
    </StaffLayout>
  );
}
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getStoreId } from "@/services/storeHelper";
import DeliveryLayout from "../layouts/DeliveryLayout";
import { Truck, CheckCircle, Clock, Package, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DeliveryDashboard() {
  const [stats, setStats] = useState({
    assignedDeliveries: 0,
    pendingDeliveries: 0,
    deliveredToday: 0,
    totalDelivered: 0,
  });
  const [chartData, setChartData] = useState({
    weekly: [],
    statusDistribution: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const storeId = getStoreId();
      const q = storeId ? query(collection(db, "orders"), where("storeId", "==", storeId)) : collection(db, "orders");
      const ordersSnapshot = await getDocs(q);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Delivery-relevant orders
      const assignedDeliveries = allOrders.filter(
        o => o.status === "ASSIGNED_TO_DELIVERY" || o.status === "OUT_FOR_DELIVERY"
      ).length;

      const pendingDeliveries = allOrders.filter(
        o => o.status === "OUT_FOR_DELIVERY"
      ).length;

      // Delivered today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deliveredToday = allOrders.filter(o => {
        if (o.status === "DELIVERED" && o.deliveredAt) {
          const deliveredDate = o.deliveredAt?.toDate ? o.deliveredAt.toDate() : new Date(o.deliveredAt);
          return deliveredDate >= today;
        }
        return false;
      }).length;

      const totalDelivered = allOrders.filter(o => o.status === "DELIVERED").length;

      setStats({ assignedDeliveries, pendingDeliveries, deliveredToday, totalDelivered });

      // Prepare chart data
      prepareChartData(allOrders);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const prepareChartData = (orders) => {
    // Weekly delivery activity
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const deliveredCount = orders.filter(o => {
        if (o.status === "DELIVERED" && o.deliveredAt) {
          const deliveredDate = o.deliveredAt?.toDate ? o.deliveredAt.toDate() : new Date(o.deliveredAt);
          return deliveredDate >= date && deliveredDate < nextDay;
        }
        return false;
      }).length;

      last7Days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        delivered: deliveredCount,
      });
    }

    // Status distribution
    const statusMap = {
      'ASSIGNED_TO_DELIVERY': 0,
      'OUT_FOR_DELIVERY': 0,
      'DELIVERED': 0,
    };
    orders.forEach(o => {
      if (statusMap[o.status] !== undefined) {
        statusMap[o.status]++;
      }
    });
    const statusDistribution = [
      { name: 'Assigned', value: statusMap.ASSIGNED_TO_DELIVERY, color: '#6366f1' },
      { name: 'Out for Delivery', value: statusMap.OUT_FOR_DELIVERY, color: '#f59e0b' },
      { name: 'Delivered', value: statusMap.DELIVERED, color: '#10b981' },
    ];

    setChartData({ weekly: last7Days, statusDistribution });
  };

  const statCards = [
    {
      title: "Assigned Deliveries",
      value: stats.assignedDeliveries,
      icon: Package,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
      change: "+5%",
      trend: "up"
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries,
      icon: Clock,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400",
      change: "-2%",
      trend: "down"
    },
    {
      title: "Delivered Today",
      value: stats.deliveredToday,
      icon: CheckCircle,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      change: "+18%",
      trend: "up"
    },
    {
      title: "Total Delivered",
      value: stats.totalDelivered,
      icon: Truck,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400",
      change: "+12%",
      trend: "up"
    },
  ];

  return (
    <DeliveryLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {(() => { try { const a = JSON.parse(localStorage.getItem("deliveryAuth") || "{}"); return a.fullname || "Delivery Partner"; } catch { return "Delivery Partner"; } })()}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's your delivery overview for today
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
        {/* Weekly Delivery Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Weekly Delivery Activity
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
              <Bar dataKey="delivered" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Delivery Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Delivery Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.statusDistribution.map((entry, index) => (
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

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/delivery/orders"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 group-hover:bg-emerald-200 transition-colors">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">My Deliveries</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.assignedDeliveries} assigned
              </p>
            </div>
          </a>

          <a
            href="/delivery/orders"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group"
          >
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900 group-hover:bg-orange-200 transition-colors">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Pending</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.pendingDeliveries} out for delivery
              </p>
            </div>
          </a>

          <a
            href="/delivery/history"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
          >
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 group-hover:bg-purple-200 transition-colors">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Completed</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.totalDelivered} delivered
              </p>
            </div>
          </a>
        </div>
      </div>
    </DeliveryLayout>
  );
}

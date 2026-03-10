import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getStoreId } from '@/services/storeHelper';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChevronDown, Package } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700">
        <p className="text-sm font-semibold mb-1 dark:text-gray-200">{payload[0].payload.day}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-xs dark:text-gray-300">{payload[0].value} Orders</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-xs dark:text-gray-300">{payload[1].value} Delivered</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SalesChart() {
  const [timePeriod, setTimePeriod] = useState('This week');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const storeId = getStoreId();
      const q = storeId ? query(collection(db, "orders"), where("storeId", "==", storeId)) : collection(db, "orders");
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Process orders data by day of week
  const getChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = days.map(day => ({ day, sales: 0, delivered: 0 }));

    orders.forEach(order => {
      if (order.createdAt?.toDate) {
        const date = order.createdAt.toDate();
        const dayIndex = date.getDay();
        
        dayData[dayIndex].sales += 1;
        
        if (order.status === 'DELIVERED') {
          dayData[dayIndex].delivered += 1;
        }
      }
    });

    // Reorder to start from Monday
    return [
      dayData[1], // Mon
      dayData[2], // Tue
      dayData[3], // Wed
      dayData[4], // Thu
      dayData[5], // Fri
      dayData[6], // Sat
      dayData[0], // Sun
    ];
  };

  const data = getChartData();
  const totalOrders = orders.length;
  const totalDelivered = orders.filter(o => o.status === 'DELIVERED').length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-gray-100">Daily Order Delivery</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your order delivery performance</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
          {timePeriod}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Orders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Delivered</span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-72 mb-6">
        {totalOrders > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="#e5e7eb"
                className="dark:stroke-gray-700"
              />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
              />
              <Bar 
                dataKey="sales" 
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="delivered" 
                fill="#d1d5db"
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No order data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-xl">
          <Package className="w-5 h-5" />
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-300">Total Orders</p>
            <p className="text-lg font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 rounded-xl">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Delivered</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalDelivered}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
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

const data = [
  { day: "Mon", sales: 12, delivered: 10 },
  { day: "Tue", sales: 18, delivered: 15 },
  { day: "Wed", sales: 25, delivered: 22 },
  { day: "Thu", sales: 20, delivered: 18 },
  { day: "Fri", sales: 30, delivered: 28 },
  { day: "Sat", sales: 15, delivered: 14 },
  { day: "Sun", sales: 22, delivered: 20 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold mb-1">{payload[0].payload.day}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-xs">{payload[0].value} Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span className="text-xs">{payload[1].value} Delivered</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function SalesChart() {
  const [timePeriod, setTimePeriod] = useState('This week');
  
  const totalOrders = data.reduce((sum, item) => sum + item.sales, 0);
  const totalDelivered = data.reduce((sum, item) => sum + item.delivered, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Daily Order Delivery</h3>
          <p className="text-sm text-gray-500">Track your order delivery performance</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          {timePeriod}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-sm text-gray-600">Orders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span className="text-sm text-gray-600">Delivered</span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-72 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="#f0f0f0"
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
              ticks={[0, 10, 20, 30, 40]}
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
      </div>

      {/* Stats Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl">
          <Package className="w-5 h-5" />
          <div>
            <p className="text-xs text-gray-400">Total Orders</p>
            <p className="text-lg font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl">
          <Package className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600">Delivered</p>
            <p className="text-lg font-bold text-blue-600">{totalDelivered}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
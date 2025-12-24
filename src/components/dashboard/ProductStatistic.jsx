import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronDown, Laptop, Gamepad2, Sofa, TrendingUp } from 'lucide-react';

const productData = [
  { 
    name: 'Electronics', 
    value: 2487, 
    percentage: '+6%', 
    color: '#3b82f6',
    icon: Laptop,
    trend: 'up'
  },
  { 
    name: 'Games', 
    value: 1828, 
    percentage: '+3%', 
    color: '#10b981',
    icon: Gamepad2,
    trend: 'up'
  },
  { 
    name: 'Furniture', 
    value: 1463, 
    percentage: '-2%', 
    color: '#ef4444',
    icon: Sofa,
    trend: 'down'
  },
];

const COLORS = ['#3b82f6', '#10b981', '#ef4444'];

export default function ProductStatistic() {
  const [timePeriod, setTimePeriod] = useState('Today');
  
  const totalSales = productData.reduce((sum, item) => sum + item.value, 0);
  const topProduct = productData[0];

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 ">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Product Statistic</h3>
          <p className="text-sm text-gray-500">Track your product sales</p>
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          {timePeriod}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Main Pie Chart */}
      <div className="relative mb-8">
        <div className="flex justify-center items-center">
          <div className="relative w-56 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-gray-900">{totalSales.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mb-2">Products Sales</p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                +6.9%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {productData.map((product) => {
          const Icon = product.icon;
          const isNegative = product.trend === 'down';
          
          return (
            <div 
              key={product.name}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <span className="font-medium text-gray-900">{product.name}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">{product.value.toLocaleString()}</span>
                <span 
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    isNegative 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {product.percentage}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Best Seller Badge */}
      <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-xs text-blue-600 font-medium">Best Seller Today</p>
          <p className="text-sm font-bold text-blue-700">{topProduct.name} - {topProduct.value.toLocaleString()} units</p>
        </div>
      </div>
    </div>
  );
}
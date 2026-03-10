import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getStoreId } from '@/services/storeHelper';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronDown, Package, TrendingUp } from 'lucide-react';

const COLORS = ['#0a66c2', '#f8726a', '#10b981', '#f59e0b', '#ef4444'];

export default function ProductStatistic() {
  const [timePeriod, setTimePeriod] = useState('Today');
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

  // Calculate product statistics from orders
  const getProductStats = () => {
    const productMap = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (productMap[item.name]) {
          productMap[item.name] += item.quantity;
        } else {
          productMap[item.name] = item.quantity;
        }
      });
    });

    // Convert to array and sort by quantity
    const productArray = Object.entries(productMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: '+0%', // You can calculate this based on historical data
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        trend: 'up'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 products

    return productArray;
  };

  const productData = getProductStats();
  const totalSales = productData.reduce((sum, item) => sum + item.value, 0);
  const topProduct = productData[0];

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#0a66c2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-6">
    {/* Header */}
    <div className="flex items-start justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Product Statistic
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track your product sales
        </p>
      </div>
      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
        {timePeriod}
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>

    {productData.length > 0 ? (
      <>
        {/* Pie Chart */}
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
                    {productData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stats */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalSales.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Products Sold
                </p>
                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                  {orders.length} Orders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3">
          {productData.map((product, index) => {
            const percentage = ((product.value / totalSales) * 100).toFixed(1);

            return (
              <div
                key={product.name}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor:
                        COLORS[index % COLORS.length] + "20",
                    }}
                  >
                    <Package
                      className="w-5 h-5"
                      style={{ color: COLORS[index % COLORS.length] }}
                    />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {product.value.toLocaleString()}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Seller */}
        {topProduct && (
          <div className="mt-4 p-3 rounded-xl flex items-center gap-2 border-2 bg-blue-50 dark:from-gray-800 dark:to-gray-700 border-blue-200 dark:border-gray-600">
            <TrendingUp className="w-5 h-5 text-[#0a66c2]" />
            <div>
              <p className="text-xs text-[#0a66c2] font-medium">
                Best Seller
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {topProduct.name} – {topProduct.value.toLocaleString()} units
              </p>
            </div>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No product sales data available
        </p>
      </div>
    )}
  </div>
);
}
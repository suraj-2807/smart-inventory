import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getStoreId } from '@/services/storeHelper';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';

export default function StatsCards() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storeId = getStoreId();
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);
      const [ordersSnap, productsSnap, staffSnap] = await Promise.all([
        getDocs(buildQ("orders")),
        getDocs(buildQ("products")),
        getDocs(buildQ("staff"))
      ]);

      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setStaff(staffSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total sales
  const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Calculate total orders
  const totalOrders = orders.length;

  // Calculate visitors (staff + unique customers)
  const uniqueCustomers = [...new Set(orders.map(o => o.customerEmail || o.customerPhone))].length;
  const totalVisitors = staff.length + uniqueCustomers;

  // Calculate total sold products (sum of all quantities)
  const totalSoldProducts = orders.reduce((sum, order) => {
    const orderQuantity = order.items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0;
    return sum + orderQuantity;
  }, 0);

  // Calculate percentage changes (mock data - you'd compare with previous month from DB)
  const salesChange = "+2.08%";
  const ordersChange = totalOrders > 0 ? "+12.4%" : "0%";
  const visitorsChange = "-7.08%";
  const productsChange = totalSoldProducts > 0 ? "+12.1%" : "0%";

  const cards = [
    {
      title: "Total Sales",
      value: `₹${totalSales.toLocaleString()}`,
      subtitle: "Products vs last month",
      change: salesChange,
      isPositive: true,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      icon: TrendingUp
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      subtitle: "Orders vs last month",
      change: ordersChange,
      isPositive: true,
      bgColor: "bg-gradient-to-br from-[#0a66c2] to-[#084d94]",
      icon: ShoppingCart
    },
    {
      title: "Visitors",
      value: totalVisitors.toLocaleString(),
      subtitle: "Users vs last month",
      change: visitorsChange,
      isPositive: false,
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      icon: Users
    },
    {
      title: "Total Sold Products",
      value: totalSoldProducts.toLocaleString(),
      subtitle: "Products vs last month",
      change: productsChange,
      isPositive: totalSoldProducts > 0,
      bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
      icon: Package
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-3xl w-12 h-12"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-6 w-16 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-200 dark:bg-gray-700 h-4 w-24 rounded"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-10 w-32 rounded"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 w-40 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isLargeCard = index === 0 || index === 1;
            
            return (
              <div
                key={index}
                className={`${
                  isLargeCard ? card.bgColor + ' text-white dark:text-white' : 'bg-white dark:bg-gray-800'
                } rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${
                    isLargeCard ? 'bg-white/20 dark:bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                  } p-3 rounded-3xl`}>
                    <Icon className={`w-6 h-6 ${isLargeCard ? 'text-white dark:text-white' : 'text-gray-600 dark:text-gray-300'}`} strokeWidth={2} />
                  </div>
                  
                  <span className={`${
                    card.isPositive ? 'bg-green-500' : 'bg-red-500'
                  } text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                    {card.change}
                  </span>
                </div>
                
                <div>
                  <p className={`${
                    isLargeCard ? 'text-white text-opacity-90 dark:text-white dark:text-opacity-90' : 'text-gray-500 dark:text-gray-400'
                  } text-sm font-medium mb-2`}>
                    {card.title}
                  </p>
                  
                  <h2 className={`${
                    isLargeCard ? 'text-white dark:text-white' : 'text-gray-900 dark:text-gray-100'
                  } text-4xl font-bold mb-2`}>
                    {card.value}
                  </h2>
                  
                  <p className={`${
                    isLargeCard ? 'text-white text-opacity-75 dark:text-white dark:text-opacity-75' : 'text-gray-400 dark:text-gray-500'
                  } text-sm`}>
                    {card.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
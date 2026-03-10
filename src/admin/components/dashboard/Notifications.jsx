import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getStoreId } from '@/services/storeHelper';
import { ShoppingCart, CheckCircle, AlertTriangle, Package, Clock } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const notifs = [];

      const storeId = getStoreId();
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);

      // Recent orders
      const ordersSnapshot = await getDocs(buildQ('orders'));
      const orders = ordersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 3);

      orders.forEach(order => {
        const time = order.createdAt?.toDate?.() || new Date(order.createdAt || Date.now());
        const now = new Date();
        const diff = Math.floor((now - time) / 1000);
        let timeStr;
        if (diff < 60) timeStr = 'Just now';
        else if (diff < 3600) timeStr = `${Math.floor(diff / 60)} min ago`;
        else if (diff < 86400) timeStr = `${Math.floor(diff / 3600)}h ago`;
        else timeStr = `${Math.floor(diff / 86400)}d ago`;

        notifs.push({
          id: `order-${order.id}`,
          text: order.status === 'DELIVERED' 
            ? `Order delivered to ${order.customerName || 'customer'}` 
            : order.status === 'NEW' 
            ? `New order from ${order.customerName || 'customer'}`
            : `Order ${order.status?.toLowerCase()} — ${order.customerName || 'customer'}`,
          time: timeStr,
          type: order.status === 'DELIVERED' ? 'success' : order.status === 'NEW' ? 'order' : 'stock',
        });
      });

      // Low stock alerts
      const productsSnapshot = await getDocs(buildQ('products'));
      productsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.stock !== undefined && p.stock <= 5)
        .slice(0, 2)
        .forEach(product => {
          notifs.push({
            id: `stock-${product.id}`,
            text: `Low stock: ${product.name} (${product.stock} remaining)`,
            time: 'Active',
            type: 'warning',
          });
        });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return '🛒';
      case 'success': return '✅';
      case 'stock': return '📦';
      case 'warning': return '⚠️';
      default: return '📋';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm dark:bg-gray-800">
      <h3 className="font-semibold text-lg mb-4 dark:text-gray-100">Recent Notifications</h3>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No recent notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 border-b pb-3 last:border-none dark:border-gray-700"
            >
              <span className="text-lg">{getIcon(n.type)}</span>
              <div>
                <p className="text-sm font-medium dark:text-gray-200">{n.text}</p>
                <span className="text-xs text-gray-400">{n.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

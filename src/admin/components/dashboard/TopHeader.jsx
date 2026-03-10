import React, { useState, useEffect } from 'react';
import { Search, Bell, X, Package, ShoppingCart, Users, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Download } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getStoreId, getStoreName } from '@/services/storeHelper';

export default function TopHeader() {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [adminData, setAdminData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [searchResults, setSearchResults] = useState({
    orders: [],
    products: [],
    staffs: [],
    reports: []
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Load admin data from localStorage (matches login flow)
  useEffect(() => {
    try {
      const authStr = localStorage.getItem('adminAuth');
      if (authStr) {
        const auth = JSON.parse(authStr);
        setAdminData(auth);
      }
    } catch (error) {
      console.error('Error reading admin auth:', error);
    }
  }, []);

  // Fetch dynamic notifications from Firestore
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const notifs = [];

      const storeId = getStoreId();
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);

      // Recent orders (last 10)
      const ordersSnapshot = await getDocs(buildQ('orders'));
      const orders = ordersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 5);

      orders.forEach(order => {
        const time = order.createdAt?.toDate?.() || new Date(order.createdAt || Date.now());
        notifs.push({
          id: `order-${order.id}`,
          text: `Order from ${order.customerName || 'Unknown'} — ₹${order.totalAmount || 0}`,
          time: getRelativeTime(time),
          type: order.status === 'DELIVERED' ? 'success' : order.status === 'NEW' ? 'order' : 'info',
          status: order.status,
        });
      });

      // Low stock products
      const productsSnapshot = await getDocs(buildQ('products'));
      const lowStockProducts = productsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.stock !== undefined && p.stock <= 5);

      lowStockProducts.forEach(product => {
        notifs.push({
          id: `stock-${product.id}`,
          text: `Low stock: ${product.name} (${product.stock} left)`,
          time: 'Active',
          type: 'warning',
        });
      });

      // Fetch from dedicated notifications collection
      const notifsQ = storeId
        ? query(collection(db, 'notifications'), where('storeId', '==', storeId))
        : collection(db, 'notifications');
      try {
        const notifsSnapshot = await getDocs(notifsQ);
        notifsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          })
          .slice(0, 5)
          .forEach(n => {
            notifs.push({
              id: `notif-${n.id}`,
              text: n.message || n.type,
              time: n.createdAt ? getRelativeTime(n.createdAt.toDate?.() || new Date(n.createdAt)) : 'Recently',
              type: n.type?.includes('product') ? 'info' : n.type?.includes('stock') ? 'warning' : 'info',
            });
          });
      } catch (e) {
        // notifications collection may not exist yet, ignore
      }

      setNotifications(notifs.slice(0, 10));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'order': return <ShoppingCart size={16} className="text-[#0a66c2]" />;
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-[#f8726a]" />;
      case 'info': return <Clock size={16} className="text-amber-500" />;
      default: return <Bell size={16} className="text-gray-400" />;
    }
  };

  // Perform search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch();
    } else {
      setSearchResults({ orders: [], products: [], staffs: [], reports: [] });
    }
  }, [searchQuery, searchCategory]);

  const performSearch = async () => {
    const q = searchQuery.toLowerCase().trim();
    const results = { orders: [], products: [], staffs: [], reports: [] };

    try {
      const storeId = getStoreId();
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);

      if (searchCategory === 'all' || searchCategory === 'orders') {
        const ordersSnapshot = await getDocs(buildQ('orders'));
        results.orders = ordersSnapshot.docs
          .map((doc, idx) => ({
            id: doc.id,
            ...doc.data(),
            orderNumber: String(idx + 1001).padStart(4, '0')
          }))
          .filter(order => 
            order.customerName?.toLowerCase().includes(q) ||
            order.orderNumber.includes(q) ||
            order.customerPhone?.includes(q)
          )
          .slice(0, 5);
      }

      if (searchCategory === 'all' || searchCategory === 'products') {
        const productsSnapshot = await getDocs(buildQ('products'));
        results.products = productsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(product => 
            product.name?.toLowerCase().includes(q) ||
            product.category?.toLowerCase().includes(q) ||
            product.sku?.toLowerCase().includes(q)
          )
          .slice(0, 5);
      }

      if (searchCategory === 'all' || searchCategory === 'staffs') {
        const staffSnapshot = await getDocs(buildQ('staff'));
        results.staffs = staffSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(staff => 
            staff.name?.toLowerCase().includes(q) ||
            staff.email?.toLowerCase().includes(q) ||
            staff.role?.toLowerCase().includes(q) ||
            staff.department?.toLowerCase().includes(q)
          )
          .slice(0, 5);
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/admin/dashboard': 'Dashboard',
      '/admin/products': 'Products',
      '/admin/orders': 'Orders',
      '/admin/staffs': 'Staff Management',
      '/admin/invoices': 'Invoices',
      '/admin/reports': 'Reports',
      '/admin/settings': 'Settings'
    };
    return titles[path] || 'Dashboard';
  };

  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const handleResultClick = (type, item) => {
    setShowSearch(false);
    setSearchQuery('');
    
    switch(type) {
      case 'order':
        navigate('/admin/orders');
        break;
      case 'product':
        navigate('/admin/products');
        break;
      case 'staff':
        navigate('/admin/staffs');
        break;
      case 'report':
        navigate('/admin/reports');
        break;
    }
  };

  const totalResults = searchResults.orders.length + searchResults.products.length + 
                       searchResults.staffs.length + searchResults.reports.length;

  const unreadCount = notifications.filter(n => n.type === 'order' || n.type === 'warning').length;

  const getAdminInitial = () => {
    if (adminData?.email) return adminData.email.charAt(0).toUpperCase();
    return 'A';
  };

  return (
    <>
      <div className="flex items-center justify-between py-4">
        {/* Left - Title and Date */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {getPageTitle()}
            </h1>
            <span className="px-2.5 py-1 bg-[#f8726a]/10 text-[#f8726a] text-xs font-semibold rounded-full">Administrator</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getCurrentDate()}
          </p>
        </div>

        {/* Right - Icons and Profile */}
        <div className="flex items-center gap-6">
          {/* Search Icon */}
          <button 
            onClick={() => setShowSearch(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Search className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative"
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#f8726a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                    <span className="text-xs bg-[#0a66c2]/10 text-[#0a66c2] px-2 py-1 rounded-full font-medium">
                      {notifications.length} updates
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-none">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">{n.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">{n.time}</span>
                                {n.status && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                    n.status === 'NEW' ? 'bg-blue-50 text-blue-600' :
                                    n.status === 'PACKED' ? 'bg-amber-50 text-amber-600' :
                                    n.status === 'DELIVERED' ? 'bg-green-50 text-green-600' :
                                    'bg-gray-50 text-gray-600'
                                  }`}>
                                    {n.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0a66c2] flex items-center justify-center text-white font-bold text-sm">
              {getAdminInitial()}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {adminData?.fullname || adminData?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">{getStoreName() || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-slideDown">
            {/* Search Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Search</h2>
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-600 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-3">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all font-medium text-gray-700 bg-white"
                >
                  <option value="all">All</option>
                  <option value="orders">Orders</option>
                  <option value="products">Products</option>
                  <option value="staffs">Staffs</option>
                </select>

                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders, products, staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {searchQuery && (
                <p className="text-sm text-gray-500 mt-3">
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Search Results */}
            <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
              {!searchQuery ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Searching</h3>
                  <p className="text-gray-500 text-sm">
                    Type to search for orders, products, staff, and more
                  </p>
                </div>
              ) : totalResults === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No results found</h3>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your search or category filter
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {searchResults.orders.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart size={18} className="text-[#0a66c2]" />
                        <h3 className="font-semibold text-gray-900">Orders ({searchResults.orders.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {searchResults.orders.map((order) => (
                          <button
                            key={order.id}
                            onClick={() => handleResultClick('order', order)}
                            className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                                <p className="text-sm text-gray-500">{order.customerName}</p>
                              </div>
                              <span className="text-sm font-semibold text-[#0a66c2]">
                                ₹{order.totalAmount || 0}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package size={18} className="text-[#0a66c2]" />
                        <h3 className="font-semibold text-gray-900">Products ({searchResults.products.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {searchResults.products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleResultClick('product', product)}
                            className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              {product.imageUrl && (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.category}</p>
                              </div>
                              <span className="text-sm font-semibold text-[#0a66c2]">
                                ₹{product.price}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.staffs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users size={18} className="text-[#0a66c2]" />
                        <h3 className="font-semibold text-gray-900">Staff ({searchResults.staffs.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {searchResults.staffs.map((staff) => (
                          <button
                            key={staff.id}
                            onClick={() => handleResultClick('staff', staff)}
                            className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#0a66c2] flex items-center justify-center text-white font-semibold">
                                {staff.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{staff.name}</p>
                                <p className="text-sm text-gray-500">{staff.role} • {staff.department}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
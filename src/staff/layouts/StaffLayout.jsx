import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  AlertTriangle, 
  History, 
  LogOut,
  Menu,
  X,
  Bell
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";
import ProfileDropdown from "../components/ProfileDropdown";
import { getStoreName } from "@/services/storeHelper";

export default function StaffLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = title ? `${title} — Selloship Staff` : "Selloship Staff";
  }, [title]);

  const navigation = [
    { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { name: "Orders to Pack", href: "/staff/orders", icon: Package },
    { name: "Stock Status", href: "/staff/stock", icon: Boxes },
    { name: "Low Stock Alerts", href: "/staff/low-stock", icon: AlertTriangle },
    { name: "Packed History", href: "/staff/history", icon: History },
    { name: "Notifications", href: "/staff/notifications", icon: Bell },
  ];

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      // Add your logout logic here
      localStorage.removeItem("staffAuth");
      window.location.href = "/staff/login";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/src/assets/favicon.png" alt="Selloship" className="w-10 h-10 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Selloship
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{getStoreName()} • Staff</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.href;
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#0a66c2]/10 text-[#0a66c2] font-medium dark:bg-[#0a66c2]/20 dark:text-[#5ba3e6]"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <span className="px-2.5 py-1 bg-[#0a66c2]/10 text-[#0a66c2] text-xs font-semibold rounded-full">Inventory Staff</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Profile Dropdown */}
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
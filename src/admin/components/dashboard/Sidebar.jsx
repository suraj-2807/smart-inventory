import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  UsersRound,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getStoreName } from "@/services/storeHelper";
import favicon from "../../../assets/favicon.png";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const baseClass =
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg";
  const activeClass = "bg-[#0a66c2] text-white";
  const normalClass =
    "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";

  // Load saved theme
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 flex flex-col m-[15px] shadow rounded-3xl">
      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <img src={favicon} alt="Selloship" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Selloship
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getStoreName()}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        {/* MENU */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">
            MENU
          </p>

          <ul className="space-y-1">
            <li>
              <NavLink
                to="/admin/dashboard"
                className={`${baseClass} ${
                  pathname === "/admin/dashboard"
                    ? activeClass
                    : normalClass
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/orders"
                className={`${baseClass} ${
                  pathname === "/admin/orders"
                    ? activeClass
                    : normalClass
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-medium">Orders</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/products"
                className={`${baseClass} ${
                  pathname === "/admin/products"
                    ? activeClass
                    : normalClass
                }`}
              >
                <Boxes className="w-5 h-5" />
                <span className="text-sm font-medium">Products</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/staffs"
                className={`${baseClass} ${
                  pathname === "/admin/staffs"
                    ? activeClass
                    : normalClass
                }`}
              >
                <UsersRound className="w-5 h-5" />
                <span className="text-sm font-medium">Staffs</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* FINANCIAL */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">
            FINANCIAL
          </p>

          <ul className="space-y-1">
            <li>
              <NavLink
                to="/admin/invoices"
                className={`${baseClass} ${
                  pathname === "/admin/invoices"
                    ? activeClass
                    : normalClass
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Invoices</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/reports"
                className={`${baseClass} ${
                  pathname === "/admin/reports"
                    ? activeClass
                    : normalClass
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Reports</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {/* TOOLS */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">
            TOOLS
          </p>

          <ul className="space-y-1">
            <li>
              <NavLink
                to="/admin/settings"
                className={`${baseClass} ${
                  pathname === "/admin/settings"
                    ? activeClass
                    : normalClass
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/notifications"
                className={`${baseClass} ${
                  pathname === "/admin/notifications"
                    ? activeClass
                    : normalClass
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm font-medium">Notifications</span>
              </NavLink>
            </li>

            <li>
              <button
                onClick={toggleDarkMode}
                className={`${baseClass} ${normalClass}`}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  localStorage.removeItem("adminAuth");
                  localStorage.removeItem("storeId");
                  localStorage.removeItem("storeName");
                  navigate("/");
                }}
                className={`${baseClass} text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}

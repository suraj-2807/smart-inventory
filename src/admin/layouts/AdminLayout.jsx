import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import TopHeader from "../components/dashboard/TopHeader";

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth");
    if (!adminAuth) {
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    document.title = title ? `${title} — Selloship Admin` : "Selloship Admin";
  }, [title]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-2 overflow-auto text-gray-900 dark:text-gray-100 transition-colors">
        <TopHeader title={title} />

        <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow transition-colors">
          {children}
        </div>
      </div>
    </div>
  );
}

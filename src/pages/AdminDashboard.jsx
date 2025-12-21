import Sidebar from "../components/dashboard/Sidebar";
import StatsCard from "../components/dashboard/StatsCard";
import SalesChart from "../components/dashboard/SalesChart";
import Notifications from "../components/dashboard/Notifications";
import TopHeader from "../components/dashboard/TopHeader";

export default function AdminDashboard() {
  return (
    <div className="flex">
      <Sidebar />
        
      <div className="flex-1 bg-gray-100 p-6">
        <TopHeader title="Dashboard" />
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatsCard title="Total Sales" value="₹62,197" subtitle="+12%" />
          <StatsCard title="Orders" value="1,240" subtitle="+8%" />
          <StatsCard title="Delivered" value="1,120" subtitle="+10%" />
          <StatsCard title="Pending" value="120" subtitle="-2%" />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <SalesChart />
          </div>
          <Notifications />
        </div>

      </div>
    </div>
  );
}

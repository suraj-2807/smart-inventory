import Sidebar from "../components/dashboard/Sidebar";
import StatsCard from "../components/dashboard/StatsCard";
import SalesChart from "../components/dashboard/SalesChart";
import TopHeader from "../components/dashboard/TopHeader";
import ProductStatistic from "../components/dashboard/ProductStatistic";
import Notifications from "../components/dashboard/Notifications";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-violet-50 ">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 p-2 overflow-auto">
        <TopHeader title="Sales Report" />

        {/* MAIN FLEX */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT SECTION – 60% */}
          <div className="w-full lg:w-[75%] space-y-6">

            {/* Stats (still grid inside – best use case) */}
            
              <StatsCard />
      

            {/* Sales Chart */}
            <SalesChart />
          </div>

          {/* RIGHT SECTION – 40% */}
          <div className="w-full lg:w-[30%] space-y-6 pr-2">
            <ProductStatistic />
            <Notifications />
          </div>

        </div>
      </div>
    </div>
  );
}

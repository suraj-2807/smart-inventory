import AdminLayout from "../layouts/AdminLayout";
import StatsCard from "../components/dashboard/StatsCard";
import SalesChart from "../components/dashboard/SalesChart";
import ProductStatistic from "../components/dashboard/ProductStatistic";
import Notifications from "../components/dashboard/Notifications";

export default function AdminDashboard() {
  return (
    <AdminLayout title="Sales Report">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT */}
        <div className="w-full lg:w-[75%] space-y-6">
          <StatsCard />
          <SalesChart />
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-[30%] space-y-6">
          <ProductStatistic />
          <Notifications />
        </div>

      </div>
    </AdminLayout>
  );
}

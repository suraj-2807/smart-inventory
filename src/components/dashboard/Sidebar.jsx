import { LayoutDashboard, FileText, Package, Users, CreditCard, Receipt, Settings, MessageSquare, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-50 flex flex-col m-[15px] shadow rounded-3xl">
      {/* Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Smart Inventory</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        {/* MENU Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">MENU</p>
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 text-white transition-colors">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Report</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Package className="w-5 h-5" />
                <span className="text-sm font-medium">Products</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Consumer</span>
              </button>
            </li>
          </ul>
        </div>

        {/* FINANCIAL Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">FINANCIAL</p>
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-medium">Transactions</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Receipt className="w-5 h-5" />
                <span className="text-sm font-medium">Invoices</span>
              </button>
            </li>
          </ul>
        </div>

        {/* TOOLS Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 px-3 mb-2">TOOLS</p>
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">Feedback</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Help</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Upgrade Card */}
      {/* <div className="px-4 pb-6">
        <div className="bg-gray-900 rounded-2xl p-5 text-white">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3">
            <div className="w-6 h-6 bg-gray-900 rounded"></div>
          </div>
          <h3 className="font-semibold mb-1">Upgrade Pro</h3>
          <p className="text-xs text-gray-400 mb-4">
            Discover the beauty of an upgraded section
          </p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
            Upgrade GO
          </button>
        </div>
      </div> */}
    </div>
  );
}
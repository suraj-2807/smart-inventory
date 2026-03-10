import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./admin/pages/Landing";
import DemoStore from "./admin/pages/DemoStore";
import Onboarding from "./admin/pages/Onboarding";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminStaffs from "./admin/pages/AdminStaffs";
import AdminInvoices from "./admin/pages/AdminInvoices";
import AdminReports from "./admin/pages/AdminReports";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminNotifications from "./admin/pages/AdminNotifications";
import ProtectedRoute from "./admin/components/dashboard/ProtectedRoute";

// Staff imports
import StaffLogin from "./staff/pages/StaffLogin";
import StaffDashboard from "./staff/pages/StaffDashboard";
import StaffOrders from "./staff/pages/StaffOrders";
import StaffStock from "./staff/pages/StaffStock";
import StaffLowStock from "./staff/pages/StaffLowStock";
import StaffHistory from "./staff/pages/StaffHistory";
import StaffNotifications from "./staff/pages/StaffNotifications";
import StaffForgotPassword from "./staff/pages/StaffForgotPassword";

// Delivery imports
import DeliveryLogin from "./delivery/pages/DeliveryLogin";
import DeliveryDashboard from "./delivery/pages/DeliveryDashboard";
import DeliveryOrders from "./delivery/pages/DeliveryOrders";
import DeliveryHistory from "./delivery/pages/DeliveryHistory";
import DeliveryNotifications from "./delivery/pages/DeliveryNotifications";
import DeliveryForgotPassword from "./delivery/pages/DeliveryForgotPassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/store" element={<DemoStore />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Auth Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/forgot-password" element={<StaffForgotPassword />} />
        <Route path="/delivery/login" element={<DeliveryLogin />} />
        <Route path="/delivery/forgot-password" element={<DeliveryForgotPassword />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/products" 
          element={<ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/orders" 
          element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/staffs" 
          element={<ProtectedRoute role="admin"><AdminStaffs /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/invoices" 
          element={<ProtectedRoute role="admin"><AdminInvoices /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/reports" 
          element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/settings" 
          element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/notifications" 
          element={<ProtectedRoute role="admin"><AdminNotifications /></ProtectedRoute>} 
        />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Protected Staff Routes */}
        <Route 
          path="/staff/dashboard" 
          element={<ProtectedRoute role="staff"><StaffDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/staff/orders" 
          element={<ProtectedRoute role="staff"><StaffOrders /></ProtectedRoute>} 
        />
        <Route 
          path="/staff/stock" 
          element={<ProtectedRoute role="staff"><StaffStock /></ProtectedRoute>} 
        />
        <Route 
          path="/staff/low-stock" 
          element={<ProtectedRoute role="staff"><StaffLowStock /></ProtectedRoute>} 
        />
        <Route 
          path="/staff/history" 
          element={<ProtectedRoute role="staff"><StaffHistory /></ProtectedRoute>} 
        />
        <Route 
          path="/staff/notifications" 
          element={<ProtectedRoute role="staff"><StaffNotifications /></ProtectedRoute>} 
        />
        <Route path="/staff" element={<Navigate to="/staff/login" replace />} />

        {/* Protected Delivery Routes */}
        <Route 
          path="/delivery/dashboard" 
          element={<ProtectedRoute role="delivery"><DeliveryDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/delivery/orders" 
          element={<ProtectedRoute role="delivery"><DeliveryOrders /></ProtectedRoute>} 
        />
        <Route 
          path="/delivery/history" 
          element={<ProtectedRoute role="delivery"><DeliveryHistory /></ProtectedRoute>} 
        />
        <Route 
          path="/delivery/notifications" 
          element={<ProtectedRoute role="delivery"><DeliveryNotifications /></ProtectedRoute>} 
        />
        <Route path="/delivery" element={<Navigate to="/delivery/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
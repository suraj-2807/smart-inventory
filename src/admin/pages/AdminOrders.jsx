import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import AdminLayout from "../layouts/AdminLayout";
import CreateOrderModal from "../components/orders/CreateOrderModal";
import OrderDetailsSidebar from "../components/orders/OrderDetailsSidebar";
import { Download, Send, ExternalLink, CheckCircle, FileText, PlayCircle, Truck, Package, Calendar, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const downloadInvoice = (order, index) => {
    const doc = new jsPDF();
    const orderNumber = String(index + 1001).padStart(4, "0");

    // Header
    doc.setFontSize(18);
    doc.text("INVOICE", 14, 20);

    doc.setFontSize(11);
    doc.text(`Order No: #${orderNumber}`, 14, 30);
    doc.text(`Customer: ${order.customerName || "N/A"}`, 14, 36);

    if (order.createdAt?.toDate) {
      doc.text(
        `Date: ${order.createdAt.toDate().toLocaleDateString()}`,
        14,
        42
      );
    }

    // Table data
    const tableBody = order.items.map((item, i) => [
      i + 1,
      item.name,
      item.quantity,
      `₹${item.price}`,
      `₹${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["#", "Product", "Qty", "Price", "Total"]],
      body: tableBody,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 100, 253] }
    });

    const total = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.text(`Grand Total: ₹${total.toFixed(2)}`, 14, finalY + 10);
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 14, finalY + 20);
    doc.save(`Invoice_${orderNumber}.pdf`);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const storeId = getStoreId();
    let q;
    if (storeId) {
      q = query(collection(db, "orders"), where("storeId", "==", storeId));
    } else {
      q = collection(db, "orders");
    }
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setOrders(data);
  };

  const updateStatus = async (orderId, status) => {
    await updateDoc(doc(db, "orders", orderId), { status });
    fetchOrders();
    // Update selected order if sidebar is open
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const markAsCreated = async (orderId, event) => {
    event.stopPropagation(); // Prevent opening sidebar
    if (confirm("Mark this order as created? This action cannot be undone.")) {
      await updateDoc(doc(db, "orders", orderId), { 
        status: "NEW",
        orderConfirmed: true,
        confirmedAt: new Date()
      });
      fetchOrders();
    }
  };

  const openOrderDetails = (order, index) => {
    setSelectedOrder({ ...order, orderNumber: String(index + 1001).padStart(4, '0'), index });
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  // Calculate stats for top boxes
  const stats = {
    orderCreated: orders.filter(o => o.status === "NEW" || o.status === "PAID"),
    onProcess: orders.filter(o => o.status === "PACKED"),
    outForDelivery: orders.filter(o => o.status === "OUT_FOR_DELIVERY"),
    completed: orders.filter(o => o.status === "DELIVERED"),
  };

  // Get filtered orders based on selected filter and date
  const getFilteredOrders = () => {
    let filtered = orders;

    // Filter by status
    switch (selectedFilter) {
      case "Pending Order Creation":
        filtered = filtered.filter(o => o.status === "PAID");
        break;
      case "Package Pending":
        filtered = filtered.filter(o => o.status === "NEW");
        break;
      case "Packaged":
        filtered = filtered.filter(o => o.status === "PACKED");
        break;
      case "Assigned to Delivery":
        filtered = filtered.filter(o => o.status === "ASSIGNED_TO_DELIVERY");
        break;
      case "Out for Delivery":
        filtered = filtered.filter(o => o.status === "OUT_FOR_DELIVERY");
        break;
      case "Delivered/Completed":
        filtered = filtered.filter(o => o.status === "DELIVERED");
        break;
      default:
        break;
    }

    // Filter by date if selected
    if (selectedDate) {
      filtered = filtered.filter(order => {
        if (!order.createdAt?.toDate) return false;
        const orderDate = order.createdAt.toDate();
        const orderDateString = orderDate.toISOString().split('T')[0];
        return orderDateString === selectedDate;
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const clearDateFilter = () => {
    setSelectedDate("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "OUT_FOR_DELIVERY":
        return "bg-purple-100 text-purple-700";
      case "ASSIGNED_TO_DELIVERY":
        return "bg-indigo-100 text-indigo-700";
      case "PACKED":
        return "bg-blue-100 text-blue-700";
      case "NEW":
        return "bg-yellow-100 text-yellow-700";
      case "PAID":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "DELIVERED":
        return "Delivered";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      case "ASSIGNED_TO_DELIVERY":
        return "Assigned to Delivery";
      case "PACKED":
        return "Packaged";
      case "NEW":
        return "Package Pending";
      case "PAID":
        return "Pending Creation";
      default:
        return status;
    }
  };

  return (
    <AdminLayout title="Orders">
      
      {/* Header with Filters */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Filter by Status</h3>
          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all text-sm font-medium text-gray-700"
              />
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {selectedDate && (
                <button
                  onClick={clearDateFilter}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear date filter"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#0a66c2] text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              + Create Order
            </button>
          </div>
        </div>

        {/* Date Filter Info */}
        {selectedDate && (
          <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-700">
              Showing orders from <span className="font-semibold">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
            <button
              onClick={clearDateFilter}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}
        
        <div className="flex gap-3 flex-wrap">
          {[
            "All",
            "Pending Order Creation",
            "Package Pending",
            "Packaged",
            "Assigned to Delivery",
            "Out for Delivery",
            "Delivered/Completed"
          ].map(filter => {
            // Calculate count for each filter
            let count = 0;
            const baseOrders = selectedDate 
              ? orders.filter(order => {
                  if (!order.createdAt?.toDate) return false;
                  const orderDate = order.createdAt.toDate();
                  const orderDateString = orderDate.toISOString().split('T')[0];
                  return orderDateString === selectedDate;
                })
              : orders;

            switch(filter) {
              case "All":
                count = baseOrders.length;
                break;
              case "Pending Order Creation":
                count = baseOrders.filter(o => o.status === "PAID").length;
                break;
              case "Package Pending":
                count = baseOrders.filter(o => o.status === "NEW").length;
                break;
              case "Packaged":
                count = baseOrders.filter(o => o.status === "PACKED").length;
                break;
              case "Assigned to Delivery":
                count = baseOrders.filter(o => o.status === "ASSIGNED_TO_DELIVERY").length;
                break;
              case "Out for Delivery":
                count = baseOrders.filter(o => o.status === "OUT_FOR_DELIVERY").length;
                break;
              case "Delivered/Completed":
                count = baseOrders.filter(o => o.status === "DELIVERED").length;
                break;
            }

            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedFilter === filter
                    ? "bg-[#0a66c2] text-white shadow-md"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#0a66c2]"
                }`}
              >
                {filter} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center dark:bg-gray-800">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-800">
            <Package size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {selectedDate 
              ? `No orders available on ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
              : "No orders available in this category"}
          </p>
          {selectedDate && (
            <button
              onClick={clearDateFilter}
              className="mt-4 text-[#0a66c2] hover:underline font-medium"
            >
              Clear date filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order, idx) => {
            const total = order.items?.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            const isOrderCreated = order.status !== "PAID" && order.orderConfirmed !== false;
            const isPendingCreation = order.status === "PAID";

            return (
              <div
                key={order.id}
                onClick={() => openOrderDetails(order, idx)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-600"
              >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-full bg-[#0a66c2] text-white flex items-center justify-center font-bold text-lg">
                        {order.customerName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {order.customerName || "Unknown Customer"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Order #{String(idx + 1001).padStart(4, '0')}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      ● {getStatusDisplay(order.status)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-200">
                    📅 {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : "No date"}
                    <span className="ml-3">
                      🕐 {order.createdAt?.toDate
                        ? order.createdAt.toDate().toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : ""}
                    </span>
                  </div>
                </div>

                {/* Products */}
                <div className="p-6 space-y-3">
                  {order.items && order.items.length > 0 ? (
                    <>
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex-1">
                            <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500 dark:text-gray-200">{item.quantity}</span>
                            <span className="font-semibold text-gray-900 w-16 text-right dark:text-gray-100">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <button className="text-sm text-[#0a66c2] font-medium hover:underline">
                          +{order.items.length - 3} more
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No items</p>
                  )}
                </div>

                {/* Total */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-600">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-gray-700 dark:text-gray-200">Total</span>
                    <span className="text-gray-900 text-lg dark:text-gray-200">₹{total?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>

                {/* Mark as Created Button */}
                {isPendingCreation && (
                  <div className="px-6 pb-6">
                    <button
                      onClick={(e) => markAsCreated(order.id, e)}
                      className="w-full py-2.5 bg-[#0a66c2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Mark as Order Created
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Once confirmed, order will be ready for packaging
                    </p>
                  </div>
                )}

                {/* Order Confirmed Message */}
                {isOrderCreated && !isPendingCreation && (
                  <div className="px-6 pb-6">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle size={16} className="text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Order in Progress</p>
                        <p className="text-xs text-blue-700">Track status updates above</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sidebar Overlay */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={closeSidebar}
          />
          <div
            className={`fixed right-0 top-0 h-full w-full max-w-md shadow-2xl z-50 transition-transform duration-300 ${
              showSidebar ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {selectedOrder && (
              <OrderDetailsSidebar
                order={selectedOrder}
                onClose={closeSidebar}
                onStatusUpdate={updateStatus}
                onDownload={downloadInvoice}
                getStatusColor={getStatusColor}
                getStatusDisplay={getStatusDisplay}
              />
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchOrders}
        />
      )}
    </AdminLayout>
  );
}
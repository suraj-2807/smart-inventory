import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import AdminLayout from "../layouts/AdminLayout";
import { FileText, CheckCircle, Clock, AlertCircle, FileEdit, ChevronLeft, ChevronRight, Search, X, Download, Package, Truck, Check, PlayCircle, Send } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("customer");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const storeId = getStoreId();
      const q = storeId ? query(collection(db, "orders"), where("storeId", "==", storeId)) : collection(db, "orders");
      const snapshot = await getDocs(q);
      setInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Invoice fetch error:", error);
      alert("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoice, index) => {
    const doc = new jsPDF();
    const orderNumber = String(index + 1001).padStart(4, "0");

    // Header
    doc.setFontSize(18);
    doc.text("INVOICE", 14, 20);

    doc.setFontSize(11);
    doc.text(`Order No: #${orderNumber}`, 14, 30);
    doc.text(`Customer: ${invoice.customerName || "N/A"}`, 14, 36);

    if (invoice.createdAt?.toDate) {
      doc.text(
        `Date: ${invoice.createdAt.toDate().toLocaleDateString()}`,
        14,
        42
      );
    }

    // Table data
    const tableBody = invoice.items?.map((item, i) => [
      i + 1,
      item.name,
      item.quantity,
      `₹${item.price}`,
      `₹${(item.price * item.quantity).toFixed(2)}`
    ]) || [];

    autoTable(doc, {
      startY: 50,
      head: [["#", "Product", "Qty", "Price", "Total"]],
      body: tableBody,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [25, 100, 253] }
    });

    const total = invoice.items?.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) || 0;

    const finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.text(`Grand Total: ₹${total.toFixed(2)}`, 14, finalY + 10);
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 14, finalY + 20);
    doc.save(`Invoice_${orderNumber}.pdf`);
  };

  // Calculate stats for top boxes
  const stats = {
    orderCreated: invoices.filter(i => i.status === "NEW" || i.status === "PAID"),
    onProcess: invoices.filter(i => i.status === "PACKED"),
    outForDelivery: invoices.filter(i => i.status === "OUT_FOR_DELIVERY"),
    completed: invoices.filter(i => i.status === "DELIVERED"),
  };

  // Filter stats
  const filterStats = {
    pendingCreation: invoices.filter(i => i.status === "PAID"),
    packagePending: invoices.filter(i => i.status === "NEW"),
    packaged: invoices.filter(i => i.status === "PACKED"),
    assignedToDelivery: invoices.filter(i => i.status === "ASSIGNED_TO_DELIVERY"),
    outForDelivery: invoices.filter(i => i.status === "OUT_FOR_DELIVERY"),
    completed: invoices.filter(i => i.status === "DELIVERED"),
  };

  const getFilteredInvoices = () => {
    let filtered = invoices;

    // Filter by tab
    switch (selectedTab) {
      case "Pending Order Creation":
        filtered = filterStats.pendingCreation;
        break;
      case "Package Pending":
        filtered = filterStats.packagePending;
        break;
      case "Packaged":
        filtered = filterStats.packaged;
        break;
      case "Assigned to Delivery":
        filtered = filterStats.assignedToDelivery;
        break;
      case "Out for Delivery":
        filtered = filterStats.outForDelivery;
        break;
      case "Delivered/Completed":
        filtered = filterStats.completed;
        break;
      default:
        filtered = invoices;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((invoice, idx) => {
        const query = searchQuery.toLowerCase().trim();
        const orderNumber = String(idx + 1001).padStart(4, '0');
        
        switch (searchBy) {
          case "customer":
            return invoice.customerName?.toLowerCase().includes(query);
          case "invoice":
            return orderNumber.includes(query);
          case "date":
            const dateStr = invoice.createdAt?.toDate
              ? invoice.createdAt.toDate().toLocaleDateString()
              : "";
            return dateStr.includes(query);
          case "phone":
            return invoice.customerPhone?.includes(query);
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredInvoices = getFilteredInvoices();
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchBy("customer");
    setShowSearch(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">Delivered</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">Out for Delivery</span>;
      case "ASSIGNED_TO_DELIVERY":
        return <span className="px-3 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">Assigned to Delivery</span>;
      case "PACKED":
        return <span className="px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">Packaged</span>;
      case "NEW":
        return <span className="px-3 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700">Package Pending</span>;
      case "PAID":
        return <span className="px-3 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">Pending Creation</span>;
      default:
        return <span className="px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">Unknown</span>;
    }
  };

  const getOrderStatusSteps = (status) => {
    const steps = [
      { key: "NEW", label: "Created", icon: FileText },
      { key: "PACKED", label: "Packaged", icon: Package },
      { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
      { key: "DELIVERED", label: "Completed", icon: CheckCircle }
    ];

    const statusOrder = ["NEW", "PAID", "PACKED", "ASSIGNED_TO_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, idx) => {
      let stepStatus = statusOrder[idx];
      if (idx === 1) stepStatus = "PACKED";
      if (idx === 2) stepStatus = "OUT_FOR_DELIVERY";
      if (idx === 3) stepStatus = "DELIVERED";

      return {
        ...step,
        completed: currentIndex >= idx,
        active: currentIndex === idx
      };
    });
  };

  return (
    <AdminLayout title="Invoices">
      {/* Stats Cards - Top Status Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Order Created */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText size={24} className="text-[#0a66c2]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">Order Created</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stats.orderCreated.length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* On Process */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <PlayCircle size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">On Process</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stats.onProcess.length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Out for Delivery */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Truck size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">Out for Delivery</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stats.outForDelivery.length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">Completed</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-200">{stats.completed.length}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-600">
        {/* Tabs and Search */}
        <div className="border-b border-gray-200 px-6 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Filter by Status</h3>
            
            {/* Search Section */}
            <div className="flex items-center gap-3">
              {!showSearch ? (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-[#0a66c2] hover:text-[#0a66c2] transition-colors dark:text-gray-200"
                >
                  <Search size={18} />
                  Search
                </button>
              ) : (
                <div className="flex items-center gap-2 animate-slideIn">
                  {/* Search By Dropdown */}
                  <select
                    value={searchBy}
                    onChange={(e) => setSearchBy(e.target.value)}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    <option value="customer">Customer Name</option>
                    <option value="invoice">Invoice Number</option>
                    <option value="date">Date</option>
                    <option value="phone">Phone Number</option>
                  </select>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={`Search by ${searchBy === "customer" ? "customer name" : 
                                               searchBy === "invoice" ? "invoice #" : 
                                               searchBy === "date" ? "date" : "phone"}`}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-64 pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all text-sm"
                      autoFocus
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* Clear Button */}
                  <button
                    onClick={clearSearch}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Clear search"
                  >
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {[
              "All",
              "Pending Order Creation",
              "Package Pending",
              "Packaged",
              "Assigned to Delivery",
              "Out for Delivery",
              "Delivered/Completed"
            ].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 font-medium text-sm transition-all whitespace-nowrap rounded-lg ${
                  selectedTab === tab
                    ? "bg-[#0a66c2] text-white"
                    : "dark:text-gray-400 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab} ({
                  tab === "All" ? invoices.length :
                  tab === "Pending Order Creation" ? filterStats.pendingCreation.length :
                  tab === "Package Pending" ? filterStats.packagePending.length :
                  tab === "Packaged" ? filterStats.packaged.length :
                  tab === "Assigned to Delivery" ? filterStats.assignedToDelivery.length :
                  tab === "Out for Delivery" ? filterStats.outForDelivery.length :
                  filterStats.completed.length
                })
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-700">
              Found <span className="font-semibold">{filteredInvoices.length}</span> result{filteredInvoices.length !== 1 ? 's' : ''} for "{searchQuery}"
              {searchBy && ` in ${searchBy === "customer" ? "Customer Name" : 
                                  searchBy === "invoice" ? "Invoice Number" : 
                                  searchBy === "date" ? "Date" : "Phone Number"}`}
            </p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading invoices...</div>
        ) : paginatedInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-gray-800">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No invoices found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No results matching "${searchQuery}"`
                : "No invoices available in this category"}
            </p>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 text-[#0a66c2] hover:underline font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-200">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-200">Create</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-200">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-200">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-200">Order Progress</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedInvoices.map((invoice, idx) => {
                  const createDate = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date();
                  const steps = getOrderStatusSteps(invoice.status);

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors dark:hover:bg-gray-700">
                      {/* Client */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0a66c2] flex items-center justify-center text-white font-semibold text-sm">
                            {invoice.customerName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm dark:text-gray-200">
                              {invoice.customerName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              #{String(startIndex + idx + 1001).padStart(4, '0')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Create Date */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                        {createDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-200">
                        ₹{invoice.totalAmount || 0}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(invoice.status)}
                      </td>

                      {/* Order Progress */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {steps.map((step, stepIdx) => {
                            const Icon = step.icon;
                            return (
                              <div key={step.key} className="flex items-center">
                                <div className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                                  step.completed 
                                    ? step.active
                                      ? 'bg-[#0a66c2] text-white'
                                      : 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  <Icon size={14} />
                                </div>
                                {stepIdx < steps.length - 1 && (
                                  <div className={`w-8 h-0.5 mx-1 ${
                                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => downloadInvoice(invoice, startIndex + idx)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0a66c2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm mx-auto"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? "bg-[#0a66c2] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}
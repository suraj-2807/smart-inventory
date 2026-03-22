import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { getStoreId } from "@/services/storeHelper";
import { sendOrderNotification } from "@/services/notificationService";
import StaffLayout from "../layouts/StaffLayout";
import { Package, CheckCircle, AlertTriangle, Box, Truck, User } from "lucide-react";

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storeId = getStoreId();
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);

      // Fetch orders with status NEW or PACKED
      const ordersSnapshot = await getDocs(buildQ("orders"));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const relevantOrders = allOrders.filter(o => o.status === "NEW" || o.status === "PACKED");
      setOrders(relevantOrders);

      // Fetch all products
      const productsSnapshot = await getDocs(buildQ("products"));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);

      // Fetch delivery staff from Firestore (single where + client filter to avoid composite index)
      const staffQ = storeId
        ? query(collection(db, "staff"), where("storeId", "==", storeId))
        : collection(db, "staff");
      const staffSnapshot = await getDocs(staffQ);
      const deliveryStaff = staffSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => s.role === "Delivery Staff");

      // Get today's start for delivery count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(todayStart);

      // Fetch today's assigned/in-progress orders to calculate busy status
      const assignedOrders = allOrders.filter(o => {
        if (o.status !== "ASSIGNED_TO_DELIVERY" && o.status !== "OUT_FOR_DELIVERY") return false;
        const assignedAt = o.assignedAt?.toDate?.() || (o.assignedAt ? new Date(o.assignedAt) : null);
        if (!assignedAt) return false;
        return assignedAt >= todayStart;
      });

      // Map delivery staff with busy status and today's delivery count
      const partnersWithStatus = deliveryStaff.map(staff => {
        const todayDeliveries = assignedOrders.filter(o => o.assignedTo === staff.name);
        const activeDeliveries = allOrders.filter(
          o => (o.status === "ASSIGNED_TO_DELIVERY" || o.status === "OUT_FOR_DELIVERY") && o.assignedTo === staff.name
        );
        return {
          id: staff.id,
          name: staff.name,
          phone: staff.phone || "N/A",
          vehicle: staff.department || "N/A",
          status: activeDeliveries.length >= 5 ? "busy" : "available",
          todayCount: todayDeliveries.length,
          activeCount: activeDeliveries.length,
        };
      });

      setDeliveryPartners(partnersWithStatus);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getProductStock = (productName) => {
    const product = products.find(p => p.name === productName);
    return product?.stock || 0;
  };

  const getProductId = (productName) => {
    const product = products.find(p => p.name === productName);
    return product?.id;
  };

  const checkStockAvailability = (order) => {
    if (!order.items) return { available: false, issues: [] };
    
    const issues = [];
    let allAvailable = true;

    order.items.forEach(item => {
      const availableStock = getProductStock(item.name);
      if (availableStock < item.quantity) {
        allAvailable = false;
        issues.push({
          product: item.name,
          required: item.quantity,
          available: availableStock,
          shortage: item.quantity - availableStock
        });
      }
    });

    return { available: allAvailable, issues };
  };

  const handlePackOrder = async (order) => {
    const stockCheck = checkStockAvailability(order);
    
    if (!stockCheck.available) {
      alert(`Cannot pack order! Stock shortage:\n${stockCheck.issues.map(i => 
        `${i.product}: Need ${i.required}, Only ${i.available} available (Short: ${i.shortage})`
      ).join('\n')}`);
      return;
    }

    if (!confirm(`Pack this order for ${order.customerName}?\n\nThis will:\n- Update order status to PACKED\n- Reduce stock for all items\n- Make order ready for delivery assignment`)) {
      return;
    }

    setLoading(true);

    try {
      const batch = writeBatch(db);

      // Update order status
      const orderRef = doc(db, "orders", order.id);
      batch.update(orderRef, {
        status: "PACKED",
        packedAt: new Date(),
        packedBy: "Warehouse Staff"
      });

      // Reduce stock for each item
      order.items.forEach(item => {
        const productId = getProductId(item.name);
        if (productId) {
          const productRef = doc(db, "products", productId);
          const currentStock = getProductStock(item.name);
          const newStock = currentStock - item.quantity;
          batch.update(productRef, { stock: newStock });
        }
      });

      await batch.commit();

      // Send packed notification email
      sendOrderNotification("ORDER_PACKED", {
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items,
        totalAmount: order.totalAmount || order.items?.reduce((s, i) => s + i.price * i.quantity, 0),
        orderNumber: order.id.substring(0, 8).toUpperCase(),
      });

      alert(`✅ Order packed successfully!\n\nOrder is now ready for delivery assignment.`);
      fetchData(); // Refresh data
      setShowPackModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error packing order:", error);
      alert("Error packing order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedPartner) {
      alert("Please select a delivery partner");
      return;
    }

    const partner = deliveryPartners.find(p => p.id === selectedPartner);
    if (!partner) return;

    setLoading(true);

    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), {
        status: "ASSIGNED_TO_DELIVERY",
        assignedTo: partner.name,
        assignedPhone: partner.phone,
        assignedVehicle: partner.vehicle,
        assignedAt: new Date(),
        assignedDate: new Date().toISOString().split('T')[0],
        assignedBy: "Warehouse Staff"
      });

      // Send assigned to delivery notification email
      sendOrderNotification("ASSIGNED_TO_DELIVERY", {
        customerName: selectedOrder.customerName,
        customerEmail: selectedOrder.customerEmail,
        customerPhone: selectedOrder.customerPhone,
        items: selectedOrder.items,
        totalAmount: selectedOrder.totalAmount || selectedOrder.items?.reduce((s, i) => s + i.price * i.quantity, 0),
        orderNumber: selectedOrder.id.substring(0, 8).toUpperCase(),
        assignedTo: partner.name,
      });

      alert(`✅ Order assigned to ${partner.name}\n\nThe delivery partner will be notified.`);
      fetchData();
      setShowAssignModal(false);
      setSelectedOrder(null);
      setSelectedPartner("");
    } catch (error) {
      console.error("Error assigning delivery:", error);
      alert("Error assigning delivery. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openPackModal = (order) => {
    setSelectedOrder(order);
    setShowPackModal(true);
  };

  const openAssignModal = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  return (
    <StaffLayout title="Orders to Pack">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Orders Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {orders.filter(o => o.status === "NEW").length} orders to pack • {orders.filter(o => o.status === "PACKED").length} ready for assignment
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            No orders to process
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            All orders are currently assigned or in other stages
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order, idx) => {
            const stockCheck = checkStockAvailability(order);
            const total = order.items?.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ) || 0;
            const isPacked = order.status === "PACKED";

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                        {order.customerName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {order.customerName || "Unknown"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Order #{String(idx + 1001).padStart(4, '0')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isPacked 
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                    }`}>
                      ● {isPacked ? "Packed" : "To Pack"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    📅 {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })
                      : "No date"}
                  </div>
                </div>

                {/* Products with Stock Info */}
                {!isPacked && (
                  <div className="p-6 space-y-3">
                    {order.items?.map((item, i) => {
                      const availableStock = getProductStock(item.name);
                      const isStockSufficient = availableStock >= item.quantity;

                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.name}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Need: {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isStockSufficient ? "bg-green-500" : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min((availableStock / item.quantity) * 100, 100)}%`
                                }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              isStockSufficient ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            }`}>
                              {availableStock} available
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isPacked && (
                  <div className="p-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Packed & Ready
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {order.items?.length || 0} items packed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center font-semibold mb-4">
                    <span className="text-gray-700 dark:text-gray-300">Total</span>
                    <span className="text-gray-900 dark:text-gray-100 text-lg">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>

                  {/* Stock Alert */}
                  {!isPacked && !stockCheck.available && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-red-800 dark:text-red-300">
                          <p className="font-semibold mb-1">Insufficient Stock</p>
                          {stockCheck.issues.slice(0, 2).map((issue, i) => (
                            <p key={i}>
                              {issue.product}: Short by {issue.shortage}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isPacked ? (
                    <button
                      onClick={() => openPackModal(order)}
                      disabled={!stockCheck.available}
                      className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        stockCheck.available
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Box size={18} />
                      {stockCheck.available ? "Pack Order" : "Stock Unavailable"}
                    </button>
                  ) : (
                    <button
                      onClick={() => openAssignModal(order)}
                      className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Truck size={18} />
                      Assign to Delivery
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pack Confirmation Modal */}
      {showPackModal && selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowPackModal(false);
              setSelectedOrder(null);
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Confirm Packing
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Order #{String(orders.indexOf(selectedOrder) + 1001).padStart(4, '0')}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Customer: {selectedOrder.customerName}
                  </p>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Items to pack:
                  </p>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span>{item.name}</span>
                      <span className="font-medium">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPackModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePackOrder(selectedOrder)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Packing..."
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Confirm Pack
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Delivery Partner Modal */}
      {showAssignModal && selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setShowAssignModal(false);
              setSelectedOrder(null);
              setSelectedPartner("");
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Assign Delivery Partner
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Order #{String(orders.indexOf(selectedOrder) + 1001).padStart(4, '0')} • {selectedOrder.customerName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Delivery Partner
                  </label>
                  <div className="space-y-2">
                    {deliveryPartners.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <Truck size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No delivery staff found for this store.</p>
                        <p className="text-xs mt-1">Ask your admin to add delivery staff members.</p>
                      </div>
                    ) : (
                    deliveryPartners.map(partner => (
                      <label
                        key={partner.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPartner === partner.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                        } ${
                          partner.status === "busy"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery-partner"
                          value={partner.id}
                          checked={selectedPartner === partner.id}
                          onChange={(e) => setSelectedPartner(e.target.value)}
                          disabled={partner.status === "busy"}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                          {partner.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {partner.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {partner.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            partner.status === "available"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          }`}>
                            {partner.status}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Today: {partner.todayCount} deliveries
                          </p>
                        </div>
                      </label>
                    ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedOrder(null);
                    setSelectedPartner("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDelivery}
                  disabled={loading || !selectedPartner}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Assigning..."
                  ) : (
                    <>
                      <Truck size={18} />
                      Assign Partner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </StaffLayout>
  );
}
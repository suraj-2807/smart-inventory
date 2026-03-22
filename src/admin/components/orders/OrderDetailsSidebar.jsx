import { useState } from "react";
import { X, MapPin, Phone, Mail, Package, Clock, ChevronDown, ChevronUp, Download, Send, ExternalLink, Check, FileText, Truck, PlayCircle, CheckCircle, AlertCircle } from "lucide-react";
import { sendInvoiceEmail } from "@/services/notificationService";

// Order Details Sidebar Component
export default function OrderDetailsSidebar({ order, onClose, onStatusUpdate, onDownload, getStatusColor, getStatusDisplay }) {
  const [expandCustomer, setExpandCustomer] = useState(true);
  const [expandTimeline, setExpandTimeline] = useState(true);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState({ type: "", text: "" });

  if (!order) return null;

  const total = order.items?.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  ) || 0;

  const subtotal = order.subtotal || total;
  const shippingCost = order.shippingCost || 0;
  const discount = order.discount || 0;

  // Get timeline events based on order status
  const getTimelineEvents = () => {
    const statusOrder = ["PAID", "NEW", "PACKED", "ASSIGNED_TO_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    
    const events = [];
    
    // Always show order created
    events.push({
      icon: FileText,
      color: "blue",
      title: "Order Created",
      date: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(),
      completed: true,
      current: false
    });

    // Payment received (PAID status)
    const paidIndex = 0;
    events.push({
      icon: Check,
      color: currentStatusIndex >= paidIndex ? "green" : "gray",
      title: "Payment Received",
      date: order.paidAt?.toDate ? order.paidAt.toDate() : (currentStatusIndex >= paidIndex ? order.createdAt?.toDate() : null),
      completed: currentStatusIndex >= paidIndex,
      current: currentStatusIndex === paidIndex
    });

    // Order Confirmed (NEW status)
    const newIndex = 1;
    events.push({
      icon: CheckCircle,
      color: currentStatusIndex >= newIndex ? "indigo" : "gray",
      title: "Order Confirmed",
      date: order.confirmedAt?.toDate ? order.confirmedAt.toDate() : (currentStatusIndex >= newIndex ? new Date() : null),
      completed: currentStatusIndex >= newIndex,
      current: currentStatusIndex === newIndex
    });

    // Packaged (PACKED status)
    const packedIndex = 2;
    events.push({
      icon: Package,
      color: currentStatusIndex >= packedIndex ? "yellow" : "gray",
      title: "Order Packaged",
      date: order.packedAt?.toDate ? order.packedAt.toDate() : (currentStatusIndex >= packedIndex ? new Date() : null),
      completed: currentStatusIndex >= packedIndex,
      current: currentStatusIndex === packedIndex
    });

    // Assigned to Delivery
    const assignedIndex = 3;
    events.push({
      icon: PlayCircle,
      color: currentStatusIndex >= assignedIndex ? "purple" : "gray",
      title: "Assigned to Delivery",
      date: order.assignedAt?.toDate ? order.assignedAt.toDate() : (currentStatusIndex >= assignedIndex ? new Date() : null),
      completed: currentStatusIndex >= assignedIndex,
      current: currentStatusIndex === assignedIndex
    });

    // Out for Delivery
    const outForDeliveryIndex = 4;
    events.push({
      icon: Truck,
      color: currentStatusIndex >= outForDeliveryIndex ? "orange" : "gray",
      title: "Out for Delivery",
      date: order.outForDeliveryAt?.toDate ? order.outForDeliveryAt.toDate() : (currentStatusIndex >= outForDeliveryIndex ? new Date() : null),
      completed: currentStatusIndex >= outForDeliveryIndex,
      current: currentStatusIndex === outForDeliveryIndex
    });

    // Delivered
    const deliveredIndex = 5;
    events.push({
      icon: CheckCircle,
      color: currentStatusIndex >= deliveredIndex ? "green" : "gray",
      title: "Delivered",
      date: order.deliveredAt?.toDate ? order.deliveredAt.toDate() : (currentStatusIndex >= deliveredIndex ? new Date() : null),
      completed: currentStatusIndex >= deliveredIndex,
      current: currentStatusIndex === deliveredIndex
    });

    return events;
  };

  const timelineEvents = getTimelineEvents();

  const getIconBgColor = (color) => {
    const colors = {
      blue: "bg-blue-100",
      green: "bg-green-100",
      indigo: "bg-indigo-100",
      yellow: "bg-yellow-100",
      purple: "bg-purple-100",
      orange: "bg-orange-100",
      gray: "bg-gray-100"
    };
    return colors[color] || "bg-gray-100";
  };

  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      indigo: "text-indigo-600",
      yellow: "text-yellow-600",
      purple: "text-purple-600",
      orange: "text-orange-600",
      gray: "text-gray-400"
    };
    return colors[color] || "text-gray-600";
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-[#0a66c2] text-white flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Order #{order.orderNumber}</h2>
            <p className="text-sm text-white/80 mt-1">
              {order.createdAt?.toDate
                ? order.createdAt.toDate().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          ● {getStatusDisplay(order.status)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Order Summary */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-green-600">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping ({order.shippingMethod || 'Standard'})</span>
              <span className="font-medium text-gray-900">₹{shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax @ 12.5%</span>
              <span className="font-medium text-gray-900">₹{(total * 0.125).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-[#0a66c2] text-lg">₹{(total + (total * 0.125)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div>
          <button
            onClick={() => setExpandCustomer(!expandCustomer)}
            className="w-full flex items-center justify-between mb-3 text-left"
          >
            <h3 className="text-sm font-semibold text-gray-900">Customer</h3>
            {expandCustomer ? <ChevronUp size={16} className="text-gray-600" /> : <ChevronDown size={16} className="text-gray-600" />}
          </button>
          {expandCustomer && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0a66c2] text-white flex items-center justify-center font-bold text-lg">
                  {order.customerName?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{order.customerName || "N/A"}</p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
              <div className="space-y-3">
                {order.customerEmail && (
                  <div className="flex items-start gap-2 text-sm">
                    <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{order.customerEmail}</span>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex items-start gap-2 text-sm">
                    <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{order.customerPhone}</span>
                  </div>
                )}
                {order.customerAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      {order.customerAddress}
                      {order.customerCity && `, ${order.customerCity}`}
                      {order.customerState && `, ${order.customerState}`}
                      {order.customerPincode && ` - ${order.customerPincode}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Info */}
        {order.paymentScreenshot && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Proof</h3>
            
            <a  
              href={order.paymentScreenshot}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-green-600 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              <ExternalLink size={18} />
              View Payment Screenshot
            </a>
          </div>
        )}

        {/* Order Progress Timeline */}
        <div>
          <button
            onClick={() => setExpandTimeline(!expandTimeline)}
            className="w-full flex items-center justify-between mb-3 text-left"
          >
            <h3 className="text-sm font-semibold text-gray-900">Order Progress</h3>
            {expandTimeline ? <ChevronUp size={16} className="text-gray-600" /> : <ChevronDown size={16} className="text-gray-600" />}
          </button>
          {expandTimeline && (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Timeline Events */}
              <div className="space-y-4 relative">
                {timelineEvents.map((event, index) => {
                  const Icon = event.icon;
                  const isCompleted = event.completed;
                  const isCurrent = event.current;
                  
                  return (
                    <div key={index} className="flex items-start gap-3 relative">
                      <div className={`w-8 h-8 ${getIconBgColor(event.color)} rounded-full flex items-center justify-center flex-shrink-0 relative z-10 border-2 ${isCurrent ? 'border-blue-500 shadow-lg' : 'border-white'} shadow-sm`}>
                        <Icon size={16} className={getIconColor(event.color)} />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {event.title}
                          {isCurrent && <span className="ml-2 text-xs text-blue-600 font-semibold">(Current)</span>}
                        </p>
                        {event.date && isCompleted ? (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {event.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        ) : isCompleted ? (
                          <p className="text-xs text-gray-400 mt-0.5">Just now</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Payment Method */}
        {order.paymentMethod && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Method</p>
                  <p className="text-xs text-gray-600">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Notes */}
        {order.orderNotes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Notes</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">{order.orderNotes}</p>
            </div>
          </div>
        )}

        {/* Admin Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">ℹ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Admin Access</p>
              <p className="text-xs text-blue-700 mt-1">
                Status updates are managed by the warehouse and delivery teams. Updates will appear automatically in the timeline.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 space-y-3 bg-gray-50 flex-shrink-0">
        <div className="flex gap-3">
          <button
            onClick={() => onDownload(order, order.index)}
            className="flex-1 px-4 py-2.5 border-2 border-[#0a66c2] text-[#0a66c2] rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download
          </button>
          <button
            disabled={sendingInvoice || !order.customerEmail}
            onClick={async () => {
              setSendingInvoice(true);
              setInvoiceMsg({ type: "", text: "" });
              const result = await sendInvoiceEmail({
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerPhone: order.customerPhone,
                items: order.items,
                totalAmount: order.totalAmount || order.items?.reduce((s, i) => s + i.price * i.quantity, 0),
                orderNumber: order.orderNumber,
              });
              setSendingInvoice(false);
              if (result.success) {
                setInvoiceMsg({ type: "success", text: "Invoice sent to " + order.customerEmail });
              } else if (result.reason === "no_email") {
                setInvoiceMsg({ type: "error", text: "No customer email on this order" });
              } else if (result.reason === "not_configured") {
                setInvoiceMsg({ type: "error", text: "EmailJS not configured yet — check notificationService.js" });
              } else {
                setInvoiceMsg({ type: "error", text: result.errorMessage || "Failed to send invoice email" });
              }
              setTimeout(() => setInvoiceMsg({ type: "", text: "" }), 4000);
            }}
            className="flex-1 px-4 py-2.5 bg-[#0a66c2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingInvoice ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
            ) : (
              <><Send size={18} /> Send Invoice</>
            )}
          </button>
        </div>

        {/* Invoice status message */}
        {invoiceMsg.text && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            invoiceMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {invoiceMsg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {invoiceMsg.text}
          </div>
        )}

        {!order.customerEmail && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <AlertCircle size={14} />
            No email address on this order — invoice cannot be sent
          </div>
        )}

        {/* Current Status Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Current Status</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{getStatusDisplay(order.status)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              ● Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
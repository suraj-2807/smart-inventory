/**
 * Order Notification Service
 * Sends email notifications to customers at every order status change.
 * Uses EmailJS (browser-based email sending, no backend required).
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://www.emailjs.com/ and create a free account
 * 2. Add an email service (Gmail, Outlook, etc.) → get your SERVICE_ID
 * 3. Create an email template with these variables:
 *    {{to_email}}, {{customer_name}}, {{order_number}},
 *    {{subject}}, {{message}}, {{items_summary}}, {{total_amount}},
 *    {{store_name}}, {{status}}
 * 4. Get your TEMPLATE_ID and PUBLIC_KEY
 * 5. Replace the placeholder values below
 */

import emailjs from "@emailjs/browser";

// ─── EmailJS Configuration ──────────────────────────────────────────
// Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID = "service_vh0r0cr";   // Your EmailJS service ID
const EMAILJS_TEMPLATE_ID = "template_7c7r74e";     // Your EmailJS template ID
const EMAILJS_PUBLIC_KEY = "mze7bwOsTAKQE2q4e";      // Your EmailJS public key

// ─── Status Messages ────────────────────────────────────────────────
const STATUS_CONFIG = {
  ORDER_CREATED: {
    subject: "Order Confirmed! 🎉",
    title: "Your order has been placed successfully",
    message: "Thank you for your order! We have received your order and it is being processed. You will receive updates at every step.",
    emoji: "🛒",
  },
  ORDER_CONFIRMED: {
    subject: "Order Confirmed ✅",
    title: "Your order has been confirmed",
    message: "Great news! Your order has been confirmed and is now being prepared for packing.",
    emoji: "✅",
  },
  ORDER_PACKED: {
    subject: "Order Packed 📦",
    title: "Your order has been packed",
    message: "Your order has been carefully packed and is ready for delivery. A delivery partner will be assigned shortly.",
    emoji: "📦",
  },
  ASSIGNED_TO_DELIVERY: {
    subject: "Delivery Partner Assigned 🚚",
    title: "A delivery partner has been assigned",
    message: "Your order has been assigned to a delivery partner and will be picked up for delivery soon.",
    emoji: "🚚",
  },
  OUT_FOR_DELIVERY: {
    subject: "Out for Delivery 🏍️",
    title: "Your order is out for delivery",
    message: "Exciting! Your order is on its way to you. Please keep your phone handy for the delivery person.",
    emoji: "🏍️",
  },
  DELIVERED: {
    subject: "Order Delivered 🎉",
    title: "Your order has been delivered",
    message: "Your order has been successfully delivered! Thank you for shopping with us. We hope you enjoy your purchase!",
    emoji: "🎉",
  },
};

/**
 * Get store name from localStorage
 */
const getStoreName = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
    return auth.storeName || localStorage.getItem("storeName") || "Our Store";
  } catch {
    return "Our Store";
  }
};

/**
 * Format items list for email
 */
const formatItemsSummary = (items) => {
  if (!items || items.length === 0) return "No items";
  return items
    .map((item) => `${item.name} × ${item.quantity || item.qty || 1} — ₹${((item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}`)
    .join("\n");
};

/**
 * Format total amount
 */
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "N/A";
  return `₹${Number(amount).toFixed(2)}`;
};

/**
 * Send order notification email via EmailJS
 *
 * @param {string} type - One of: ORDER_CREATED, ORDER_CONFIRMED, ORDER_PACKED, ASSIGNED_TO_DELIVERY, OUT_FOR_DELIVERY, DELIVERED
 * @param {object} orderData - Order data containing customer info and items
 * @param {string} orderData.customerName - Customer name
 * @param {string} orderData.customerEmail - Customer email
 * @param {string} orderData.customerPhone - Customer phone
 * @param {array}  orderData.items - Order items array
 * @param {number} orderData.totalAmount - Total order amount
 * @param {string} [orderData.orderNumber] - Order number/ID
 * @param {string} [orderData.assignedTo] - Delivery partner name (for ASSIGNED_TO_DELIVERY)
 */
export const sendOrderNotification = async (type, orderData) => {
  // Validate inputs
  if (!orderData?.customerEmail) {
    console.warn("📧 No customer email provided, skipping email notification");
    return { success: false, reason: "no_email" };
  }

  const config = STATUS_CONFIG[type];
  if (!config) {
    console.warn("📧 Unknown notification type:", type);
    return { success: false, reason: "unknown_type" };
  }

  // Check if EmailJS is configured
  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    console.warn(
      "📧 EmailJS not configured yet. To enable email notifications:\n" +
      "1. Sign up at https://www.emailjs.com/\n" +
      "2. Update EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY in notificationService.js"
    );
    // Still log the notification that would have been sent
    console.log(`📧 [WOULD SEND] ${config.subject} to ${orderData.customerEmail}`);
    console.log(`   ${config.message}`);
    return { success: false, reason: "not_configured" };
  }

  const storeName = getStoreName();
  const orderNumber = orderData.orderNumber || "N/A";
  const itemsSummary = formatItemsSummary(orderData.items);
  const totalAmount = formatAmount(orderData.totalAmount || orderData.subtotal);

  // Build extra info based on type
  let extraInfo = "";
  if (type === "ASSIGNED_TO_DELIVERY" && orderData.assignedTo) {
    extraInfo = `\nDelivery Partner: ${orderData.assignedTo}`;
  }

  const templateParams = {
    to_email: orderData.customerEmail,
    customer_name: orderData.customerName || "Customer",
    order_number: orderNumber,
    subject: `${config.subject} — Order #${orderNumber}`,
    title: config.title,
    message: config.message + extraInfo,
    items_summary: itemsSummary,
    total_amount: totalAmount,
    store_name: storeName,
    status: type.replace(/_/g, " "),
    emoji: config.emoji,
  };

  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log(`✅ Email sent: ${config.subject} to ${orderData.customerEmail}`, result);
    return { success: true, result };
  } catch (error) {
    console.error(`❌ Failed to send email (${type}):`, error);
    const errMsg = error?.text || error?.message || JSON.stringify(error);
    return { success: false, error, errorMessage: errMsg };
  }
};

/**
 * Send invoice email to customer
 */
export const sendInvoiceEmail = async (orderData) => {
  if (!orderData?.customerEmail) {
    console.warn("📧 No customer email for invoice");
    return { success: false, reason: "no_email" };
  }

  const storeName = getStoreName();
  const orderNumber = orderData.orderNumber || "N/A";
  const itemsSummary = formatItemsSummary(orderData.items);
  const totalAmount = formatAmount(orderData.totalAmount || orderData.subtotal);

  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
    console.warn("📧 EmailJS not configured — invoice email not sent");
    console.log(`📧 [WOULD SEND] Invoice for Order #${orderNumber} to ${orderData.customerEmail}`);
    return { success: false, reason: "not_configured" };
  }

  const templateParams = {
    to_email: orderData.customerEmail,
    customer_name: orderData.customerName || "Customer",
    order_number: orderNumber,
    subject: `Invoice for Order #${orderNumber} — ${storeName}`,
    title: "Your Invoice",
    message: `Here is the invoice for your order #${orderNumber}. Thank you for shopping with ${storeName}!`,
    items_summary: itemsSummary,
    total_amount: totalAmount,
    store_name: storeName,
    status: "INVOICE",
    emoji: "🧾",
  };

  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log(`✅ Invoice email sent to ${orderData.customerEmail}`, result);
    return { success: true, result };
  } catch (error) {
    console.error("❌ Failed to send invoice email:", error);
    const errMsg = error?.text || error?.message || JSON.stringify(error);
    return { success: false, error, errorMessage: errMsg };
  }
};

export default {
  sendOrderNotification,
  sendInvoiceEmail,
  STATUS_CONFIG,
};

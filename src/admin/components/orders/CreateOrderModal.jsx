import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import { X, Plus, Trash2, Upload, Check, ShoppingCart, User, MapPin, Mail } from "lucide-react";

export default function CreateOrderModal({ onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);

  // Customer Details
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");

  // Order Details
  const [orderNotes, setOrderNotes] = useState("");
  const [shippingMethod, setShippingMethod] = useState("Standard");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [paymentFile, setPaymentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const storeId = getStoreId();
    let q;
    if (storeId) {
      q = query(collection(db, "products"), where("storeId", "==", storeId));
    } else {
      q = collection(db, "products");
    }
    const snapshot = await getDocs(q);
    setProducts(
      snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.isActive && p.stock > 0)
    );
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  /* ---------------- ADD PRODUCT TO ORDER ---------------- */
  const addItemToOrder = () => {
    if (!selectedProduct) return alert("Select a product");
    if (quantity > selectedProduct.stock)
      return alert("Quantity exceeds stock");

    const exists = orderItems.find(i => i.productId === selectedProduct.id);
    if (exists) return alert("Product already added");

    setOrderItems([
      ...orderItems,
      {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity,
        total: selectedProduct.price * quantity
      }
    ]);

    setSelectedProductId("");
    setQuantity(1);
  };

  /* ---------------- REMOVE ITEM ---------------- */
  const removeItem = (productId) => {
    setOrderItems(orderItems.filter(i => i.productId !== productId));
  };

  const subtotal = orderItems.reduce((sum, i) => sum + i.total, 0);
  const shippingCost = shippingMethod === "Express" ? 100 : shippingMethod === "Standard" ? 50 : 0;
  const totalAmount = subtotal + shippingCost;

  /* ---------------- CLOUDINARY UPLOAD ---------------- */
  const uploadPaymentScreenshot = async () => {
    if (!paymentFile) return "";

    setUploading(true);
    setUploadSuccess(false);
    const formData = new FormData();
    formData.append("file", paymentFile);
    formData.append("upload_preset", "product_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload",
      { method: "POST", body: formData }
    );

    const data = await res.json();
    setUploading(false);
    setUploadSuccess(true);
    return data.secure_url;
  };

  /* ---------------- SUBMIT ORDER ---------------- */
  const handleSubmit = async () => {
    if (!customerName || !customerPhone)
      return alert("Enter customer name and phone");
    if (!customerAddress || !customerCity || !customerState || !customerPincode)
      return alert("Enter complete address details");
    if (orderItems.length === 0)
      return alert("Add at least one product");

    const paymentUrl = await uploadPaymentScreenshot();

    await addDoc(collection(db, "orders"), {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPincode,
      items: orderItems,
      subtotal,
      shippingCost,
      totalAmount,
      shippingMethod,
      paymentMethod,
      orderNotes,
      paymentScreenshot: paymentUrl,
      status: paymentUrl ? "PAID" : "NEW",
      storeId: getStoreId() || "",
      createdAt: serverTimestamp()
    });

    onSuccess();
    onClose();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0a66c2] p-6 text-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
              <h2 className="text-2xl font-bold">Create New Order</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Customer Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <User size={16} />
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  placeholder="Enter customer name"
                  className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  placeholder="Enter phone number"
                  className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <MapPin size={16} />
              Shipping Address
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <textarea
                  placeholder="House no., Building name, Street, Area"
                  rows="2"
                  className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all resize-none"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    placeholder="City"
                    className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    value={customerCity}
                    onChange={e => setCustomerCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    placeholder="State"
                    className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    value={customerState}
                    onChange={e => setCustomerState(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    placeholder="Pincode"
                    className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    value={customerPincode}
                    onChange={e => setCustomerPincode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Add Products
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="grid grid-cols-12 gap-3 mb-3">
                <div className="col-span-7">
                  <select
                    className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    value={quantity}
                    onChange={e => setQuantity(+e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <button
                    onClick={addItemToOrder}
                    className="w-full h-full bg-[#0a66c2] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>

              {selectedProduct && (
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <span className="font-medium">Price:</span> ₹{selectedProduct.price} per unit
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Order Items ({orderItems.length})
              </h3>
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between animate-fadeIn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <Check size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900 text-lg">
                        ₹{item.total}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Shipping ({shippingMethod})</span>
                  <span className="font-semibold">₹{shippingCost.toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-blue-300 pt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Total Amount</span>
                  <span className="font-bold text-[#0a66c2] text-2xl">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Order Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Method
                </label>
                <select
                  className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  value={shippingMethod}
                  onChange={e => setShippingMethod(e.target.value)}
                >
                  <option value="Standard">Standard (₹50 - 5-7 days)</option>
                  <option value="Express">Express (₹100 - 2-3 days)</option>
                  <option value="Free">Free (10-15 days)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="COD">Cash on Delivery</option>
                  <option value="Online">Online Payment</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Credit/Debit Card</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes (Optional)
              </label>
              <textarea
                placeholder="Any special instructions or notes for this order"
                rows="3"
                className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all resize-none"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Screenshot */}
          {paymentMethod !== "COD" && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Payment Proof {paymentMethod === "Online" || paymentMethod === "UPI" ? "*" : "(Optional)"}
              </h3>
              <div className="relative">
                <input
                  type="file"
                  id="payment-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    setPaymentFile(e.target.files[0]);
                    setUploadSuccess(false);
                  }}
                />
                <label
                  htmlFor="payment-upload"
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    paymentFile
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-[#0a66c2] hover:bg-gray-50"
                  }`}
                >
                  {paymentFile ? (
                    <>
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                        <Check size={24} className="text-white" />
                      </div>
                      <p className="text-green-700 font-medium mb-1">
                        {paymentFile.name}
                      </p>
                      <p className="text-sm text-green-600">
                        {(paymentFile.size / 1024).toFixed(2)} KB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPaymentFile(null);
                          setUploadSuccess(false);
                        }}
                        className="mt-2 text-sm text-red-600 hover:underline"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <p className="text-gray-700 font-medium mb-1">
                        Click to upload payment screenshot
                      </p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </label>
              </div>

              {uploading && (
                <div className="mt-3 flex items-center gap-2 text-[#0a66c2]">
                  <div className="w-4 h-4 border-2 border-[#0a66c2] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Uploading payment proof...</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <Check size={16} />
                  <span className="text-sm font-medium">Payment proof uploaded successfully!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-6 py-2.5 bg-[#0a66c2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Creating..." : "Create Order"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
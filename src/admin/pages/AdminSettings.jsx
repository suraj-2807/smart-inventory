import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import AdminLayout from "../layouts/AdminLayout";
import * as XLSX from "xlsx";
import {
  Camera, User, Mail, Phone, MapPin, Building2, Lock, Upload, X, Check,
  Save, Download, FileSpreadsheet, AlertCircle, CheckCircle, Eye, EyeOff, Table, Store,
  Trash2, ShieldAlert, AlertTriangle, Package, ClipboardList, Users
} from "lucide-react";

export default function AdminSettings() {
  const [selectedTab, setSelectedTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  // User data
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // CSV import
  const [csvProducts, setCsvProducts] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [importing, setImporting] = useState(false);

  // Store details
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeGST, setStoreGST] = useState("");
  const [storeDocId, setStoreDocId] = useState("");

  // Clear store data
  const [clearAuthCode, setClearAuthCode] = useState("");
  const [clearingData, setClearingData] = useState(false);
  const [clearTarget, setClearTarget] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  const adminAuth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
  const [userDocId, setUserDocId] = useState(adminAuth?.id || "");
  const storeId = getStoreId();

  useEffect(() => {
    fetchUserData();
    fetchStoreData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Try to get by ID from adminAuth
      let userData = null;
      let foundDocId = "";
      if (adminAuth?.id) {
        const userDoc = await getDoc(doc(db, "users", adminAuth.id));
        if (userDoc.exists()) {
          userData = userDoc.data();
          foundDocId = adminAuth.id;
        }
      }

      // Fallback: query by email
      if (!userData && adminAuth?.email) {
        const q = query(collection(db, "users"), where("email", "==", adminAuth.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          userData = snap.docs[0].data();
          foundDocId = snap.docs[0].id;
        }
      }

      if (foundDocId) {
        setUserDocId(foundDocId);
        // Also persist the doc ID in localStorage for future use
        const auth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
        if (!auth.id) {
          auth.id = foundDocId;
          localStorage.setItem("adminAuth", JSON.stringify(auth));
        }
      }

      if (userData) {
        setFullName(userData.fullname || adminAuth.fullname || "");
        setBusinessName(userData.businessname || userData.storeName || "");
        setRole(userData.role || "administrator");
        setEmail(userData.email || "");
        setPhone(userData.phone || "");
        setUsername(userData.username || "admin");
        setAddress1(userData.address1 || "");
        setAddress2(userData.address2 || "");
        setImagePreview(userData.profile_url || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return showMsg("error", "Image must be under 5MB");
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview("");
  };

  const uploadImageToCloudinary = async () => {
    if (!profileImage) return imagePreview;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", profileImage);
    formData.append("upload_preset", "product_upload");
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload", { method: "POST", body: formData });
      const data = await res.json();
      setUploading(false);
      return data.secure_url;
    } catch (error) {
      setUploading(false);
      showMsg("error", "Error uploading image");
      return imagePreview;
    }
  };

  const validateProfile = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) e.phone = "Invalid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveProfile = async () => {
    if (!validateProfile()) return;
    if (!userDocId) {
      showMsg("error", "User profile not found. Please re-login and try again.");
      return;
    }
    setSaving(true);
    const profileUrl = await uploadImageToCloudinary();
    try {
      await updateDoc(doc(db, "users", userDocId), {
        fullname: fullName, businessname: businessName, role,
        email, phone, username, address1, address2, profile_url: profileUrl
      });
      // Sync localStorage
      const auth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
      auth.fullname = fullName;
      auth.email = email;
      auth.id = userDocId;
      localStorage.setItem("adminAuth", JSON.stringify(auth));
      showMsg("success", "Profile updated successfully!");
      fetchUserData();
    } catch (error) {
      showMsg("error", "Error updating profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    const e = {};
    if (!currentPassword) e.currentPassword = "Required";
    if (!newPassword) e.newPassword = "Required";
    else if (newPassword.length < 6) e.newPassword = "Min 6 characters";
    if (!confirmPassword) e.confirmPassword = "Required";
    else if (newPassword !== confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      if (!userDocId) {
        showMsg("error", "User profile not found. Please re-login and try again.");
        setSaving(false);
        return;
      }
      // Verify current password
      const userDoc = await getDoc(doc(db, "users", userDocId));
      if (userDoc.exists() && userDoc.data().password !== currentPassword) {
        showMsg("error", "Current password is incorrect");
        setSaving(false);
        return;
      }
      await updateDoc(doc(db, "users", userDocId), { password: newPassword });
      showMsg("success", "Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      showMsg("error", "Error changing password");
    } finally {
      setSaving(false);
    }
  };

  // CSV Import
  const downloadSampleCSV = () => {
    const csv = `name,price,stock,category,unit,image\n"Sample Product",299,50,"General","pcs","https://example.com/image1.jpg"\n"Another Product",599,100,"Electronics","pcs","https://example.com/image2.jpg"`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "selloship_products_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvError("");
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { setCsvError("CSV must have header + data rows"); return; }
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
      if (!headers.includes("name") || !headers.includes("price") || !headers.includes("stock")) {
        setCsvError("Missing required columns: name, price, stock"); return;
      }
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        if (vals.length < headers.length) continue;
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx]; });
        if (!row.name || !row.price) continue;
        products.push({ name: row.name, price: Number(row.price) || 0, stock: Number(row.stock) || 0, category: row.category || "", unit: row.unit || "pcs", image: row.image || row.imageurl || row.image_url || "" });
      }
      if (products.length === 0) { setCsvError("No valid products found"); return; }
      setCsvProducts(products);
    };
    reader.readAsText(file);
  };

  const importProducts = async () => {
    if (csvProducts.length === 0) return;
    setImporting(true);
    try {
      const batch = csvProducts.map(p =>
        addDoc(collection(db, "products"), { ...p, storeId, isActive: true, imageUrl: p.image || "", createdAt: serverTimestamp() })
      );
      await Promise.all(batch);
      await addDoc(collection(db, "notifications"), {
        type: "product_imported", message: `${csvProducts.length} products imported via CSV`,
        storeId, target: "all", createdAt: serverTimestamp()
      });
      showMsg("success", `${csvProducts.length} products imported successfully!`);
      setCsvProducts([]); setCsvFileName("");
    } catch (error) {
      showMsg("error", "Import failed: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  // Data Export
  const exportAllData = async () => {
    setSaving(true);
    try {
      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);

      const [ordersSnap, productsSnap, staffSnap] = await Promise.all([
        getDocs(buildQ("orders")), getDocs(buildQ("products")), getDocs(buildQ("staff"))
      ]);

      const orders = ordersSnap.docs.map(d => {
        const o = d.data();
        return {
          "Order #": o.orderNumber || d.id, Customer: o.customerName || "", Phone: o.customerPhone || "",
          Email: o.customerEmail || "", Address: o.address || "", Items: (o.items || []).map(i => `${i.name} x${i.qty}`).join("; "),
          Total: o.totalAmount || 0, Status: o.status || "", "Assigned To": o.assignedTo || "", "Payment Mode": o.paymentMode || "",
          Created: o.createdAt?.toDate?.()?.toLocaleDateString() || ""
        };
      });

      const products = productsSnap.docs.map(d => {
        const p = d.data();
        return { Name: p.name || "", Price: p.price || 0, Stock: p.stock || 0, Category: p.category || "", Unit: p.unit || "", Active: p.isActive ? "Yes" : "No" };
      });

      const staff = staffSnap.docs.map(d => {
        const s = d.data();
        return { Name: s.fullname || s.name || "", Email: s.email || "", Phone: s.phone || "", Role: s.role || "", Department: s.department || "", Status: s.status || "Active" };
      });

      const wb = XLSX.utils.book_new();
      if (orders.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(orders), "Orders");
      if (products.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), "Products");
      if (staff.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(staff), "Staff");

      XLSX.writeFile(wb, `Selloship_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showMsg("success", "Data exported successfully!");
    } catch (error) {
      showMsg("error", "Export failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Fetch store data
  const fetchStoreData = async () => {
    try {
      if (!storeId) {
        console.warn("No storeId found, cannot fetch store data");
        return;
      }
      // The storeId IS the document ID (set during onboarding via addDoc)
      const storeDoc = await getDoc(doc(db, "stores", storeId));
      if (storeDoc.exists()) {
        const s = storeDoc.data();
        setStoreDocId(storeDoc.id);
        setStoreName(s.storeName || s.name || "");
        setStoreAddress(s.storeAddress || s.address || "");
        setStorePhone(s.storePhone || s.phone || "");
        setStoreEmail(s.storeEmail || s.email || "");
        setStoreGST(s.gstNumber || "");
        console.log("✅ Store data loaded, GST:", s.gstNumber || "(empty)");
      } else {
        // Fallback: query stores collection by ownerEmail or storeId field
        console.warn("Store doc not found by ID, trying fallback query...");
        const storesQ = query(collection(db, "stores"), where("ownerEmail", "==", adminAuth?.email));
        const snap = await getDocs(storesQ);
        if (!snap.empty) {
          const s = snap.docs[0].data();
          setStoreDocId(snap.docs[0].id);
          setStoreName(s.storeName || s.name || "");
          setStoreAddress(s.storeAddress || s.address || "");
          setStorePhone(s.storePhone || s.phone || "");
          setStoreEmail(s.storeEmail || s.email || "");
          setStoreGST(s.gstNumber || "");
          console.log("✅ Store data loaded via fallback, GST:", s.gstNumber || "(empty)");
        } else {
          console.warn("No store document found at all.");
        }
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
    }
  };

  const saveStoreDetails = async () => {
    const e = {};
    if (!storeName.trim()) e.storeName = "Store name is required";
    if (storeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail)) e.storeEmail = "Invalid email";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const storeData = { storeName, storeAddress, storePhone, storeEmail, gstNumber: storeGST };
      console.log("Saving store data:", storeData, "storeDocId:", storeDocId);
      if (storeDocId) {
        await updateDoc(doc(db, "stores", storeDocId), storeData);
      } else {
        // Include storeId and ownerEmail so the doc can be found later
        const newDoc = await addDoc(collection(db, "stores"), {
          ...storeData,
          ownerEmail: adminAuth?.email || "",
          createdAt: serverTimestamp()
        });
        setStoreDocId(newDoc.id);
        // Also update localStorage storeId if not set
        const auth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
        if (!auth.storeId) {
          auth.storeId = newDoc.id;
          localStorage.setItem("adminAuth", JSON.stringify(auth));
        }
      }
      // Update localStorage
      const auth = JSON.parse(localStorage.getItem("adminAuth") || "{}");
      auth.storeName = storeName;
      localStorage.setItem("adminAuth", JSON.stringify(auth));
      localStorage.setItem("storeName", storeName);
      showMsg("success", "Store details updated!");
      console.log("✅ Store details saved, GST:", storeGST);
    } catch (error) {
      console.error("Error saving store details:", error);
      showMsg("error", "Error saving store details: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Clear store data
  const openClearConfirm = (target) => {
    setClearTarget(target);
    setClearAuthCode("");
    setShowClearConfirm(true);
  };

  const getClearLabel = (target) => {
    const labels = { orders: "Orders", products: "Products", staff: "Staff Members", all: "All Store Data" };
    return labels[target] || target;
  };

  const clearStoreData = async () => {
    if (!clearAuthCode) {
      showMsg("error", "Please enter your admin password to continue");
      return;
    }

    setClearingData(true);
    try {
      // Verify admin password
      if (!userDocId) {
        showMsg("error", "User profile not found.");
        setClearingData(false);
        return;
      }
      const userDoc = await getDoc(doc(db, "users", userDocId));
      if (!userDoc.exists() || userDoc.data().password !== clearAuthCode) {
        showMsg("error", "Incorrect password. Please try again.");
        setClearingData(false);
        return;
      }

      const buildQ = (col) => storeId ? query(collection(db, col), where("storeId", "==", storeId)) : collection(db, col);
      const targets = clearTarget === "all" ? ["orders", "products", "staff"] : [clearTarget];
      let totalDeleted = 0;

      for (const col of targets) {
        // Map collection names
        const collectionName = col === "staff" ? "users" : col;
        let q;
        if (col === "staff") {
          // Only delete staff users, not admins
          if (storeId) {
            q = query(collection(db, "users"), where("storeId", "==", storeId), where("role", "in", ["staff", "delivery"]));
          } else {
            q = query(collection(db, "users"), where("role", "in", ["staff", "delivery"]));
          }
        } else {
          q = buildQ(collectionName);
        }

        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(doc(db, collectionName, d.id)));
        await Promise.all(deletePromises);
        totalDeleted += snap.docs.length;
      }

      // Log the action
      await addDoc(collection(db, "notifications"), {
        type: "data_cleared",
        message: `Admin cleared ${getClearLabel(clearTarget)} (${totalDeleted} records)`,
        storeId, target: "admin", createdAt: serverTimestamp()
      });

      showMsg("success", `Successfully cleared ${getClearLabel(clearTarget)} — ${totalDeleted} records removed`);
      setShowClearConfirm(false);
      setClearAuthCode("");
    } catch (error) {
      showMsg("error", "Failed to clear data: " + error.message);
    } finally {
      setClearingData(false);
    }
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "store", label: "Store Details", icon: Store },
    { id: "security", label: "Security", icon: Lock },
    { id: "import", label: "Import Products", icon: Upload },
    { id: "export", label: "Export Data", icon: Download },
    { id: "danger", label: "Data Management", icon: Trash2 },
  ];

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#0a66c2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      {/* Message toast */}
      {message.text && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right ${
          message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab sidebar */}
        <div className="w-full lg:w-60 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 h-fit">
          <nav className="space-y-1">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTab(t.id); setErrors({}); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 text-sm ${
                    selectedTab === t.id
                      ? t.id === "danger" ? "bg-red-600 text-white shadow-lg shadow-red-600/25" : "bg-[#0a66c2] text-white shadow-lg shadow-[#0a66c2]/25"
                      : t.id === "danger" ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon size={18} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">

          {/* PROFILE TAB */}
          {selectedTab === "profile" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Profile header card */}
              <div className="bg-[#0a66c2] p-6">
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-3 border-white/30 shadow-xl" />
                        <button onClick={removeImage} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                        {fullName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <label htmlFor="profile-upload" className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={20} className="text-white" />
                    </label>
                    <input type="file" id="profile-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                  <div className="text-white">
                    <h2 className="text-xl font-bold">{fullName || "Admin"}</h2>
                    <p className="text-white/70 text-sm">{email}</p>
                    <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 rounded-full text-xs font-medium capitalize">{role || "Administrator"}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Full Name & Business Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all dark:bg-gray-900 dark:text-gray-100 ${
                          errors.fullName ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                        }`} placeholder="Your name" />
                    </div>
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business Name</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                        placeholder="Business name" />
                    </div>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 ${
                          errors.email ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                        }`} placeholder="email@example.com" />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 ${
                          errors.phone ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                        }`} placeholder="+91 98765 43210" />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address Line 1</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={address1} onChange={(e) => setAddress1(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                        placeholder="Street address" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address Line 2</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={address2} onChange={(e) => setAddress2(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                        placeholder="Apt, suite, building" />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={saveProfile} disabled={saving || uploading}
                    className="px-6 py-2.5 bg-[#0a66c2] text-white rounded-xl font-medium hover:bg-[#084d94] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#0a66c2]/25">
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {selectedTab === "security" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Change Password</h2>
                <p className="text-sm text-gray-500 mt-1">Update your account password</p>
              </div>
              <div className="p-6 max-w-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 ${
                        errors.currentPassword ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                      }`} placeholder="Enter current password" />
                  </div>
                  {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 ${
                        errors.newPassword ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                      }`} placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 ${
                        errors.confirmPassword ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                      }`} placeholder="Re-enter password" />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
                <div className="pt-4">
                  <button onClick={changePassword} disabled={saving}
                    className="px-6 py-2.5 bg-[#0a66c2] text-white rounded-xl font-medium hover:bg-[#084d94] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#0a66c2]/25">
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Changing...</>
                    : <><Check size={16} /> Change Password</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* IMPORT TAB */}
          {selectedTab === "import" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Import Products via CSV</h2>
                <p className="text-sm text-gray-500 mt-1">Bulk import products from a CSV file</p>
              </div>
              <div className="p-6 space-y-5">
                {/* Download template */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <FileSpreadsheet size={24} className="text-[#0a66c2] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Download CSV Template</p>
                    <p className="text-xs text-gray-500 mt-0.5">Required columns: name, price, stock | Optional: category, unit, image</p>
                  </div>
                  <button onClick={downloadSampleCSV}
                    className="px-4 py-2 bg-[#0a66c2] text-white rounded-lg text-sm font-medium hover:bg-[#084d94] transition-colors flex items-center gap-2">
                    <Download size={14} /> Download
                  </button>
                </div>

                {/* Upload area */}
                <div>
                  <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                  <button onClick={() => csvInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      csvProducts.length > 0 ? "border-green-300 bg-green-50 dark:bg-green-900/10" : "border-gray-300 dark:border-gray-600 hover:border-[#0a66c2] hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}>
                    {csvProducts.length > 0 ? (
                      <>
                        <CheckCircle size={36} className="mx-auto text-green-500 mb-2" />
                        <p className="font-semibold text-green-700 dark:text-green-400">{csvFileName}</p>
                        <p className="text-sm text-green-600 mt-1">{csvProducts.length} products ready to import</p>
                        <p className="text-xs text-gray-500 mt-2">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <Upload size={36} className="mx-auto text-gray-400 mb-2" />
                        <p className="font-medium text-gray-700 dark:text-gray-300">Click to upload CSV</p>
                        <p className="text-xs text-gray-500 mt-1">.csv files only</p>
                      </>
                    )}
                  </button>
                </div>

                {csvError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                    <p className="text-sm text-red-600">{csvError}</p>
                  </div>
                )}

                {/* Preview table */}
                {csvProducts.length > 0 && (
                  <>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
                        <Table size={14} className="text-gray-500" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preview ({csvProducts.length} products)</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">Name</th>
                              <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">Price</th>
                              <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">Stock</th>
                              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">Category</th>
                              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">Image</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvProducts.slice(0, 8).map((p, i) => (
                              <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.name}</td>
                                <td className="px-3 py-2 text-right">₹{p.price}</td>
                                <td className="px-3 py-2 text-right">{p.stock}</td>
                                <td className="px-3 py-2 text-gray-500">{p.category || "—"}</td>
                                <td className="px-3 py-2">{p.image ? <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" onError={(e) => { e.target.style.display='none'; }} /> : <span className="text-gray-400">—</span>}</td>
                              </tr>
                            ))}
                            {csvProducts.length > 8 && (
                              <tr className="border-t border-gray-100 dark:border-gray-700">
                                <td colSpan={5} className="px-3 py-2 text-center text-gray-400 text-xs">...and {csvProducts.length - 8} more</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <button onClick={importProducts} disabled={importing}
                      className="w-full py-3 bg-[#0a66c2] text-white rounded-xl font-medium hover:bg-[#084d94] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#0a66c2]/25">
                      {importing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importing...</>
                      : <><Upload size={16} /> Import {csvProducts.length} Products</>}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* EXPORT TAB */}
          {selectedTab === "export" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Export Store Data</h2>
                <p className="text-sm text-gray-500 mt-1">Download all your store data as an Excel file</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Orders</p>
                    <p className="text-xs text-gray-500 mt-1">All orders with status, items, amounts, delivery info</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Products</p>
                    <p className="text-xs text-gray-500 mt-1">Product catalog with prices, stock, categories</p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Staff</p>
                    <p className="text-xs text-gray-500 mt-1">All staff members, roles, contact info</p>
                  </div>
                </div>
                <button onClick={exportAllData} disabled={saving}
                  className="px-6 py-3 bg-[#0a66c2] text-white rounded-xl font-medium hover:bg-[#084d94] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#0a66c2]/25">
                  {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Exporting...</>
                  : <><Download size={16} /> Export All Data (Excel)</>}
                </button>
              </div>
            </div>
          )}

          {/* STORE DETAILS TAB */}
          {selectedTab === "store" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Store Details</h2>
                <p className="text-sm text-gray-500 mt-1">Edit your store information entered during setup</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Name *</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 ${
                          errors.storeName ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                        }`} placeholder="Your store name" />
                    </div>
                    {errors.storeName && <p className="text-xs text-red-500 mt-1">{errors.storeName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 ${
                          errors.storeEmail ? "border-red-300" : "border-gray-200 dark:border-gray-600"
                        }`} placeholder="store@example.com" />
                    </div>
                    {errors.storeEmail && <p className="text-xs text-red-500 mt-1">{errors.storeEmail}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Address</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                    <textarea value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} rows={3}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100 resize-none"
                      placeholder="Full store address" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Store Phone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" value={storePhone} onChange={(e) => setStorePhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                        placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">GST Number</label>
                    <div className="relative">
                      <FileSpreadsheet size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={storeGST} onChange={(e) => setStoreGST(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                        placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={saveStoreDetails} disabled={saving}
                    className="px-6 py-2.5 bg-[#0a66c2] text-white rounded-xl font-medium hover:bg-[#084d94] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#0a66c2]/25">
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    : <><Save size={16} /> Save Store Details</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DATA MANAGEMENT TAB */}
          {selectedTab === "danger" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Data Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Reset or clear specific data from your store. These actions require password verification and cannot be reversed.</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Clear Orders */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                          <ClipboardList size={20} className="text-orange-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Clear Orders</h4>
                          <p className="text-xs text-gray-400">Remove all order history</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">Permanently removes all order records including status, items, and delivery details for this store.</p>
                      <button onClick={() => openClearConfirm("orders")}
                        className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-all flex items-center justify-center gap-2">
                        <Trash2 size={14} /> Clear Orders
                      </button>
                    </div>

                    {/* Clear Products */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Package size={20} className="text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Clear Products</h4>
                          <p className="text-xs text-gray-400">Remove all product listings</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">Permanently removes all products from your catalog including images, pricing, and stock data.</p>
                      <button onClick={() => openClearConfirm("products")}
                        className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-all flex items-center justify-center gap-2">
                        <Trash2 size={14} /> Clear Products
                      </button>
                    </div>

                    {/* Clear Staff */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          <Users size={20} className="text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Clear Staff</h4>
                          <p className="text-xs text-gray-400">Remove staff & delivery accounts</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">Permanently removes all staff and delivery partner accounts. Your admin account will not be affected.</p>
                      <button onClick={() => openClearConfirm("staff")}
                        className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-all flex items-center justify-center gap-2">
                        <Trash2 size={14} /> Clear Staff
                      </button>
                    </div>

                    {/* Clear All */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                          <ShieldAlert size={20} className="text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Reset Store</h4>
                          <p className="text-xs text-gray-400">Clear all data at once</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 leading-relaxed">Removes all orders, products, and staff accounts for this store. Your admin account and store settings are preserved.</p>
                      <button onClick={() => openClearConfirm("all")}
                        className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                        <Trash2 size={14} /> Reset All Store Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clear Confirmation Modal */}
          {showClearConfirm && (
            <>
              <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowClearConfirm(false)} />
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <ShieldAlert size={20} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirm Action</h3>
                        <p className="text-sm text-gray-500">Clear {getClearLabel(clearTarget)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        You are about to permanently remove <strong>all {getClearLabel(clearTarget).toLowerCase()}</strong> from this store. This action cannot be undone.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Enter your admin password to confirm
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showNewPassword ? "text" : "password"} value={clearAuthCode} onChange={(e) => setClearAuthCode(e.target.value)}
                          className="w-full pl-10 pr-12 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent dark:bg-gray-900 dark:text-gray-100"
                          placeholder="Your admin password" />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button onClick={() => { setShowClearConfirm(false); setClearAuthCode(""); }}
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm">
                      Cancel
                    </button>
                    <button onClick={clearStoreData} disabled={clearingData || !clearAuthCode}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm">
                      {clearingData ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Clearing...</>
                      : <><Trash2 size={14} /> Confirm & Clear</>}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
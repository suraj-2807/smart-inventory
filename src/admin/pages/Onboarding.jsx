import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { db, auth } from "@/services/firebase";
import {
  Package, Store, User, Mail, Phone, Lock, Eye, EyeOff, MapPin, FileText,
  ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Upload, Download,
  Table, X, Tag, ShoppingBag, ShieldCheck, RefreshCw, MailCheck
} from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Step 1 — Store details
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storeState, setStoreState] = useState("");
  const [storePincode, setStorePincode] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [storeCategory, setStoreCategory] = useState("");

  // Step 2 — Admin credentials
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 3 — Email verification
  const [verifying, setVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);

  // Auto-poll for email verification when on step 3
  useEffect(() => {
    if (step !== 3) return;
    setAutoChecking(true);
    const interval = setInterval(async () => {
      try {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(interval);
          setAutoChecking(false);
          setStep(4);
        }
      } catch (err) {
        // silently retry
      }
    }, 3000);
    return () => {
      clearInterval(interval);
      setAutoChecking(false);
    };
  }, [step]);

  // Step 4 — Product import
  const [importMode, setImportMode] = useState(null); // "csv" | "skip"
  const [csvProducts, setCsvProducts] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");

  // Validation helpers
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isValidPhone = (val) => /^(\+91[\s-]?)?[6-9]\d{9}$/.test(val.replace(/[\s-]/g, ""));
  const isValidPincode = (val) => /^\d{6}$/.test(val.trim());
  const isValidGST = (val) => !val || /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(val.toUpperCase().trim());

  const validateStep1 = () => {
    if (!storeName.trim()) return "Store name is required";
    if (storeName.trim().length < 2) return "Store name must be at least 2 characters";
    if (!storeCategory) return "Store category is required";
    if (!storePhone.trim()) return "Store phone is required";
    if (!isValidPhone(storePhone)) return "Enter a valid Indian mobile number (e.g. +91 98765 43210)";
    if (storeEmail && !isValidEmail(storeEmail)) return "Enter a valid store email address";
    if (storePincode && !isValidPincode(storePincode)) return "Pincode must be exactly 6 digits";
    if (gstNumber && !isValidGST(gstNumber)) return "Enter a valid GST number (e.g. 22AAAAA0000A1Z5)";
    return null;
  };

  const validateStep2 = () => {
    if (!ownerName.trim()) return "Your name is required";
    if (ownerName.trim().length < 2) return "Name must be at least 2 characters";
    if (!email.trim()) return "Email is required";
    if (!isValidEmail(email)) return "Enter a valid email address";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/\d/.test(password)) return "Password must contain at least one number";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleNext1 = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleNext2 = async () => {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    try {
      // Create Firebase Auth user & send verification email
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setEmailSent(true);
      setStep(3);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please use a different email or log in.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError("Failed to create account: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
    setVerifying(true);
    setError("");
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setStep(4);
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (err) {
      setError("Could not check verification status. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const resendVerification = async () => {
    setError("");
    try {
      await sendEmailVerification(auth.currentUser);
      setError(""); // Clear error
      setEmailSent(true);
    } catch (err) {
      setError("Could not resend verification email. Please wait a moment and try again.");
    }
  };

  // CSV parsing
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      setCsvError("CSV must have a header row and at least one data row");
      return [];
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const required = ["name", "price", "stock"];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length) {
      setCsvError(`Missing required columns: ${missing.join(", ")}`);
      return [];
    }

    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });

      if (!row.name || !row.price || !row.stock) continue;

      products.push({
        name: row.name,
        price: Number(row.price) || 0,
        stock: Number(row.stock) || 0,
        category: row.category || "",
        sku: row.sku || "",
        description: row.description || "",
        image: row.image || row.imageurl || row.image_url || "",
      });
    }

    if (products.length === 0) {
      setCsvError("No valid product rows found in CSV");
      return [];
    }

    setCsvError("");
    return products;
  };

  // Handle quoted CSV fields
  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = parseCSV(evt.target.result);
      setCsvProducts(parsed);
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csv = `name,price,stock,category,sku,description,image\n"Women Cotton Night Suit",899,50,"Women","WC-001","Comfortable cotton night suit","https://example.com/image1.jpg"\n"Men Casual T-Shirt",499,100,"Men","MC-002","Premium quality cotton t-shirt",""\n"Kids Frock Dress",599,30,"Kids","KG-003","Beautiful party wear frock",""\n"Wireless Earbuds",1299,75,"Electronics","EL-004","Bluetooth 5.0 earbuds",""\n"Organic Face Cream",349,200,"Beauty","BC-005","Natural ingredients face cream",""`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selloship_products_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Upload image URL to Cloudinary
  const uploadImageUrlToCloudinary = async (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith("http")) return "";
    try {
      const formData = new FormData();
      formData.append("file", imageUrl);
      formData.append("upload_preset", "unsigned_upload");
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      return data.secure_url || "";
    } catch (err) {
      console.warn("Cloudinary upload failed for:", imageUrl, err);
      return "";
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // 1. Create store doc → get storeId
      const storeDoc = await addDoc(collection(db, "stores"), {
        storeName,
        storePhone,
        storeEmail: storeEmail || email,
        storeAddress,
        storeCity,
        storeState,
        storePincode,
        gstNumber,
        storeCategory,
        ownerName,
        ownerEmail: email,
        createdAt: serverTimestamp(),
      });
      const storeId = storeDoc.id;

      // 2. Create admin user doc with storeId
      await addDoc(collection(db, "users"), {
        fullname: ownerName,
        email,
        password,
        username: "admin",
        role: "administrator",
        storeId,
        storeName,
        firebaseUid: auth.currentUser?.uid || "",
        createdAt: serverTimestamp(),
      });

      // 3. Bulk import products if any
      if (csvProducts.length > 0) {
        // Upload image URLs to Cloudinary first
        const productsWithCloudinaryImages = await Promise.all(
          csvProducts.map(async (p) => {
            const cloudinaryUrl = p.image ? await uploadImageUrlToCloudinary(p.image) : "";
            return { ...p, cloudinaryImage: cloudinaryUrl };
          })
        );

        const batch = productsWithCloudinaryImages.map(p =>
          addDoc(collection(db, "products"), {
            ...p,
            price: Number(p.price),
            stock: Number(p.stock),
            imageUrl: p.cloudinaryImage || "",
            storeId,
            isActive: true,
            createdAt: serverTimestamp(),
          })
        );
        await Promise.all(batch);

        // Notify staff about bulk upload
        await addDoc(collection(db, "notifications"), {
          type: "product_imported",
          message: `Administrator bulk uploaded ${csvProducts.length} products during store setup`,
          storeId,
          targetRole: "all",
          createdAt: serverTimestamp(),
        });
      }

      // 4. Auto-login with storeId
      localStorage.setItem("adminAuth", JSON.stringify({
        email,
        username: "admin",
        storeId,
        storeName,
        fullname: ownerName,
        loginTime: new Date().toISOString(),
      }));

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a3d73] to-[#0a66c2] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#f8726a]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0a66c2]/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-[#0a66c2] p-6 text-center sticky top-0 z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3">
              {step === 1 ? <Store className="text-white" size={28} /> :
               step === 2 ? <User className="text-white" size={28} /> :
               step === 3 ? <MailCheck className="text-white" size={28} /> :
               <Package className="text-white" size={28} />}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {step === 1 ? "Set Up Your Store" : step === 2 ? "Create Admin Account" : step === 3 ? "Verify Your Email" : "Add Products"}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Step {step} of {totalSteps}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`w-8 h-1.5 rounded-full transition-all ${step >= s ? "bg-white" : "bg-white/30"}`}></div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* STEP 1 — Store Details */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Store Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name *</label>
                  <div className="relative">
                    <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
                      placeholder="My Awesome Store"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                  </div>
                </div>

                {/* Store Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Category *</label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={storeCategory} onChange={e => setStoreCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent appearance-none bg-white">
                      <option value="">Select category</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Grocery & Food">Grocery & Food</option>
                      <option value="Health & Beauty">Health & Beauty</option>
                      <option value="Home & Furniture">Home & Furniture</option>
                      <option value="Sports & Fitness">Sports & Fitness</option>
                      <option value="Books & Stationery">Books & Stationery</option>
                      <option value="Toys & Baby">Toys & Baby</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Phone + Email row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Phone *</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" value={storePhone} onChange={e => setStorePhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                    </div>
                    {storePhone && !isValidPhone(storePhone) && <p className="text-xs text-red-500 mt-1">Enter a valid Indian mobile number</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={storeEmail} onChange={e => setStoreEmail(e.target.value)}
                        placeholder="store@email.com"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                    </div>
                    {storeEmail && !isValidEmail(storeEmail) && <p className="text-xs text-red-500 mt-1">Enter a valid email address</p>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Address</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                    <textarea value={storeAddress} onChange={e => setStoreAddress(e.target.value)}
                      placeholder="Street address, building, landmark"
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent resize-none" />
                  </div>
                </div>

                {/* City, State, Pincode row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <input type="text" value={storeCity} onChange={e => setStoreCity(e.target.value)}
                      placeholder="Mumbai"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                    <input type="text" value={storeState} onChange={e => setStoreState(e.target.value)}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
                    <input type="text" value={storePincode} onChange={e => setStorePincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="400001" maxLength={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                    {storePincode && !isValidPincode(storePincode) && <p className="text-xs text-red-500 mt-1">Must be 6 digits</p>}
                  </div>
                </div>

                {/* GST */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GST Number (Optional)</label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                  </div>
                  {gstNumber && !isValidGST(gstNumber) && <p className="text-xs text-red-500 mt-1">Invalid GST format</p>}
                </div>

                <button onClick={handleNext1}
                  className="w-full py-3 bg-[#0a66c2] text-white rounded-xl font-semibold hover:bg-[#084d94] transition-all flex items-center justify-center gap-2">
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2 — Admin Account */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                  </div>
                  {email && !isValidEmail(email) && <p className="text-xs text-red-500 mt-1">Enter a valid email address</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${password.length >= 6 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>6+ chars</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${/[A-Z]/.test(password) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>Uppercase</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${/\d/.test(password) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>Number</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent" />
                  </div>
                  {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setStep(1); setError(""); }}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button onClick={handleNext2} disabled={loading}
                    className="flex-1 py-3 bg-[#0a66c2] text-white rounded-xl font-semibold hover:bg-[#084d94] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating...</>
                    : <>Continue <ArrowRight size={18} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — Email Verification */}
            {step === 3 && (
              <div className="text-center space-y-5 py-4">
                <div className="w-20 h-20 mx-auto bg-[#0a66c2]/10 rounded-2xl flex items-center justify-center">
                  <MailCheck size={40} className="text-[#0a66c2]" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Inbox</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    We've sent a verification link to<br />
                    <strong className="text-gray-800">{email}</strong>
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800">
                    Click the link in your email to verify your account. We'll <strong>automatically detect</strong> when you've verified.
                  </p>
                </div>

                {/* Auto-checking indicator */}
                <div className="flex items-center justify-center gap-3 py-3">
                  <div className="w-5 h-5 border-2 border-[#0a66c2] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-[#0a66c2] font-medium">Waiting for verification...</span>
                </div>

                <div className="space-y-3">
                  <button onClick={checkVerification} disabled={verifying}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {verifying ? <><div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> Checking...</>
                    : <><ShieldCheck size={18} /> Check Manually</>}
                  </button>

                  <button onClick={resendVerification}
                    className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw size={16} /> Resend Verification Email
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  Didn't receive it? Check your spam folder or try resending.
                </p>
              </div>
            )}

            {/* STEP 4 — Import Products */}
            {step === 4 && (
              <div className="space-y-5">
                {!importMode && (
                  <>
                    <p className="text-center text-gray-600 mb-6">
                      How would you like to start your product catalog?
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setImportMode("csv")}
                        className="p-6 border-2 border-gray-200 rounded-2xl hover:border-[#0a66c2] hover:bg-blue-50 transition-all text-center group">
                        <Upload size={32} className="mx-auto text-gray-400 group-hover:text-[#0a66c2] mb-3 transition-colors" />
                        <p className="font-semibold text-gray-900">Import CSV</p>
                        <p className="text-xs text-gray-500 mt-1">Upload products from a spreadsheet</p>
                      </button>
                      <button onClick={() => setImportMode("skip")}
                        className="p-6 border-2 border-gray-200 rounded-2xl hover:border-[#f8726a] hover:bg-orange-50 transition-all text-center group">
                        <ShoppingBag size={32} className="mx-auto text-gray-400 group-hover:text-[#f8726a] mb-3 transition-colors" />
                        <p className="font-semibold text-gray-900">Start Fresh</p>
                        <p className="text-xs text-gray-500 mt-1">Add products manually later</p>
                      </button>
                    </div>
                  </>
                )}

                {importMode === "csv" && (
                  <>
                    {/* Download sample */}
                    <button onClick={downloadSampleCSV}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-[#0a66c2] text-[#0a66c2] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                      <Download size={16} /> Download Sample CSV
                    </button>

                    {/* CSV format info */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">CSV columns:</p>
                      <div className="flex flex-wrap gap-2">
                        {["name*", "price*", "stock*", "category", "sku", "description", "image"].map(col => (
                          <span key={col} className={`text-xs px-2 py-1 rounded-full font-medium ${
                            col.includes("*") ? "bg-[#0a66c2]/10 text-[#0a66c2]" : "bg-gray-200 text-gray-600"
                          }`}>{col.replace("*", " (required)")}</span>
                        ))}
                      </div>
                    </div>

                    {/* Upload area */}
                    <div>
                      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                      <button onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                          csvProducts.length > 0 ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-[#0a66c2] hover:bg-gray-50"
                        }`}>
                        {csvProducts.length > 0 ? (
                          <>
                            <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                            <p className="font-semibold text-green-700">{csvFileName}</p>
                            <p className="text-sm text-green-600 mt-1">{csvProducts.length} products ready to import</p>
                            <p className="text-xs text-gray-500 mt-2">Click to change file</p>
                          </>
                        ) : (
                          <>
                            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="font-medium text-gray-700">Click to upload CSV file</p>
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
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Table size={14} /> Preview ({csvProducts.length} products)
                          </p>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-left px-3 py-2 text-gray-600 font-medium">Name</th>
                                <th className="text-right px-3 py-2 text-gray-600 font-medium">Price</th>
                                <th className="text-right px-3 py-2 text-gray-600 font-medium">Stock</th>
                                <th className="text-left px-3 py-2 text-gray-600 font-medium">Image</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvProducts.slice(0, 10).map((p, i) => (
                                <tr key={i} className="border-t border-gray-100">
                                  <td className="px-3 py-2 text-gray-900 truncate max-w-[150px]">{p.name}</td>
                                  <td className="px-3 py-2 text-gray-900 text-right">₹{p.price}</td>
                                  <td className="px-3 py-2 text-gray-900 text-right">{p.stock}</td>
                                  <td className="px-3 py-2">{p.image ? <img src={p.image} alt="" className="w-7 h-7 rounded object-cover" onError={(e) => { e.target.style.display='none'; }} /> : <span className="text-gray-400">—</span>}</td>
                                </tr>
                              ))}
                              {csvProducts.length > 10 && (
                                <tr className="border-t border-gray-100">
                                  <td colSpan={4} className="px-3 py-2 text-center text-gray-400 text-xs">
                                    ...and {csvProducts.length - 10} more products
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => { setImportMode(null); setCsvProducts([]); setCsvFileName(""); setCsvError(""); }}
                        className="px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <ArrowLeft size={18} /> Back
                      </button>
                      <button onClick={handleSubmit} disabled={loading || csvProducts.length === 0}
                        className="flex-1 py-3 bg-[#f8726a] text-white rounded-xl font-semibold hover:bg-[#e5625a] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? (
                          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Importing...</>
                        ) : (
                          <><CheckCircle size={18} /> Import & Launch Store</>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {importMode === "skip" && (
                  <div className="text-center space-y-5">
                    <div className="w-20 h-20 mx-auto bg-[#f8726a]/10 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={36} className="text-[#f8726a]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Start with an Empty Store</h3>
                      <p className="text-gray-500 text-sm">You can add products manually from your Admin Dashboard once your store is ready.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setImportMode(null)}
                        className="px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <ArrowLeft size={18} /> Back
                      </button>
                      <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 py-3 bg-[#f8726a] text-white rounded-xl font-semibold hover:bg-[#e5625a] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? (
                          <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating...</>
                        ) : (
                          <><CheckCircle size={18} /> Launch Store</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Back to step 3 (only when no import mode selected) */}
                {!importMode && (
                  <button onClick={() => { setStep(3); setError(""); }}
                    className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mt-2">
                    <ArrowLeft size={18} /> Back to Verification
                  </button>
                )}
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link to="/admin/login" className="text-[#0a66c2] font-medium hover:underline">Admin Login</Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-white/60 text-sm hover:text-white transition-colors">← Back to Selloship</Link>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Package } from "lucide-react";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => { document.title = "Staff Login — Selloship"; }, []);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("username", "==", "staff")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid staff credentials");
        setLoading(false);
        return;
      }

      const staffDoc = querySnapshot.docs[0];
      const staffData = staffDoc.data();

      if (staffData.password !== password) {
        setError("Invalid staff credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("staffAuth", JSON.stringify({
        id: staffDoc.id,
        email: staffData.email,
        username: staffData.username,
        storeId: staffData.storeId || "",
        storeName: staffData.storeName || "",
        fullname: staffData.fullname || "",
        loginTime: new Date().toISOString()
      }));

      navigate("/staff/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a3d73] to-[#0a66c2] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#f8726a]/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0a66c2]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f8726a] rounded-2xl mb-4 shadow-lg shadow-[#f8726a]/30">
              <Package className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Staff Login</h1>
            <p className="text-gray-500">Selloship Inventory Staff Portal</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@selloship.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-400 hover:text-gray-600" size={20} />
                  ) : (
                    <Eye className="text-gray-400 hover:text-gray-600" size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#f8726a] text-white rounded-xl font-semibold hover:bg-[#e5625a] transition-all shadow-lg shadow-[#f8726a]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <a href="/staff/forgot-password" className="text-sm text-[#f8726a] hover:underline font-medium block">
              Forgot Password?
            </a>
            <a href="/" className="text-sm text-[#0a66c2] hover:underline font-medium block">
              ← Back to Selloship
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

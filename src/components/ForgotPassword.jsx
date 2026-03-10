import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Shield, KeyRound } from "lucide-react";

export default function ForgotPassword({ role = "staff" }) {
  const [step, setStep] = useState(1); // 1: enter email, 2: enter OTP, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpDocId, setOtpDocId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userDocId, setUserDocId] = useState("");
  const navigate = useNavigate();

  const loginPath = role === "delivery" ? "/delivery/login" : "/staff/login";
  const roleName = role === "delivery" ? "Delivery Staff" : "Inventory Staff";
  const username = role === "delivery" ? "delivery" : "staff";
  const accentColor = role === "delivery" ? "#0a66c2" : "#f8726a";

  // Step 1: Verify email and send OTP
  const handleSendOtp = async () => {
    setError("");
    if (!email.trim()) return setError("Email is required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email");

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email), where("username", "==", username));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No account found with this email");
        setLoading(false);
        return;
      }

      setUserDocId(snapshot.docs[0].id);

      // Generate 6-digit OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);

      // Store OTP in Firestore with 5-min expiry
      const otpDoc = await addDoc(collection(db, "otps"), {
        email,
        code,
        role: username,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        used: false,
      });
      setOtpDocId(otpDoc.id);

      // Show OTP in alert (for testing — replace with real email/SMS in production)
      alert(`Your OTP is: ${code}\n\n(In production, this would be sent to your email/phone)`);

      setSuccess("OTP sent! Check your email/phone.");
      setStep(2);
    } catch (err) {
      console.error("OTP error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError("");
    if (!otp.trim()) return setError("Please enter the OTP");
    if (otp.length !== 6) return setError("OTP must be 6 digits");

    if (otp !== generatedOtp) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    // Mark OTP as used
    try {
      await updateDoc(doc(db, "otps", otpDocId), { used: true });
    } catch (e) {}

    setSuccess("OTP verified successfully!");
    setStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    setError("");
    if (!newPassword) return setError("Password is required");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userDocId), { password: newPassword });

      // Also update staff collection
      const staffQ = query(collection(db, "staff"), where("email", "==", email));
      const staffSnap = await getDocs(staffQ);
      if (!staffSnap.empty) {
        await updateDoc(doc(db, "staff", staffSnap.docs[0].id), { password: newPassword });
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate(loginPath), 2000);
    } catch (err) {
      console.error("Reset error:", err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a3d73] to-[#0a66c2] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#f8726a]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0a66c2]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px ${accentColor}40` }}
            >
              {step === 1 ? <Mail className="text-white" size={32} /> :
               step === 2 ? <KeyRound className="text-white" size={32} /> :
               <Shield className="text-white" size={32} />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {step === 1 ? "Forgot Password?" : step === 2 ? "Verify OTP" : "New Password"}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === 1 ? `Enter your ${roleName} email to get an OTP` :
               step === 2 ? "Enter the 6-digit OTP sent to your email" :
               "Set your new password"}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`w-8 h-1.5 rounded-full transition-all ${step >= s ? "bg-[#0a66c2]" : "bg-gray-200"}`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && !error && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-3 bg-[#0a66c2] text-white rounded-xl font-semibold hover:bg-[#084d94] transition-all shadow-lg shadow-[#0a66c2]/30 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : "Send OTP"}
              </button>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit OTP</label>
                <div className="relative">
                  <KeyRound size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">OTP expires in 5 minutes</p>
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-3 bg-[#0a66c2] text-white rounded-xl font-semibold hover:bg-[#084d94] transition-all shadow-lg shadow-[#0a66c2]/30 disabled:opacity-50"
              >
                Verify OTP
              </button>
              <button
                onClick={() => { setStep(1); setOtp(""); setError(""); setSuccess(""); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Didn't receive? Resend OTP
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3 bg-[#f8726a] text-white rounded-xl font-semibold hover:bg-[#e5625a] transition-all shadow-lg shadow-[#f8726a]/30 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : "Reset Password"}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to={loginPath} className="text-sm text-[#0a66c2] hover:underline font-medium flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

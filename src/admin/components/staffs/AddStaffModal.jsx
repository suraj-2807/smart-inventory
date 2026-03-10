import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId, getStoreName } from "@/services/storeHelper";
import { X, User, Mail, Phone, Briefcase, Building2, Calendar, Check, Upload, Camera, Lock, Eye, EyeOff } from "lucide-react";

export default function AddStaffModal({
  onClose,
  onSuccess,
  staff = null,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [salary, setSalary] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Prefill data when editing
  useEffect(() => {
    if (staff) {
      setName(staff.name || "");
      setEmail(staff.email || "");
      setPhone(staff.phone || "");
      setRole(staff.role || "");
      setDepartment(staff.department || "");
      setHireDate(staff.hireDate || "");
      setSalary(staff.salary || "");
      setUsername(staff.username || "");
      setImagePreview(staff.profileImageUrl || "");
      // Don't prefill password for security reasons
    }
  }, [staff]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setUploadSuccess(false);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async () => {
    if (!profileImage) return staff?.profileImageUrl || "";

    setUploading(true);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("file", profileImage);
    formData.append("upload_preset", "product_upload");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      setUploading(false);
      setUploadSuccess(true);
      return data.secure_url;
    } catch (error) {
      setUploading(false);
      alert("Error uploading image: " + error.message);
      return staff?.profileImageUrl || "";
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !phone || !role || !department || !username) {
      return alert("Please fill all required fields");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return alert("Please enter a valid email address");
    }

    // Password validation (only for new staff)
    if (!staff && !password) {
      return alert("Password is required for new staff members");
    }

    if (password && password.length < 6) {
      return alert("Password must be at least 6 characters long");
    }

    setLoading(true);

    const profileImageUrl = await uploadImageToCloudinary();

    // Determine the login username based on role
    const loginUsername = role === "Delivery Staff" ? "delivery" : "staff";

    try {
      if (staff) {
        // UPDATE staff doc
        const updateData = {
          name,
          email,
          phone,
          role,
          department,
          hireDate,
          salary: salary ? Number(salary) : 0,
          profileImageUrl,
          username,
          updatedAt: serverTimestamp(),
        };
        
        if (password) {
          updateData.password = password;
        }

        await updateDoc(doc(db, "staff", staff.id), updateData);

        // Update corresponding users doc if password changed
        if (password) {
          const usersQuery = query(
            collection(db, "users"),
            where("email", "==", email)
          );
          const usersSnap = await getDocs(usersQuery);
          if (!usersSnap.empty) {
            const userDoc = usersSnap.docs[0];
            await updateDoc(doc(db, "users", userDoc.id), {
              password,
              username: loginUsername,
              fullname: name,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } else {
        // ADD staff doc
        const storeId = getStoreId();
        await addDoc(collection(db, "staff"), {
          name,
          email,
          phone,
          role,
          department,
          hireDate,
          salary: salary ? Number(salary) : 0,
          profileImageUrl,
          username,
          password,
          status: "Active",
          storeId: storeId || "",
          createdAt: serverTimestamp(),
        });

        // Also create a users doc so the staff member can log in
        await addDoc(collection(db, "users"), {
          fullname: name,
          email,
          password,
          username: loginUsername,
          role: role,
          storeId: storeId || "",
          storeName: getStoreName() || "",
          createdAt: serverTimestamp(),
        });

        // Create notification for all roles
        await addDoc(collection(db, "notifications"), {
          type: "staff_added",
          message: `New ${role} added: ${name}`,
          storeId: storeId || "",
          targetRole: "all",
          createdAt: serverTimestamp(),
        });
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (error) {
      setLoading(false);
      alert("Error saving staff member: " + error.message);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview("");
    setUploadSuccess(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#0a66c2] p-6 text-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <h2 className="text-2xl font-bold">
                {staff ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
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
          {/* Profile Image Upload */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Camera size={16} />
              Profile Picture
            </h3>
            
            <div className="flex items-center gap-6">
              {/* Image Preview */}
              <div className="relative">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#0a66c2] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {name ? name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <label
                  htmlFor="profile-image"
                  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-[#0a66c2] text-[#0a66c2] rounded-lg font-medium hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Upload size={18} />
                  {imagePreview ? "Change Photo" : "Upload Photo"}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
                
                {uploading && (
                  <div className="mt-2 flex items-center gap-2 text-[#0a66c2]">
                    <div className="w-4 h-4 border-2 border-[#0a66c2] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Uploading...</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <Check size={16} />
                    <span className="text-sm font-medium">Image uploaded!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <User size={16} />
              Personal Information
            </h3>
            
            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={18} />
                </div>
                <input
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                  placeholder="Enter full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email and Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    placeholder="(123) 456-7890"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Lock size={16} />
              Login Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    placeholder="Enter username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {staff ? "(Optional)" : "*"}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-gray-300 pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    placeholder={staff ? "Leave blank to keep current" : "Enter password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!staff && (
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 characters
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <Briefcase size={16} />
              Employment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Role *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Briefcase size={18} />
                  </div>
                  <select
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all appearance-none bg-white"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="">Select Role</option>
                    <option value="Inventory Staff">Inventory Staff</option>
                    <option value="Delivery Staff">Delivery Staff</option>
                  </select>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Building2 size={18} />
                  </div>
                  <select
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all appearance-none bg-white"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hire Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hire Date
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    value={hireDate}
                    onChange={e => setHireDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ₹
                  </div>
                  <input
                    type="number"
                    className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all"
                    placeholder="0.00"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          {(name || email || role || department) && (
            <div className="mb-6 p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Check size={16} className="text-[#0a66c2]" />
                Preview
              </p>
              <div className="space-y-2">
                {name && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-600 w-24">Name:</span>
                    <span className="text-gray-900">{name}</span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-600 w-24">Email:</span>
                    <span className="text-gray-900">{email}</span>
                  </div>
                )}
                {username && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-600 w-24">Username:</span>
                    <span className="text-gray-900">{username}</span>
                  </div>
                )}
                {role && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-600 w-24">Role:</span>
                    <span className="text-gray-900">{role}</span>
                  </div>
                )}
                {department && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-600 w-24">Department:</span>
                    <span className="text-gray-900">{department}</span>
                  </div>
                )}
              </div>
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
            disabled={loading || uploading}
            className="px-6 py-2.5 bg-[#0a66c2] text-white rounded-lg font-medium hover:bg-[#084d94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Check size={18} />
                {staff ? "Update Staff" : "Add Staff"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
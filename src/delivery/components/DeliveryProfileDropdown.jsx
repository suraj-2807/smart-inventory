import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { User, Settings, Moon, Sun, LogOut, Edit } from "lucide-react";

export default function DeliveryProfileDropdown() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    avatar: null,
  });

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }

    loadProfileFromAuth();
  }, []);

  const loadProfileFromAuth = async () => {
    try {
      const authStr = localStorage.getItem("deliveryAuth");
      if (!authStr) return;

      const auth = JSON.parse(authStr);

      // Set initial profile from login data
      setProfile({
        name: auth.fullname || "Delivery Staff",
        email: auth.email || "",
        role: "Delivery Partner",
        avatar: null,
      });

      // Fetch full staff details from Firestore for profileImageUrl & role
      if (auth.email) {
        const staffQuery = query(
          collection(db, "staff"),
          where("email", "==", auth.email)
        );
        const staffSnap = await getDocs(staffQuery);
        if (!staffSnap.empty) {
          const staffData = staffSnap.docs[0].data();
          setProfile(prev => ({
            ...prev,
            name: staffData.name || prev.name,
            role: staffData.role || prev.role,
            avatar: staffData.profileImageUrl || null,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("deliveryAuth");
      window.location.href = "/delivery/login";
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const authStr = localStorage.getItem("deliveryAuth");
      if (authStr) {
        const auth = JSON.parse(authStr);
        if (auth.email) {
          const staffQuery = query(
            collection(db, "staff"),
            where("email", "==", auth.email)
          );
          const staffSnap = await getDocs(staffQuery);
          if (!staffSnap.empty) {
            await updateDoc(doc(db, "staff", staffSnap.docs[0].id), {
              name: profile.name,
            });
          }

          const usersQuery = query(
            collection(db, "users"),
            where("email", "==", auth.email)
          );
          const usersSnap = await getDocs(usersQuery);
          if (!usersSnap.empty) {
            await updateDoc(doc(db, "users", usersSnap.docs[0].id), {
              fullname: profile.name,
            });
          }

          auth.fullname = profile.name;
          localStorage.setItem("deliveryAuth", JSON.stringify(auth));
        }
      }
      setShowProfileEdit(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "product_upload");

      try {
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dchjlxn8m/image/upload",
          { method: "POST", body: formData }
        );
        const data = await res.json();
        const imageUrl = data.secure_url;

        setProfile({ ...profile, avatar: imageUrl });

        const authStr = localStorage.getItem("deliveryAuth");
        if (authStr) {
          const auth = JSON.parse(authStr);
          if (auth.email) {
            const staffQuery = query(
              collection(db, "staff"),
              where("email", "==", auth.email)
            );
            const staffSnap = await getDocs(staffQuery);
            if (!staffSnap.empty) {
              await updateDoc(doc(db, "staff", staffSnap.docs[0].id), {
                profileImageUrl: imageUrl,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error uploading avatar:", error);
        alert("Error uploading photo. Please try again.");
      }
    }
  };

  const getInitials = () => {
    return profile.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "D";
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
        >
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {profile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {profile.role}
            </p>
          </div>
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
              {getInitials()}
            </div>
          )}
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-14 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-40 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-center gap-3">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                      {getInitials()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {profile.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {profile.role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setShowProfileEdit(true);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Edit size={18} />
                  <span className="font-medium">Edit Profile</span>
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span className="font-medium">
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </span>
                  <div
                    className={`ml-auto w-10 h-6 rounded-full transition-colors ${
                      darkMode ? "bg-emerald-600" : "bg-gray-300"
                    } relative`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        darkMode ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                </button>

                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showProfileEdit && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileEdit(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Edit Profile
              </h3>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                      {getInitials()}
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-block">
                      Change Photo
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProfileEdit(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStoreId } from "@/services/storeHelper";
import AdminLayout from "../layouts/AdminLayout";
import AddStaffModal from "../components/staffs/AddStaffModal";
import { Mail, Phone, MoreVertical, UserPlus, Filter } from "lucide-react";

export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const storeId = getStoreId();
    let q;
    if (storeId) {
      q = query(collection(db, "staff"), where("storeId", "==", storeId));
    } else {
      q = collection(db, "staff");
    }
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setStaff(data);
  };

  const deleteStaff = async (id) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      await deleteDoc(doc(db, "staff", id));
      fetchStaff();
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setShowAddModal(true);
    setOpenMenuId(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingStaff(null);
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";
  };

  const getAvatarColor = (index) => {
    const colors = [
      "from-[#0a66c2] to-[#f8726a]",
      "from-pink-500 to-rose-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-amber-500",
      "from-[#0a66c2] to-[#084d94]",
      "from-cyan-500 to-blue-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <AdminLayout title="Staff Management">
      {/* Header with Filters */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            <span className="text-[#0a66c2]">{staff.length}</span> Employee{staff.length !== 1 ? 's' : ''}
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-[#0a66c2] hover:text-[#0a66c2] transition-colors dark:bg-gray-800 dark:border-gray-500 dark:text-gray-200">
            <Filter size={18} />
            Filter
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#0a66c2] text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-shadow dark:text-gray-200"
        >
          <UserPlus size={18} />
          Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member, idx) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-600"
          >
            {/* Card Content */}
            <div className="p-6">
              {/* Avatar and Menu */}
              <div className="flex items-start justify-between mb-4">
                {/* Avatar */}
                {member.profileImageUrl ? (
                  <img
                    src={member.profileImageUrl}
                    alt={member.name}
                    className="w-18 h-18 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-18 h-18 rounded-full bg-gradient-to-br ${getAvatarColor(idx)} flex items-center justify-center text-white font-bold text-xl`}>
                    {getInitials(member.name)}
                  </div>
                )}

                {/* Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === member.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <button
                          onClick={() => handleEdit(member)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            deleteStaff(member.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Name and Role */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-gray-200">
                  {member.name || "Unknown Name"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {member.role || "No Role"}
                </p>
              </div>

              {/* Department and Hire Date */}
              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1 dark:text-gray-200">Department</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                    {member.department || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 text-right dark:text-gray-200">Hired Date</p>
                  <p className="text-sm font-semibold text-gray-900 text-right dark:text-gray-200">
                    {member.hireDate || "N/A"}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                  <Mail size={16} className="text-gray-400 flex-shrink-0 dark:text-gray-200" />
                  <span className="truncate">{member.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                  <Phone size={16} className="text-gray-400 flex-shrink-0 dark:text-gray-200" />
                  <span>{member.phone || "No phone"}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {staff.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-[#0a66c2] rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
            <UserPlus size={40} />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Staff Members Yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first staff member</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0a66c2] text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-shadow inline-flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add First Staff Member
          </button>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          onClose={handleCloseModal}
          onSuccess={fetchStaff}
          staff={editingStaff}
        />
      )}
    </AdminLayout>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useRole from "../hooks/useRole";
import { useTheme } from "../context/ThemeContext";

import {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
  createUser, // NOTE: add this to userService.js — creates an account directly
             // (e.g. via a Firebase Admin/Cloud Function or backend endpoint)
             // so it doesn't sign the admin out the way client-side
             // registration would. Signature: createUser({ email, password, role })
} from "../services/userService";

import {
  ArrowLeft,
  Search,
  KeyRound,
  ShieldCheck,
  UserCircle2,
  Ban,
  CheckCircle2,
  Trash2,
  Users as UsersIcon,
  UserPlus,
  X,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Users() {
  const navigate = useNavigate();
  const role = useRole();
  const { darkMode } = useTheme();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // --- Add User modal state ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRoleValue) => {
    setBusyId(id);
    try {
      await updateUserRole(id, newRoleValue);
      await loadUsers();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (user) => {
    setBusyId(user.id);
    try {
      await toggleUserStatus(user.id, !user.disabled);
      await loadUsers();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this user? This can't be undone.");
    if (!ok) return;

    setBusyId(id);
    try {
      await deleteUser(id);
      await loadUsers();
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (email) => {
    const ok = window.confirm(`Send password reset email to ${email}?`);
    if (!ok) return;

    try {
      await resetUserPassword(email);
      alert("Password reset email sent!");
    } catch (error) {
      console.error(error);
      alert("Failed to send reset email");
    }
  };

  // --- Add User handlers ---
  const resetAddForm = () => {
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    setShowNewPassword(false);
    setFormError("");
  };

  const openAddModal = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (creating) return;
    setShowAddModal(false);
    resetAddForm();
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    setNewPassword(pwd);
    setShowNewPassword(true);
  };

  const handleCreateUser = async () => {
    const cleanEmail = newEmail.trim();

    if (!cleanEmail || !newPassword) {
      setFormError("Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setFormError("");
    setCreating(true);
    try {
      await createUser({
        email: cleanEmail,
        password: newPassword,
        role: newRole,
      });
      await loadUsers();
      setShowAddModal(false);
      resetAddForm();
      alert("Account created successfully!");
    } catch (err) {
      setFormError(err.message || "Failed to create account.");
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        (u?.email || "").toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const active = users.filter((u) => !u.disabled).length;
    const disabled = total - active;
    return { total, admins, active, disabled };
  }, [users]);

  const initials = (email) => (email ? email.slice(0, 2).toUpperCase() : "??");

  if (role !== "admin") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-500">Access denied</h1>
          <p className="text-sm opacity-60 mt-1">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const card = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100";
  const subtle = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBase = darkMode
    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500"
    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-indigo-500";

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 ${
        darkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100 shadow-sm border border-gray-200"
            }`}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              User Management
            </h1>
            <p className={`text-sm mt-0.5 ${subtle}`}>
              Manage accounts, roles, and access across your workspace
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition"
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total users", value: stats.total, icon: UsersIcon, tint: "text-indigo-500 bg-indigo-500/10" },
          { label: "Admins", value: stats.admins, icon: ShieldCheck, tint: "text-purple-500 bg-purple-500/10" },
          { label: "Active", value: stats.active, icon: CheckCircle2, tint: "text-green-500 bg-green-500/10" },
          { label: "Disabled", value: stats.disabled, icon: Ban, tint: "text-red-500 bg-red-500/10" },
        ].map(({ label, value, icon: Icon, tint }) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 flex items-center gap-3 ${card}`}
          >
            <div className={`p-2 rounded-xl ${tint}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{value}</p>
              <p className={`text-xs mt-1 ${subtle}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div className={`rounded-2xl border p-4 mb-6 ${card}`}>
        <div className="relative">
          <Search
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtle}`}
          />
          <input
            className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${inputBase}`}
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LIST */}
      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        {/* TABLE HEADER (desktop only) */}
        <div
          className={`hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide ${
            darkMode ? "bg-gray-800/60 text-gray-400" : "bg-gray-50 text-gray-500"
          }`}
        >
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Password</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className={`p-10 text-center text-sm ${subtle}`}>
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <UserCircle2 size={32} className={`mx-auto mb-2 ${subtle}`} />
            <p className="font-medium">No users found</p>
            <p className={`text-sm mt-1 ${subtle}`}>
              {search ? "Try a different search term." : "Add your first user to get started."}
            </p>
            {!search && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <UserPlus size={15} />
                Add User
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map((user, index) => {
            const isBusy = busyId === user.id;
            return (
              <div
                key={user.id || index}
                className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1.5fr] gap-4 items-center px-5 py-4 border-t transition ${
                  darkMode
                    ? "border-gray-800 hover:bg-gray-800/40"
                    : "border-gray-100 hover:bg-gray-50"
                } ${isBusy ? "opacity-60 pointer-events-none" : ""}`}
              >
                {/* USER */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {initials(user.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {user.email || "No email"}
                    </p>
                    <p className={`text-xs ${subtle}`}>
                      ID: {(user.id || "unknown").slice(0, 6)}...
                    </p>
                  </div>
                </div>

                {/* ROLE */}
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-purple-500/10 text-purple-500"
                        : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {user.role || "user"}
                  </span>
                </div>

                {/* STATUS */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.disabled
                        ? "bg-red-500/10 text-red-500"
                        : "bg-green-500/10 text-green-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.disabled ? "bg-red-500" : "bg-green-500"
                      }`}
                    />
                    {user.disabled ? "Disabled" : "Active"}
                  </span>
                </div>

                {/* RESET PASSWORD */}
                <div>
                  <button
                    onClick={() => handleResetPassword(user.email)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition"
                  >
                    <KeyRound size={13} />
                    Reset
                  </button>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap md:justify-end gap-2">
                  <select
                    value={user.role || "user"}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition ${
                      user.disabled
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {user.disabled ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <Ban size={13} />
                    )}
                    {user.disabled ? "Enable" : "Disable"}
                  </button>

                  <button
                    onClick={() => handleDelete(user.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-800 hover:bg-gray-900"
                    }`}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeAddModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border shadow-2xl ${card}`}
          >
            {/* Modal header */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                darkMode ? "border-gray-800" : "border-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 className="font-semibold leading-none">Add User</h2>
                  <p className={`text-xs mt-1 ${subtle}`}>
                    Create an account on behalf of a user
                  </p>
                </div>
              </div>
              <button
                onClick={closeAddModal}
                className={`p-1.5 rounded-lg transition ${
                  darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${subtle}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${inputBase}`}
                />
              </div>

              <div>
                <label className={`text-xs font-medium mb-1.5 block ${subtle}`}>
                  Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter or generate a password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full border rounded-lg pl-3 pr-20 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${inputBase}`}
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`p-1.5 rounded-md transition ${
                        darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      title="Generate password"
                      className={`p-1.5 rounded-md transition ${
                        darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                      }`}
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <p className={`text-[11px] mt-1.5 ${subtle}`}>
                  At least 6 characters. Share this with the user securely.
                </p>
              </div>

              <div>
                <label className={`text-xs font-medium mb-1.5 block ${subtle}`}>
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["user", "admin"].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setNewRole(r)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium capitalize transition ${
                        newRole === r
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : darkMode
                          ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {r === "admin" && <ShieldCheck size={13} />}
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="rounded-lg px-3 py-2 text-xs font-medium bg-red-500/10 text-red-500">
                  {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div
              className={`flex items-center justify-end gap-2 px-6 py-4 border-t ${
                darkMode ? "border-gray-800" : "border-gray-100"
              }`}
            >
              <button
                onClick={closeAddModal}
                disabled={creating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
                  creating
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {creating && (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {creating ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
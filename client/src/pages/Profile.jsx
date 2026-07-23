import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import useRole from "../hooks/useRole";

import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";

import {
  ArrowLeft,
  Mail,
  Fingerprint,
  ShieldCheck,
  Ticket,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
} from "lucide-react";

export default function Profile() {
  const { darkMode } = useTheme();
  const role = useRole();
  const navigate = useNavigate();

  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const card = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100";
  const subtle = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBase = darkMode
    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:ring-indigo-500"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-indigo-500";

  const initials = (email) => (email ? email.slice(0, 2).toUpperCase() : "??");

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
  };

  const handleChangePassword = async () => {
    setFormError("");
    setFormSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setFormError("New password must be different from your current password.");
      return;
    }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setFormSuccess("Password updated successfully.");
      resetPasswordForm();
    } catch (err) {
      console.error("Change password error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setFormError("Your current password is incorrect.");
      } else if (err.code === "auth/too-many-requests") {
        setFormError("Too many attempts. Please try again later.");
      } else {
        setFormError(err.message || "Failed to update password.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div
      className={`min-h-screen px-6 py-10 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-2xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-50 shadow-sm border border-gray-200"
            }`}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
            <p className={`text-sm ${subtle}`}>Account information & security</p>
          </div>
        </div>

        {/* IDENTITY CARD */}
        <div className={`p-6 rounded-2xl shadow-sm border ${card}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white text-xl font-semibold flex items-center justify-center shrink-0">
              {initials(user?.email)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg truncate">{user?.email}</p>
              <span
                className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  role === "admin"
                    ? "bg-purple-500/10 text-purple-500"
                    : "bg-blue-500/10 text-blue-500"
                }`}
              >
                <ShieldCheck size={12} />
                {role || "user"}
              </span>
            </div>
          </div>

          <div className={`mt-5 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 ${
            darkMode ? "border-gray-700" : "border-gray-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <Mail size={16} className={subtle} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs ${subtle}`}>Email</p>
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                <Fingerprint size={16} className={subtle} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs ${subtle}`}>User ID</p>
                <p className="text-xs font-mono truncate">{user?.uid}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CHANGE PASSWORD */}
        <div className={`p-6 rounded-2xl shadow-sm border ${card}`}>
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={16} className={subtle} />
            <h2 className="font-semibold">Change Password</h2>
          </div>
          <p className={`text-xs mb-5 ${subtle}`}>
            Update the password on your account. You'll need your current password to confirm.
          </p>

          <div className="space-y-4">
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${subtle}`}>
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 transition ${inputBase}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${subtle}`}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${subtle}`}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 transition ${inputBase}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${subtle}`}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`text-xs font-medium mb-1.5 block ${subtle}`}>
                  Confirm New Password
                </label>
                <input
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${inputBase}`}
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-lg px-3 py-2 text-xs font-medium bg-red-500/10 text-red-500">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-green-500/10 text-green-500">
                <CheckCircle2 size={14} />
                {formSuccess}
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition ${
                saving
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {saving && (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        {/* MY TICKETS */}
        <div className={`p-6 rounded-2xl shadow-sm border ${card}`}>
          <div className="flex items-center gap-2 mb-3">
            <Ticket size={16} className={subtle} />
            <h2 className="font-semibold">My Tickets</h2>
          </div>

          <button
            onClick={() => navigate("/tickets")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
          >
            View My Tickets
          </button>
        </div>

        {/* SESSION */}


      </div>
    </div>
  );
}
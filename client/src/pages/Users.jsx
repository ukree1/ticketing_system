import { useEffect, useState } from "react"
import useRole from "../hooks/useRole"

import {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser
} from "../services/userService"

export default function User() {
  const role = useRole()

  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const data = await getUsers()
    setUsers(data)
  }

  const handleRoleChange = async (id, newRole) => {
    await updateUserRole(id, newRole)
    loadUsers()
  }

  const handleToggleStatus = async (user) => {
    await toggleUserStatus(user.id, !user.disabled)
    loadUsers()
  }

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this user?")
    if (!ok) return

    await deleteUser(id)
    loadUsers()
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">
            Access denied
          </h1>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          User Management
        </h1>
        <p className="text-gray-500">
          Manage system users, roles, and access control
        </p>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <input
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search user by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="grid grid-cols-4 bg-gray-100 p-4 text-sm font-semibold text-gray-600">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* EMPTY STATE */}
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-gray-500">
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-4 items-center p-4 border-b hover:bg-gray-50 transition"
            >

              {/* USER INFO */}
              <div>
                <p className="font-semibold text-gray-800">
                  {user.email}
                </p>
                <p className="text-xs text-gray-400">
                  ID: {user.id.slice(0, 6)}...
                </p>
              </div>

              {/* ROLE */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {user.role || "user"}
                </span>
              </div>

              {/* STATUS */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.disabled
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {user.disabled ? "Disabled" : "Active"}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2">

                <select
                  value={user.role || "user"}
                  onChange={(e) =>
                    handleRoleChange(user.id, e.target.value)
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>

                <button
                  onClick={() => handleToggleStatus(user)}
                  className={`px-3 py-1 rounded-lg text-sm text-white transition ${
                    user.disabled
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {user.disabled ? "Enable" : "Disable"}
                </button>

                <button
                  onClick={() => handleDelete(user.id)}
                  className="px-3 py-1 rounded-lg text-sm bg-gray-800 text-white hover:bg-gray-900 transition"
                >
                  Delete
                </button>

              </div>

            </div>
          ))
        )}

      </div>
    </div>
  )
}
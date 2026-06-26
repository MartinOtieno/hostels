"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: "admin" | "staff" | "guest";
  status?: "active" | "suspended";
  photo?: string;
  createdAt?: string;
}

type DrawerMode = "edit" | "add" | null;

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  staff: "bg-blue-100 text-blue-700",
  guest: "bg-slate-100 text-slate-600",
};

const DEFAULT_FORM: Omit<User, "_id" | "createdAt"> = {
  name: "",
  email: "",
  phone: "",
  role: "guest",
  status: "active",
  photo: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [formData, setFormData] = useState<Omit<User, "_id" | "createdAt">>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { filterUsers(); }, [search, roleFilter, users]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data?.data || []);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let temp = [...users];
    if (search) {
      temp = temp.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (roleFilter !== "all") temp = temp.filter((u) => u.role === roleFilter);
    setFilteredUsers(temp);
  }

  function openAdd() {
    setFormData(DEFAULT_FORM);
    setPhotoPreview(null);
    setEditingId(null);
    setDrawerMode("add");
  }

  function openEdit(user: User) {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role || "guest",
      status: user.status || "active",
      photo: user.photo || "",
    });
    setPhotoPreview(user.photo || null);
    setEditingId(user._id);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingId(null);
    setPhotoPreview(null);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      setFormData((f) => ({ ...f, photo: result }));
    };
    reader.readAsDataURL(file);
  }

  async function saveUser() {
    if (!formData.name || !formData.email) {
      showToast("Name and email are required", "error");
      return;
    }
    setSaving(true);
    try {
      if (drawerMode === "add") {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        showToast("User added successfully");
      } else if (drawerMode === "edit" && editingId) {
        await fetch(`/api/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        showToast("User updated successfully");
      }
      closeDrawer();
      fetchUsers();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: string) {
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      showToast("User deleted");
      fetchUsers();
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function toggleStatus(user: User) {
    const newStatus = user.status === "active" ? "suspended" : "active";
    try {
      await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`Account ${newStatus === "active" ? "activated" : "suspended"}`);
      fetchUsers();
    } catch {
      showToast("Status update failed", "error");
    }
  }

  const drawerOpen = drawerMode !== null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">Delete user?</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-in Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {drawerMode === "add" ? "Add new user" : "Edit user"}
              </h2>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-full cursor-pointer group overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-400 transition"
                >
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Preview" fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <p className="text-xs text-gray-400">Click to upload photo</p>
              </div>

              {/* Fields */}
              {[
                { label: "Full name", key: "name", type: "text", placeholder: "Jane Doe" },
                { label: "Email address", key: "email", type: "email", placeholder: "jane@example.com" },
                { label: "Phone number", key: "phone", type: "tel", placeholder: "+254 700 000 000" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(formData as Record<string, string>)[key] || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                  />
                </div>
              ))}

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Role</label>
                <div className="flex gap-2">
                  {(["guest", "staff", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setFormData((f) => ({ ...f, role: r }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        formData.role === r
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Account status</label>
                <div className="flex gap-2">
                  {(["active", "suspended"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormData((f) => ({ ...f, status: s }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        formData.status === s
                          ? s === "active"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-red-500 border-red-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={closeDrawer}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveUser}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition"
              >
                {saving ? "Saving…" : drawerMode === "add" ? "Add user" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-400 mt-0.5">{users.length} total accounts</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add user
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email…"
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {["all", "admin", "staff", "guest"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  roleFilter === r
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3.5 text-left">User</th>
                  <th className="px-5 py-3.5 text-left hidden md:table-cell">Phone</th>
                  <th className="px-5 py-3.5 text-left">Role</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-left hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => {
                  const imageSrc = user.photo?.trim() ? user.photo : "/avatar.png";
                  return (
                    <tr key={user._id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                            <Image src={imageSrc} alt={user.name} fill sizes="40px" className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                        {user.phone || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role || "guest"]}`}>
                          {user.role || "guest"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.status === "suspended"
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === "suspended" ? "bg-red-400" : "bg-emerald-400"
                            }`}
                          />
                          {user.status === "suspended" ? "Suspended" : "Active"}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(user)}
                            title="Edit user"
                            className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Toggle status */}
                          <button
                            onClick={() => toggleStatus(user)}
                            title={user.status === "active" ? "Suspend account" : "Activate account"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                              user.status === "active"
                                ? "hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                                : "hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"
                            }`}
                          >
                            {user.status === "active" ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(user._id)}
                            title="Delete user"
                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 text-right">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
}